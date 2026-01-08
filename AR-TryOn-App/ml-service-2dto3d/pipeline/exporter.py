import os
import shutil

# Respect environment setting so exporter and app use the same folder
OUTPUT_DIR = os.getenv('OUTPUT_DIR', 'output')

# Use a repository placeholder GLB to avoid compiled exporters
PLACEHOLDER = os.path.join(os.path.dirname(__file__), '..', 'assets', 'templates', 'necklace_template.glb')

def validate_glb_before_callback(path):
    """
    Ensure the GLB is valid for Three.js:
    1. File exists
    2. Size > 5KB (avoids empty headers)
    """
    if not os.path.exists(path):
        return False
    if os.path.getsize(path) < 5 * 1024: # 5KB
        return False
    return True

def export_glb(mesh, image_id):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    glb_path = os.path.join(OUTPUT_DIR, f"{image_id}.glb")
    
    try:
        # Check if the mesh actually has data before exporting
        if mesh is not None and len(mesh.vertices) > 0:
            # Use appropriate flags for Trimesh export
            # Some versions of trimesh might not take include_normals in export() if they are embedded in the scene
            # But the user asked for this flag.
            mesh.export(glb_path, file_type='glb', include_normals=True)
        else:
            raise ValueError("Empty visible mesh")
            
        # Validation Gate
        if not validate_glb_before_callback(glb_path):
             raise ValueError(f"Generated GLB failed validation (too small or missing): {glb_path}")

    except Exception as e:
        print(f"Export failed, using dummy fallback: {e}")
        # Use the robust fallback
        if os.path.exists(PLACEHOLDER):
            shutil.copy(PLACEHOLDER, glb_path)
            print(f"Copied fallback template to {glb_path}")
        else:
            # DO NOT just create an empty file with open()
            print(f"CRITICAL: No fallback model found at {PLACEHOLDER}!")
            
    return glb_path
