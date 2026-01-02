import trimesh
import numpy as np
from PIL import Image
import os
from skimage import measure

def generate_simple_mesh(image_path: str, output_dir: str, product_id: str):
    """
    Generates a simple 3D mesh by extruding the 2D image silhouette.
    Used as a fallback if the advanced ML model fails.
    """
    try:
        print(f"⚠️ Using Fallback Simple Mesh Generator for {product_id}")
        
        # Load image
        img = Image.open(image_path).convert('RGBA')
        # Resize for speed
        img.thumbnail((512, 512))
        
        # Get alpha mask
        arr = np.array(img)
        alpha = arr[:, :, 3]
        
        # Find contours
        contours = measure.find_contours(alpha, 100)
        
        if not contours:
            print("❌ No contours found in image")
            return None
            
        # Take largest contour
        longest_c = max(contours, key=len)
        
        # Simplify contour
        # Scikit-image returns (row, col) ie (y, x). Trimesh expects (x, y).
        vertices_2d = np.fliplr(longest_c)
        # Flip Y to match image coordinates
        vertices_2d[:, 1] *= -1
        
        # Create Path2D and extrude
        path = trimesh.load_path(vertices_2d)
        mesh = path.extrude(amount=20)
        
        # Apply texture color (average color of image)
        avg_color = arr[arr[:,:,3] > 0].mean(axis=0).astype(int)
        mesh.visual.face_colors = avg_color
        
        # Center mesh
        mesh.apply_translation(-mesh.centroid)
        
        # Scale to reasonable size (approx 10 units wide)
        extents = mesh.extents
        if extents[0] > 0:
            scale = 10.0 / extents[0]
            mesh.apply_scale(scale)
            
        # Export
        out_path = os.path.join(output_dir, f"{product_id}.glb")
        mesh.export(out_path)
        
        print(f"✅ Fallback Mesh Generated: {out_path}")
        return out_path
        
    except Exception as e:
        print(f"❌ Fallback Generator Failed: {e}")
        import traceback
        traceback.print_exc()
        return None
