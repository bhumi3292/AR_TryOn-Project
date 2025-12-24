"""
Test Phase 1 (Zero123Plus) only to see exact error
"""
import os
import sys
import torch
from PIL import Image
from diffusers import DiffusionPipeline, EulerAncestralDiscreteScheduler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_MODEL_DIR = os.path.join(BASE_DIR, "models", "zero123plus")

print("=" * 80)
print("TESTING PHASE 1: Zero123Plus Pipeline")
print("=" * 80)
print(f"Model directory: {LOCAL_MODEL_DIR}")
print(f"Directory exists: {os.path.exists(LOCAL_MODEL_DIR)}")
print()

# Create test image
test_image_path = os.path.join(BASE_DIR, "output", "test_phase1.png")
os.makedirs(os.path.join(BASE_DIR, "output"), exist_ok=True)
input_image = Image.new('RGB', (256, 256), color='white')
input_image.save(test_image_path)

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == 'cuda' else torch.float32

print(f"Device: {device}")
print(f"Dtype: {dtype}")
print()

try:
    print("Loading pipeline with DiffusionPipeline.from_pretrained()...")
    print(f"  - local_files_only=True")
    print(f"  - trust_remote_code=True")
    print()
    
    pipeline = DiffusionPipeline.from_pretrained(
        LOCAL_MODEL_DIR, 
        torch_dtype=dtype,
        local_files_only=True,
        trust_remote_code=True
    ).to(device)
    
    print("✅ Pipeline loaded successfully!")
    print(f"Pipeline type: {type(pipeline)}")
    print()
    
    pipeline.scheduler = EulerAncestralDiscreteScheduler.from_config(
        pipeline.scheduler.config, timestep_spacing='trailing'
    )
    
    print("Running inference...")
    input_image = Image.open(test_image_path).convert('RGB')
    mv_out = pipeline(input_image, num_inference_steps=30)
    mv_result = mv_out.images[0]
    
    print("✅ Phase 1 Successful!")
    print(f"Output image size: {mv_result.size}")
    
except Exception as e:
    print(f"⚠️ Phase 1 Error: {e}")
    print()
    print("Full traceback:")
    import traceback
    traceback.print_exc()
