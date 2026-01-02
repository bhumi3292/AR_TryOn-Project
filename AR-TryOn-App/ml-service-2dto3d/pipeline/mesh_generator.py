import os
import logging
import numpy as np
import open3d as o3d
import cv2
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
        
        # 3. Geometric Lifting
        # Normalize Depth (0..1)
        d_min, d_max = np.min(depth_array), np.max(depth_array)
        depth_norm = (depth_array - d_min) / (d_max - d_min + 1e-6)
        
        # Z-mapping
        z_depth = 1.6 - (depth_norm * 0.6) 
        
        # Create PointCloud
        o3d_color = o3d.geometry.Image(np.array(rgb_image))
        o3d_depth = o3d.geometry.Image(z_depth.astype(np.float32))
        rgbd = o3d.geometry.RGBDImage.create_from_color_and_depth(
            o3d_color, o3d_depth, depth_scale=1.0, depth_trunc=10.0, convert_rgb_to_intensity=False
        )
        intrinsic = o3d.camera.PinholeCameraIntrinsic(width, height, width, width, width/2, height/2)
        pcd = o3d.geometry.PointCloud.create_from_rgbd_image(rgbd, intrinsic)
        
        # SOR Cleanup
        pcd, _ = pcd.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)
        pcd.estimate_normals()
        pcd.orient_normals_towards_camera_location(camera_location=np.array([0., 0., 0.]))
        
        # 4. Reconstruction (Poisson)
        logger.info("Running Poisson Reconstruction...")
        mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=8, width=0, scale=1.1, linear_fit=False)
        
        # Trim low density
        densities = np.asarray(densities)
        mask = densities < np.quantile(densities, 0.1)
        mesh.remove_vertices_by_mask(mask)
        
        # 5. Hole Carving
        mesh = self._carve_holes_using_mask(mesh, input_image_path)
        
        # 6. Dimensions & Cleanup
        mesh.remove_degenerate_triangles()
        mesh.compute_vertex_normals()
        
        # Decimate if heavy
        if len(mesh.triangles) > 40000:
             mesh = mesh.simplify_quadric_decimation(40000)
             
        # --- NORMALIZATION & SCALING ---
        # 1. Center at Origin
        center = mesh.get_center()
        mesh.translate(-center)
        
        # 2. Normalize to Unit Box
        max_bound = mesh.get_max_bound()
        min_bound = mesh.get_min_bound()
        dims = max_bound - min_bound
        max_dim = np.max(dims)
        
        if max_dim == 0: raise ValueError("Mesh has 0 volume")
        mesh.scale(1.0 / max_dim, center=(0,0,0)) # Now fits in 1x1x1 box
        
        # 3. Apply Category-Specific Real-World Scale (Meters)
        # Necklace: ~12-15cm wide
        # Earring: ~3-5cm tall
        if "ear" in category.lower():
            target_size = 0.04 # 4cm
        else:
            target_size = 0.14 # 14cm
            
        mesh.scale(target_size, center=(0,0,0))
        logger.info(f"Scaled mesh to target size: {target_size}m")
        
        # 7. Check Validity
        if len(mesh.vertices) < 100:
            raise ValueError("Mesh too sparse after cleanup")
        
        try:
            euler = mesh.get_euler_poincare_characteristic()
            logger.info(f"Euler Characteristic: {euler} (Topology Check)")
            # Single object ~ 2. Ring (torus) ~ 0.
        except:
            pass

        # 8. Export & PBR
        logger.info(f"Exporting to {output_path}")
        o3d.io.write_triangle_mesh(output_path, mesh)
        
        # Inject PBR
        self._inject_pbr(output_path)
        
        return {
            "vertices": len(mesh.vertices),
            "faces": len(mesh.triangles),
            "depth_confidence": depth_conf
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
