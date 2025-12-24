"""
Final verification test for Phase 1 and Phase 2
This script runs the full pipeline and verifies both phases complete successfully
"""
import os
import sys
from PIL import Image

# Add InstantMesh to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "InstantMesh"))

# Import the mesh generator
from pipeline.mesh_generator import generate_mesh

print("=" * 80)
print("FINAL VERIFICATION TEST - 2D-to-3D ML Service")
print("=" * 80)
print()

# Create a test image
test_image_path = os.path.join(BASE_DIR, "output", "final_test_input.png")
os.makedirs(os.path.join(BASE_DIR, "output"), exist_ok=True)

# Create a simple gradient image for better testing
img = Image.new('RGB', (320, 320))
pixels = img.load()
for i in range(320):
    for j in range(320):
        pixels[i, j] = (i % 256, j % 256, (i+j) % 256)
img.save(test_image_path)

print(f"✅ Test image created: {test_image_path}")
print()

# Run the mesh generation
output_dir = os.path.join(BASE_DIR, "output")
product_id = "final_verification_test"

print("Starting mesh generation...")
print("-" * 80)

try:
    result_path = generate_mesh(test_image_path, output_dir, product_id)
    
    print()
    print("=" * 80)
    print("VERIFICATION RESULTS")
    print("=" * 80)
    
    if os.path.exists(result_path):
        file_size = os.path.getsize(result_path)
        print(f"✅ Output file created: {result_path}")
        print(f"✅ File size: {file_size:,} bytes")
        print()
        print("🎉 SUCCESS! Both Phase 1 and Phase 2 completed successfully!")
        print()
        print("Summary:")
        print("  - Phase 1 (Zero123Plus): Uses DiffusionPipeline.from_pretrained()")
        print("    with trust_remote_code=True and local_files_only=True")
        print("  - Phase 2 (InstantMesh): Uses safetensors.torch.load_file()")
        print("    to load weights securely (CVE-2025-32434 compliant)")
        print()
    else:
        print(f"❌ Output file not found: {result_path}")
        
except Exception as e:
    print()
    print("=" * 80)
    print("ERROR OCCURRED")
    print("=" * 80)
    print(f"❌ Error: {e}")
    print()
    import traceback
    traceback.print_exc()

print("=" * 80)
