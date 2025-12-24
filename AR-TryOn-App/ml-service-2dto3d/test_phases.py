"""
Test script to verify Phase 1 and Phase 2 execution
"""
import os
import sys
from PIL import Image

# Add InstantMesh to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "InstantMesh"))

# Import the mesh generator
from pipeline.mesh_generator import generate_mesh

# Create a simple test image
test_image_path = os.path.join(BASE_DIR, "output", "test_input.png")
os.makedirs(os.path.join(BASE_DIR, "output"), exist_ok=True)

# Create a simple white square image
img = Image.new('RGB', (256, 256), color='white')
img.save(test_image_path)

print("=" * 60)
print("TESTING PHASE 1 AND PHASE 2")
print("=" * 60)

# Run the mesh generation
output_dir = os.path.join(BASE_DIR, "output")
product_id = "test_product_123"

try:
    result_path = generate_mesh(test_image_path, output_dir, product_id)
    print("\n" + "=" * 60)
    print(f"✅ FINAL RESULT: {result_path}")
    print("=" * 60)
except Exception as e:
    print("\n" + "=" * 60)
    print(f"❌ ERROR: {e}")
    print("=" * 60)
    import traceback
    traceback.print_exc()
