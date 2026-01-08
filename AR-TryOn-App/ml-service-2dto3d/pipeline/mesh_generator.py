import os
import io
import logging
import numpy as np
import open3d as o3d
import cv2
import trimesh
from rembg import remove as rembg_remove
from PIL import Image
from trimesh.visual.material import PBRMaterial
from scipy.ndimage import gaussian_filter
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
    3. Grid Generation & Masking
    4. Extrusion (Thickness)
    5. PBR Material Injection (Gold)
    6. Validation (Vertex Count)
    """

    def __init__(self, model_dir: str | None = None):
        self.validator = SegmentationValidator()
        logger.info("MeshGenerator initialized.")

    def generate_mesh(self, input_image_path: str, output_path: str, category: str = "necklace", resolution: int = 256) -> dict:
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
        # Force high resolution for geometry quality
        res = max(int(resolution), 256) 

        depth_np = np.array(depth_array)
        # Resize to resolution x resolution
        depth_res = cv2.resize(depth_np.astype(np.float32), (res, res), interpolation=cv2.INTER_LINEAR)
        alpha_res = cv2.resize(alpha_full, (res, res), interpolation=cv2.INTER_NEAREST)

        # Depth normalization
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

        # Apply light Gaussian blur to smooth noisy depth
        try:
            # Use SCIPY Gaussian Filter per instruction for better smoothing
            depth_norm = gaussian_filter(depth_norm, sigma=1)
        except Exception:
            try:
                depth_norm = cv2.GaussianBlur(depth_norm, (5, 5), 0)
            except: pass

        # Map normalized depth to small relief (meters)
        # We start flat-ish because we will extrude
        relief_max = 0.02 
        z_grid = depth_norm * relief_max

        # Alpha cleanup
        try:
            kernel = np.ones((3, 3), np.uint8)
            alpha_clean = cv2.morphologyEx((alpha_res > 127).astype(np.uint8), cv2.MORPH_OPEN, kernel)
        except Exception:
            alpha_clean = (alpha_res > 127).astype(np.uint8)

        # Determine valid pixels
        # STRICT CONFIDENCE MASK: Alpha > 0.9 (approx 230/255)
        # Using alpha_res (which is 0-255)
        valid_mask = alpha_res > 230
        
        # Also ensure depth > 0 to avoid zero-depth artifacts
        valid_mask = valid_mask & (depth_norm > 1e-4)

        if valid_mask.sum() == 0:
            raise ValueError("No foreground pixels after background removal")

        # Create vertices for the grid
        xs = np.linspace(-0.5, 0.5, res)
        ys = np.linspace(-0.5, 0.5, res) # Note: Y logic might need flip if image coordinates are Y-down
        # In 3D, usually Y is up. Image is Y down. Let's map image Y to -Y in 3D.
        
        xv, yv = np.meshgrid(xs, ys)
        
        # We only keep vertices where alpha > threshold
        # To create a proper mesh, we can create a full grid and then remove faces, or keep points.
        # But for 'extrude', trimesh usually expects a polygon. 
        # Since we have heightmap data (relief), we are effectively making a displacement map.
        
        # Approach: Create points, triangulation, then extrude? 
        # Trimesh 'extrude' works on 2D Path/Polygon.
        # We have 3D relief. 
        # The user instruction `mesh = mesh.extrude(0.005)` implies `mesh` is a surface (Trimesh object).
        # So first we build the surface mesh from the heightmap.
        
        # Build Quad Mesh
        rows, cols = res, res
        
        # Vertices: (N, 3)
        # Flatten
        flat_x = xv.flatten()
        flat_y = -yv.flatten() # Flip Y to match image upright
        flat_z = z_grid.flatten()
        
        vertices = np.column_stack((flat_x, flat_y, flat_z))
        
        # Valid vertices mask
        flat_mask = valid_mask.flatten()
        
        # We will create faces only for valid quads
        faces = []
        for r in range(rows - 1):
            for c in range(cols - 1):
                if valid_mask[r, c] and valid_mask[r, c+1] and valid_mask[r+1, c] and valid_mask[r+1, c+1]:
                    # Indices
                    i = r * cols + c
                    i_right = i + 1
                    i_down = i + cols
                    i_down_right = i_down + 1
                    
                    # Two triangles
                    faces.append([i, i_right, i_down])
                    faces.append([i_right, i_down_right, i_down])
        
        if not faces:
            raise ValueError("Could not generate any faces from the mask.")
            
        faces = np.array(faces)
        
        # Create surface mesh
        surface_mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
        
        # Clean up unreferenced vertices (masked out ones)
        surface_mesh.remove_unreferenced_vertices()
        
        # Check Vertex Count (Root Cause 1)
        if len(surface_mesh.vertices) < 1000:
             raise ValueError(f"Mesh geometry too simple ({len(surface_mesh.vertices)} vertices). Resolution increase required.")

        # Add Physical Thickness (Root Cause 2)
        # Extrude the surface. Using trimesh's extrude for a mesh? 
        # trimesh.Trimesh doesn't have .extrude() that behaves like "thicken".
        # The user might be thinking of "extrude_polygon" or a custom operation.
        # However, for a heightmap mesh, we can "extrude" by duplicating vertices and stitching edges.
        # OR we can assume the user wants `mesh.extrude` if they used a Path2D.
        # Given we have a 3D surface, we need to "solidify" it.
        # Let's simple duplicate the mesh, offset it, and stitch boundaries.
        
        # Calculate thickness vector (negative Z)
        thickness = 0.005 # 5mm
        
        # Helper to solidify
        # Front face is surface_mesh. Back face is offset.
        # But we need to flip back face normals.
        
        front = surface_mesh.copy()
        back = surface_mesh.copy()
        
        # Offset back
        back.vertices[:, 2] -= thickness
        # Flip normals of back
        back.faces = np.fliplr(back.faces)
        
        # Combine
        solid_mesh = trimesh.util.concatenate([front, back])
        
        # Stitch edges? This is complex for arbitrary meshes. 
        # But since we built it from a grid, boundaries are predictable?
        # A simpler way ensuring watertightness is to rely on validation or specialized solidify algos.
        # BUT, the user specifically asked for "mesh = mesh.extrude(0.005)".
        # Wait, if `mesh` was a Path2D, `extrude` works. 
        # If the user is instructing `mesh.extrude`, and `mesh` is a Trimesh... 
        # Trimesh (the library) does not have `extrude` on the Trimesh object itself in standard versions.
        # IT DOES HAVE `trimesh.creation.extrude_polygon`.
        
        # ALTERNATIVE: Use the polygon extraction logic which allows true extrusion.
        # Extract contours -> Polygon -> Extrude.
        # This loses interior depth relief (detail) but guarantees a solid block.
        # The prompt says: "Jewelry cannot be a 2D plane. Use trimesh to extrude...".
        # If we keep the surface relief, we must stitch.
        # Let's try to preserve relief if possible, but reliability is key.
        # "Reconstructed meshes do not have valid UV maps. DO NOT EXPORT TEXTURES."
        
        # Let's use the solidify approach (Front + Back + Side strip)
        # Getting naked edges (boundary)
        start_edges = surface_mesh.edges_unique
        # This is expensive/complex.
        
        # Let's Pivot to the "Contours" approach if relief is not strictly required or if we can map relief later.
        # But "Depth Estimation" step implies relief is wanted.
        # Let's just output the FRONT surface for now, but with BackFACE culling disabled?
        # No, "paper-thin" is the complaint.
        
        # Let's try to assume `trimesh` might have a way or I implement a simple stitcher.
        # Actually, for the sake of the "Invisible" problem, a double-sided mesh is often enough?
        # "Extruding the mesh gives it sides... making it visible from all angles".
        
        # I will implement a robust "Solidify" logic.
        # 1. Front Mesh
        # 2. Back Mesh (offset Z)
        # 3. Find boundary edges of Front.
        # 4. Create quads connecting Front boundary to Back boundary.
        
        # Find boundary edges: edges used only once.
        unique_edges = surface_mesh.edges_sorted.reshape(-1)
        # Count occurrences
        counts = np.bincount(unique_edges) # checks vertices? No.
        
        # Use trimesh's built-in
        boundary_edges = surface_mesh.edges[trimesh.grouping.group_rows(surface_mesh.edges_sorted, require_count=1)]
        
        # Create side faces
        n_verts = len(surface_mesh.vertices)
        side_faces = []
        for e in boundary_edges:
            # e has [i1, i2]
            # corresponding back vertices are [i1+n, i2+n]
            # ordering for normal Out:
            # We want side wall.
            # Triangle 1: i1, i2, i2+n
            # Triangle 2: i1, i2+n, i1+n
            # Check winding order? Usually CCW.
            i1, i2 = e
            side_faces.append([i1, i2, i2 + n_verts])
            side_faces.append([i1, i2 + n_verts, i1 + n_verts])
            
            # Note: winding might need check based on edge direction. 
            # `boundary_edges` might not be ordered.
            
        side_faces = np.array(side_faces)
        
        # Combine everything
        full_vertices = np.vstack([surface_mesh.vertices, back.vertices])
        full_faces = np.vstack([surface_mesh.faces, back.faces + n_verts, side_faces])
        
        solid_mesh = trimesh.Trimesh(vertices=full_vertices, faces=full_faces, process=True)
        # Fix normals
        solid_mesh.fix_normals()
        
        # Root Cause 4: Center and Normalize Scale
        solid_mesh.apply_translation(-solid_mesh.centroid)
        # Scale to max dim 0.15 (15cm)
        max_limit = 0.15
        current_max = np.max(solid_mesh.extents)
        if current_max > 0:
            scale_fac = max_limit / current_max
            solid_mesh.apply_scale(scale_fac)
            
        # Root Cause 3: Fix Material & UV Logic
        # Assign PBR Material directly
        # Note: trimesh.visual.material.PBRMaterial might be stripped on export if not supported by exporter or format.
        # But we will set it.
        
        try:
             # Luxury Gold
             gold_mat = PBRMaterial(
                baseColorFactor=[212/255, 175/255, 55/255, 1.0],
                metallicFactor=1.0,
                roughnessFactor=0.2
             )
             solid_mesh.visual.material = gold_mat
        except Exception:
             logger.warning("Could not create PBRMaterial object. Proceeding without explicit PBR object.")
             # Fallback: Vertex colors? No, user says "DO NOT EXPORT TEXTURES".
             # If we can't set PBR, we leave it blank, and maybe injecting later or relying on default.
             pass

        # Export
        logger.info(f"Exporting solid mesh ({len(solid_mesh.vertices)} vertices) to {output_path}")
        
        # Ensure directory
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        solid_mesh.export(output_path, file_type='glb', include_normals=True)
        
        return {
            'vertices': len(solid_mesh.vertices),
            'faces': len(solid_mesh.faces),
            'depth_confidence': depth_conf
        }

if __name__ == "__main__":
    pass
