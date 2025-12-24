import os
import sys
import torch
import gc
import numpy as np
from PIL import Image
import trimesh
from diffusers import DiffusionPipeline, EulerAncestralDiscreteScheduler
from omegaconf import OmegaConf
from safetensors.torch import load_file
from einops import rearrange

# 1. Windows CUDA Setup
if sys.platform == 'win32':
    os.environ["FORCE_CUDA"] = "1"
    os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:128"
    torch_bin = os.path.join(os.path.dirname(torch.__file__), 'bin')
    if os.path.exists(torch_bin):
        os.add_dll_directory(torch_bin)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.utils.train_util import instantiate_from_config
from src.utils.camera_util import get_zero123plus_input_cameras

def generate_mesh(image_path: str, output_dir: str, product_id: str, category: str = "necklace") -> str:
    print(f"--- Starting 3D Generation for {category.upper()} ---")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    RECON_SAFE_PATH = os.path.join(BASE_DIR, "checkpoints", "instant-mesh", "instant_mesh_base.safetensors")
    LOCAL_MODEL_DIR = os.path.join(BASE_DIR, "models", "zero123plus")

    # --- Phase 1: 6-View Generation ---
    try:
        pipeline = DiffusionPipeline.from_pretrained(
            LOCAL_MODEL_DIR, 
            torch_dtype=torch.float16, 
            local_files_only=True, 
            trust_remote_code=True, 
            custom_pipeline=os.path.join(LOCAL_MODEL_DIR, "pipeline.py")
        ).to(device)
        pipeline.scheduler = EulerAncestralDiscreteScheduler.from_config(pipeline.scheduler.config, timestep_spacing='trailing')
        
        raw_img = Image.open(image_path).convert('RGB')
        mv_result = pipeline(raw_img, num_inference_steps=30).images[0]
        
        del pipeline
        gc.collect()
        torch.cuda.empty_cache()
        print("✅ Phase 1 Successful.")
    except Exception as e: 
        print(f"⚠️ Phase 1 Error: {e}")
        return ""

    # --- Phase 2: Building 3D Mesh ---
    print("--- Phase 2: Building 3D Mesh ---")
    out_path = os.path.join(output_dir, f"{product_id}.glb")
    try:
        cfg = OmegaConf.load(os.path.join(BASE_DIR, "InstantMesh", "configs", "instant-mesh-base.yaml"))
        model = instantiate_from_config(cfg.model_config).to(device)
        model.init_flexicubes_geometry(device)
        model.load_state_dict({k.replace('model.', ''): v for k, v in load_file(RECON_SAFE_PATH, device=str(device)).items()}, strict=False)
        model.eval()

        with torch.no_grad():
            images = torch.from_numpy(np.array(mv_result.resize((640, 960))).astype(np.float32) / 255.0).permute(2, 0, 1).unsqueeze(0).to(device)
            images = rearrange(images, 'b c (n h) (m w) -> b (n m) c h w', n=3, m=2)
            cameras = get_zero123plus_input_cameras(batch_size=1).to(device)
            planes = model.forward_planes(images, cameras)
            
            # Category-based Resolution
            extract_res = 192 if category == "nosepin" else 128
            print(f"Extracting mesh at resolution: {extract_res}")
            vertices, faces, vertex_colors = model.extract_mesh(planes, use_texture_map=False, resolution=extract_res)

        # --- Phase 3: Cleanup Logic (FIXED FOR NUMPY ERROR) ---
        print(f"🧼 [Cleanup] Processing {category} mesh...")
        
        # Safety check: convert to numpy ONLY if they are still torch tensors
        v = vertices.cpu().numpy() if hasattr(vertices, 'cpu') else vertices
        f = faces.cpu().numpy() if hasattr(faces, 'cpu') else faces
        c = vertex_colors.cpu().numpy() if hasattr(vertex_colors, 'cpu') else vertex_colors

        mesh = trimesh.Trimesh(vertices=v, faces=f, vertex_colors=c, process=False)

        # 1. Remove floating noise (Spikes)
        components = mesh.split(only_watertight=False)
        if len(components) > 1:
            print(f"   - Removing {len(components)-1} disconnected noise fragments...")
            mesh = max(components, key=lambda x: len(x.vertices))

        # 2. Category-based Smoothing & Scaling
        if category == "nosepin":
            trimesh.smoothing.filter_humphrey(mesh, iterations=1) 
            mesh.apply_scale(1.5) 
        elif category == "earring":
            trimesh.smoothing.filter_humphrey(mesh, iterations=2)
            mesh.apply_scale(1.2)
        else: # Necklace
            trimesh.smoothing.filter_humphrey(mesh, iterations=4) 

        # 4. Final Export
        mesh.export(out_path)
        
        # Final memory cleanup
        del model, planes, images, cameras, mesh
        gc.collect()
        torch.cuda.empty_cache()
        
        print(f"✅ SUCCESS: {out_path}")
        return out_path

    except Exception as e:
        import traceback
        traceback.print_exc()
        torch.cuda.empty_cache()
        print(f"⚠️ Phase 2 Error: {e}")
        return ""