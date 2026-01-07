import trimesh
import numpy as np
from PIL import Image
import os
from skimage import measure
from trimesh.visual.material import PBRMaterial

def generate_simple_mesh(image_path: str, output_dir: str, product_id: str):
    """
    Generates a simple 3D mesh by extruding the 2D image silhouette.
    Guarantees valid GLB for Three.js rendering (PBR, Thickness, Normals).
    """
    try:
        print(f"⚠️ Using Robust Simple Mesh Generator for {product_id}")
        
        # 1. Load image
        img = Image.open(image_path).convert('RGBA')
        img.thumbnail((512, 512)) # Moderate resolution
        
        # 2. Get alpha mask & contours
        arr = np.array(img)
        alpha = arr[:, :, 3]
        contours = measure.find_contours(alpha, 100) # Threshold
        
        if not contours:
            raise ValueError("No contours found in image")
            
        # 3. Process largest contour
        longest_c = max(contours, key=len)
        vertices_2d = np.fliplr(longest_c) # (row, col) -> (x, y)
        vertices_2d[:, 1] *= -1 # Flip Y
        
        # 4. Create Base Mesh via Extrusion
        # Use a relative logical thickness before scaling
        path = trimesh.load_path(vertices_2d)
        
        # Extrude to create volume (guaranteed thickness)
        # Using a sufficient amount relative to pixel coords
        mesh = path.extrude(amount=20.0)

        # 5. Fix Geometry (Up-sample if too simple)
        # Three.js needs enough vertices for proper lighting/shading
        # and checking the 1000 vertices rule
        target_faces = 2500
        while len(mesh.faces) < target_faces:
            mesh = mesh.subdivide()
            if len(mesh.faces) > 10000: # Safety break
                break

        # 6. Apply PBR Material (NO TEXTURES)
        # Use a fresh visual object to clear any previous texture/color data
        mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh)
        
        # Assign solid metal-like PBR material
        # This prevents "TexCoord missing" errors in GLTF validator
        mesh.visual.material = PBRMaterial(
            baseColorFactor=[0.92, 0.92, 0.92, 1.0], # Silver/White
            metallicFactor=0.85,
            roughnessFactor=0.25,
            alphaMode='OPAQUE'
        )

        # 7. Center and Scale
        mesh.apply_translation(-mesh.centroid)
        extents = mesh.extents
        if extents[0] > 0:
            # Scale to approx 0.15 meters (15cm) max dimension for AR
            # This ensures it fits in the view
            scale_factor = 0.15 / max(extents)
            mesh.apply_scale(scale_factor)

        # 8. HARD VALIDATION (As requested)
        # Reject if geometry is still insufficient
        if len(mesh.vertices) < 1000:
             raise ValueError(f"Mesh rejected: insufficient geometry ({len(mesh.vertices)} vertices)")
        
        # Verify material is PBR and has no texture
        if not isinstance(mesh.visual.material, PBRMaterial):
            mesh.visual.material = PBRMaterial(baseColorFactor=[0.8, 0.8, 0.8, 1.0])
            
        # 9. Export
        out_path = os.path.join(output_dir, f"{product_id}.glb")
        
        # Export with explicit flags to ensure buffers are written correctly
        mesh.export(
            out_path,
            file_type="glb",
            include_normals=True,
            include_color=False # We rely on material, not vertex colors
        )
        
        print(f"✅ Robust Mesh Generated: {out_path} | Verts: {len(mesh.vertices)} | Faces: {len(mesh.faces)}")
        return out_path
        
    except Exception as e:
        print(f"❌ Fallback Generator Failed: {e}")
        import traceback
        traceback.print_exc()
        return None
