import torch
from safetensors.torch import save_file
import os

# Paths relative to your project root
ckpt_path = r"checkpoints/instant-mesh/instant_mesh_base.ckpt"
safe_path = r"checkpoints/instant-mesh/instant_mesh_base.safetensors"

if os.path.exists(ckpt_path):
    print("🔄 Converting InstantMesh to SafeTensors (Bypassing Security Block)...")
    # Load the checkpoint (one-time use of weights_only=False)
    checkpoint = torch.load(ckpt_path, map_location="cpu", weights_only=False)
    state_dict = checkpoint['state_dict'] if 'state_dict' in checkpoint else checkpoint
    
    # Save as Safetensors
    save_file(state_dict, safe_path)
    print(f"✅ SUCCESS! Created {safe_path}")
else:
    print(f"❌ Error: {ckpt_path} not found. Check your folders!")