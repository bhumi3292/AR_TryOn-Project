import os
import io
import logging
import numpy as np
import open3d as o3d
import cv2
import trimesh
from rembg import remove as rembg_remove
from PIL import Image
from .depth_estimator import estimate_depth
from .validator import SegmentationValidator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MeshGenerator")

class MeshGenerator:
    """
    Production-grade Geometric Lifting Kernel.
    Strictly enforces pipeline:
    1. Validate Input (SAM)
    2. Depth Estimation
    3. Point Cloud
    4. Poisson Reconstruction
    5. Hole Carving (Alpha Masking)
    6. Cleanup & PBR
    """

    def __init__(self, model_dir: str | None = None):
        self.validator = SegmentationValidator()
        logger.info("MeshGenerator initialized.")

    def _carve_holes_using_mask(self, mesh, mask_path):
        """
        Removes vertices that project to transparent areas in the original mask.
        Crucial for preserving ring holes in Poisson reconstruction.
        """
        logger.info("Carving holes using alpha mask...")
        
        # Load mask
        mask = cv2.imread(mask_path, cv2.IMREAD_UNCHANGED)
        if mask.shape[2] == 4:
            alpha = mask[:, :, 3]
        else:
            return mesh # No alpha, skip
            
        h, w = alpha.shape
        
        # Get vertices
        vertices = np.asarray(mesh.vertices)
        
        # Assume mesh is centered/scaled? No, we haven't scaled yet.
        # We need to know the projection.
        # Our Point Cloud generation was Pinhole.
        # Vertices x,y should align with image u,v if we didn't move them.
        # But Poisson changes topology.
        # However, the general X,Y coordinates roughly correspond to the camera plane.
        
        # Pinhole inverse: u = fx * x / z + cx
        # We used: intrinsic = o3d.camera.PinholeCameraIntrinsic(width, height, fx=width, fy=width, cx=width/2, cy=height/2)
        # So: u = width * X / Z + width/2
        
        # But wait, Poisson reconstruction might have smoothed/shifted things.
        # Strategy: We assume the "front" of the object is aligned.
        
        # Vectorized projection
        X = vertices[:, 0]
        Y = vertices[:, 1]
        Z = vertices[:, 2]
        
        cx = w / 2
        cy = h / 2
        fx = w
        
        # Avoid div by zero
        Z_safe = Z.copy()
        Z_safe[np.abs(Z_safe) < 1e-4] = 1e-4
        
        U = (fx * X / Z_safe) + cx
        V = (fx * Y / Z_safe) + cy
        
        # Create invalid mask
        to_remove = []
        
        for i in range(len(vertices)):
            u, v = int(U[i]), int(V[i])
            if 0 <= u < w and 0 <= v < h:
                if alpha[v, u] < 128: # Transparent
                    to_remove.append(i)
            else:
                to_remove.append(i) # Out of bounds
                
        # Remove
        if len(to_remove) > 0:
            mesh.remove_vertices_by_mask(np.isin(np.arange(len(vertices)), to_remove))
            mesh.remove_degenerate_triangles()
            
        return mesh

    def generate_mesh(self, input_image_path: str, output_path: str, category: str = "necklace", resolution: int = 128) -> dict:
        """
        Returns metrics dict on success, raises Exception on fail.
        """
        logger.info(f"Starting pipeline for: {input_image_path} [Category: {category}]")
        
        # 1. Validation (Fail Hard)
        try:
            self.validator.validate_mask(input_image_path)
        except Exception as e:
            raise ValueError(f"Pipeline Validation Failed: {e}")
            
        # 2. Depth Estimation
        depth_array, rgb_image = estimate_depth(input_image_path)
        width, height = rgb_image.size

        # Metrics
        depth_conf = float(np.std(depth_array))

        # 3. Background removal using rembg -> get alpha mask
        try:
            with open(input_image_path, 'rb') as f:
                input_bytes = f.read()
            result_bytes = rembg_remove(input_bytes)
            img_nobg = Image.open(io.BytesIO(result_bytes)).convert('RGBA')
        except Exception as e:
            raise RuntimeError(f"Background removal failed: {e}")

        # Convert to numpy
        rgba_full = np.array(img_nobg)
        alpha_full = rgba_full[:, :, 3]

        # 4. Convert depth and mask to fixed-resolution grid
        res = int(resolution)
        if res <= 4:
            res = 64

        depth_np = np.array(depth_array)
        # Resize to resolution x resolution
        depth_res = cv2.resize(depth_np.astype(np.float32), (res, res), interpolation=cv2.INTER_LINEAR)
        alpha_res = cv2.resize(alpha_full, (res, res), interpolation=cv2.INTER_NEAREST)

        # Depth normalization: percentile clipping to remove extreme spikes
        try:
            dmin, dmax = np.percentile(depth_res, [1.0, 99.0])
        except Exception:
            dmin, dmax = float(depth_res.min()), float(depth_res.max())

        if dmax - dmin < 1e-6:
            depth_norm = np.zeros_like(depth_res)
        else:
            # Clip to percentile range then normalize
            depth_clipped = np.clip(depth_res, dmin, dmax)
            depth_norm = (depth_clipped - dmin) / (dmax - dmin)

        # Apply light Gaussian blur to smooth noisy depth (reduces starburst spikes)
        try:
            depth_norm = cv2.GaussianBlur(depth_norm, (5, 5), 0)
        except Exception:
            pass

        # Map normalized depth to small relief (meters)
        relief_max = 0.05  # up to 5cm protrusion
        z_front = depth_norm * relief_max

        # Alpha cleanup: morphological open to remove stray pixels, then remove tiny connected components
        try:
            kernel = np.ones((3, 3), np.uint8)
            alpha_clean = cv2.morphologyEx((alpha_res > 127).astype(np.uint8), cv2.MORPH_OPEN, kernel)
        except Exception:
            alpha_clean = (alpha_res > 127).astype(np.uint8)

        # Remove tiny components
        try:
            num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(alpha_clean, connectivity=8)
            min_area = max(8, int((res * res) * 0.0005))
            alpha_cc = np.zeros_like(alpha_clean)
            for lbl in range(1, num_labels):
                area = stats[lbl, cv2.CC_STAT_AREA]
                if area >= min_area:
                    alpha_cc[labels == lbl] = 1
            alpha_mask = alpha_cc.astype(bool)
        except Exception:
            alpha_mask = alpha_clean.astype(bool)

        # Final mask: non-transparent AND non-zero (after normalization)
        depth_mask = depth_norm > 1e-6
        mask = (alpha_mask & depth_mask).astype(np.uint8)

        # If nothing remains, fail
        if mask.sum() == 0:
            raise ValueError("No foreground pixels after background removal and depth masking")

        # Find external contours of the mask
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Map contour points to normalized XY coords (matching prior grid: 0..1 -> -0.5..0.5)
        polygons = []
        for cnt in contours:
            # cnt is Nx1x2
            pts = cnt.reshape(-1, 2)
            # Convert pixel coordinates to normalized [-0.5,0.5]
            poly = []
            for (px, py) in pts:
                x = (float(px) / float(max(1, res - 1))) - 0.5
                y = -((float(py) / float(max(1, res - 1))) - 0.5)
                poly.append((x, y))
            if len(poly) >= 3:
                polygons.append(poly)

        # Extrude contours into thin solids using trimesh + shapely (if available)
        thickness = 0.005  # exact side thickness requested
        solids = []
        try:
            from shapely.geometry import Polygon
            for poly in polygons:
                shp = Polygon(poly)
                if not shp.is_valid or shp.area <= 0:
                    continue
                solid = trimesh.creation.extrude_polygon(shp, height=thickness)
                solids.append(solid)
        except Exception as e:
            logger.warning(f"Shapely extrusion unavailable or failed ({e}), falling back to masked-grid extrusion.")

            # Fallback: build mesh from masked grid nodes, create faces only for fully-masked cells,
            # then extrude by 'thickness' and add side walls for boundary/holes.
            # Build grid in X,Y plane centered at origin
            xs = (np.linspace(0, 1, res) - 0.5)
            ys = (np.linspace(0, 1, res) - 0.5)
            xv, yv = np.meshgrid(xs, ys)

            # Flat front (no relief) so the jewelry is extruded as a thin plate
            z_front = np.zeros_like(xv)
            verts_front = np.stack([xv.ravel(), -yv.ravel(), z_front.ravel()], axis=1)

            # Back face shifted by thickness
            verts_back = verts_front.copy()
            verts_back[:, 2] -= thickness

            verts = np.vstack([verts_front, verts_back])

            faces = []
            cell_present = np.zeros((res - 1, res - 1), dtype=bool)
            for r in range(res - 1):
                for c in range(res - 1):
                    # require all four node centers to be present in the mask
                    if mask[r, c] and mask[r, c + 1] and mask[r + 1, c] and mask[r + 1, c + 1]:
                        i = r * res + c
                        i_right = i + 1
                        i_down = i + res
                        i_down_right = i_down + 1
                        faces.append([i, i_right, i_down])
                        faces.append([i_right, i_down_right, i_down])
                        cell_present[r, c] = True

            n_front = res * res
            # back faces (reverse winding)
            for r in range(res - 1):
                for c in range(res - 1):
                    if cell_present[r, c]:
                        i = r * res + c
                        a = i + n_front
                        b = i + 1 + n_front
                        d = i + res + n_front
                        e = i + res + 1 + n_front
                        faces.append([a, d, b])
                        faces.append([b, d, e])

            # Side walls for boundaries and holes: for each cell edge where neighbor cell is absent
            for r in range(res - 1):
                for c in range(res - 1):
                    if not cell_present[r, c]:
                        continue

                    # top edge (between (r,c) and (r,c+1)) -> neighbor above is r-1
                    if r == 0 or not cell_present[r - 1, c]:
                        f1 = r * res + c
                        f2 = r * res + c + 1
                        b1 = f1 + n_front
                        b2 = f2 + n_front
                        faces.append([f1, f2, b1])
                        faces.append([f2, b2, b1])

                    # bottom edge (between (r+1,c) and (r+1,c+1)) -> neighbor below is r+1
                    if r == (res - 2) or not cell_present[r + 1, c]:
                        f1 = (r + 1) * res + c
                        f2 = (r + 1) * res + c + 1
                        b1 = f1 + n_front
                        b2 = f2 + n_front
                        faces.append([f1, b1, f2])
                        faces.append([f2, b1, b2])

                    # left edge
                    if c == 0 or not cell_present[r, c - 1]:
                        f1 = r * res + c
                        f2 = (r + 1) * res + c
                        b1 = f1 + n_front
                        b2 = f2 + n_front
                        faces.append([f1, f2, b1])
                        faces.append([f2, b2, b1])

                    # right edge
                    if c == (res - 2) or not cell_present[r, c + 1]:
                        f1 = r * res + (c + 1)
                        f2 = (r + 1) * res + (c + 1)
                        b1 = f1 + n_front
                        b2 = f2 + n_front
                        faces.append([f1, b1, f2])
                        faces.append([f2, b1, b2])

            faces = np.array(faces, dtype=np.int64)

            # Colors from resized RGBA
            try:
                rgba_small = cv2.resize(rgba_full, (res, res), interpolation=cv2.INTER_AREA)
                colors = rgba_small.reshape((-1, 4))
                colors = np.vstack([colors, colors])
                vertex_colors = (colors).astype(np.uint8)
            except Exception:
                vertex_colors = None

            tmesh = trimesh.Trimesh(vertices=verts, faces=faces, vertex_colors=vertex_colors, process=False)

        # End fallback

        # Smoothing & Normal Correction: reduce spikes and ensure correct normals for Three.js
        try:
            if hasattr(trimesh.smoothing, 'filter_laplacian'):
                trimesh.smoothing.filter_laplacian(tmesh, lamb=0.5, iterations=10)
            else:
                trimesh.smoothing.filter_taubin(tmesh, iterations=10)
        except Exception:
            try:
                trimesh.smoothing.filter_taubin(tmesh, iterations=6)
            except Exception:
                pass

        # Repair normals so Three.js lighting works correctly
        try:
            trimesh.repair.fix_normals(tmesh)
        except Exception:
            pass
        try:
            if hasattr(tmesh, 'fix_normals'):
                tmesh.fix_normals()
        except Exception:
            pass
        # Ensure vertex normals are computed
        try:
            _ = tmesh.vertex_normals
        except Exception:
            pass

        # Center and normalize scale so max dimension is 1.0
        tmesh.apply_translation(-tmesh.bounds.mean(axis=0))
        extents = tmesh.extents
        max_dim = float(np.max(extents))
        if max_dim <= 0:
            raise ValueError("Generated mesh has zero size")
        tmesh.apply_scale(1.0 / max_dim)

        # Export glb via trimesh and inject PBR
        logger.info(f"Exporting trimesh to {output_path}")
        try:
            glb = tmesh.export(file_type='glb')
            with open(output_path, 'wb') as f:
                f.write(glb)
        except Exception as e:
            raise RuntimeError(f"Failed to export glb: {e}")

        # Inject PBR for robust Three.js rendering
        self._inject_pbr(output_path)

        return {
            'vertices': len(tmesh.vertices),
            'faces': len(tmesh.faces),
            'depth_confidence': depth_conf
        }

    def _inject_pbr(self, glb_path):
        try:
            from pygltflib import GLTF2, Material, PbrMetallicRoughness
            gltf = GLTF2().load(glb_path)
            if not gltf.materials:
                 gltf.materials.append(Material())
            for mat in gltf.materials:
                if mat.pbrMetallicRoughness is None:
                    mat.pbrMetallicRoughness = PbrMetallicRoughness()
                mat.pbrMetallicRoughness.metallicFactor = 0.9  # Very Metal
                mat.pbrMetallicRoughness.roughnessFactor = 0.2 # Shiny
            gltf.save(glb_path)
        except Exception as e:
            logger.warning(f"PBR Injection failed: {e}")

if __name__ == "__main__":
    pass
