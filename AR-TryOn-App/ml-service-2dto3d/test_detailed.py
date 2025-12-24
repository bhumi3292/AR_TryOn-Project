"""
Detailed test script to verify Phase 1 and Phase 2 execution
"""
import os
import sys
import io
from contextlib import redirect_stdout, redirect_stderr
from PIL import Image

# Add InstantMesh to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "InstantMesh"))

# Create a simple test image
test_image_path = os.path.join(BASE_DIR, "output", "test_detailed_input.png")
os.makedirs(os.path.join(BASE_DIR, "output"), exist_ok=True)

# Create a simple white square image
img = Image.new('RGB', (256, 256), color='white')
img.save(test_image_path)

print("=" * 80)
print("TESTING PHASE 1 AND PHASE 2 - DETAILED OUTPUT")
print("=" * 80)
print()

# Capture all output
output_buffer = io.StringIO()

# Import the mesh generator
from pipeline.mesh_generator import generate_mesh

# Run the mesh generation
output_dir = os.path.join(BASE_DIR, "output")
product_id = "test_detailed_123"

try:
    result_path = generate_mesh(test_image_path, output_dir, product_id)
    print("\n" + "=" * 80)
    print(f"✅ FINAL RESULT: {result_path}")
    print("=" * 80)
    
    # Check if file exists
    if os.path.exists(result_path):
        file_size = os.path.getsize(result_path)
        print(f"✅ File exists: {file_size:,} bytes")
    else:
        print(f"❌ File does not exist: {result_path}")
        
except Exception as e:
    print("\n" + "=" * 80)
    print(f"❌ ERROR: {e}")
    print("=" * 80)
    import traceback
    traceback.print_exc()
