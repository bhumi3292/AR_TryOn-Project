"""
Quick validation script to test the No-Compile fix
"""
import sys
import os

print("=" * 60)
print("VALIDATION TEST - No-Compile Fix")
print("=" * 60)

# Test 1: Check if nvdiffrast-main is accessible
print("\n[Test 1] Checking nvdiffrast-main path...")
nvdiffrast_path = os.path.join(os.getcwd(), 'nvdiffrast-main')
if os.path.exists(nvdiffrast_path):
    print(f"✅ nvdiffrast-main exists at: {nvdiffrast_path}")
else:
    print(f"❌ nvdiffrast-main NOT FOUND at: {nvdiffrast_path}")

# Test 2: Check PyTorch CUDA bin
print("\n[Test 2] Checking PyTorch CUDA bin...")
import torch
torch_bin = os.path.join(os.path.dirname(torch.__file__), 'bin')
if os.path.exists(torch_bin):
    print(f"✅ PyTorch bin exists: {torch_bin}")
    # List CUDA DLLs
    cuda_dlls = [f for f in os.listdir(torch_bin) if 'cuda' in f.lower() and f.endswith('.dll')]
    print(f"   Found {len(cuda_dlls)} CUDA DLLs")
    if cuda_dlls:
        print(f"   Sample: {cuda_dlls[0]}")
else:
    print(f"❌ PyTorch bin NOT FOUND: {torch_bin}")

# Test 3: Check system CUDA installation
print("\n[Test 3] Checking system CUDA 12.4...")
cuda_system_path = r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4\bin"
if os.path.exists(cuda_system_path):
    print(f"✅ System CUDA 12.4 exists: {cuda_system_path}")
else:
    print(f"⚠️  System CUDA 12.4 NOT FOUND: {cuda_system_path}")
    # Check for other CUDA versions
    cuda_root = r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA"
    if os.path.exists(cuda_root):
        versions = [d for d in os.listdir(cuda_root) if os.path.isdir(os.path.join(cuda_root, d))]
        print(f"   Found CUDA versions: {versions}")

# Test 4: Check Zero123Plus model directory
print("\n[Test 4] Checking Zero123Plus model...")
model_dir = os.path.join(os.getcwd(), 'models', 'zero123plus')
if os.path.exists(model_dir):
    print(f"✅ Zero123Plus model dir exists: {model_dir}")
    pipeline_py = os.path.join(model_dir, 'pipeline.py')
    model_index = os.path.join(model_dir, 'model_index.json')
    print(f"   pipeline.py exists: {os.path.exists(pipeline_py)}")
    print(f"   model_index.json exists: {os.path.exists(model_index)}")
else:
    print(f"❌ Zero123Plus model dir NOT FOUND: {model_dir}")

# Test 5: Check safetensors file
print("\n[Test 5] Checking InstantMesh safetensors...")
safetensors_path = os.path.join(os.getcwd(), 'checkpoints', 'instant-mesh', 'instant_mesh_base.safetensors')
if os.path.exists(safetensors_path):
    size_mb = os.path.getsize(safetensors_path) / (1024 * 1024)
    print(f"✅ Safetensors file exists: {safetensors_path}")
    print(f"   Size: {size_mb:.2f} MB")
else:
    print(f"❌ Safetensors file NOT FOUND: {safetensors_path}")

# Test 6: Try importing nvdiffrast
print("\n[Test 6] Attempting to import nvdiffrast...")
sys.path.insert(0, nvdiffrast_path)
try:
    import nvdiffrast
    print(f"✅ nvdiffrast imported successfully!")
    print(f"   Version: {getattr(nvdiffrast, '__version__', 'unknown')}")
except Exception as e:
    print(f"⚠️  nvdiffrast import failed: {e}")
    print("   This is expected if DLL dependencies are missing")

print("\n" + "=" * 60)
print("VALIDATION COMPLETE")
print("=" * 60)
