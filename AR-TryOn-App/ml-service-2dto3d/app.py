import sys
import os
import threading
import shutil
import torch
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import urllib.request
import json

if sys.platform == 'win32':
    torch_bin = os.path.join(os.path.dirname(torch.__file__), 'bin')
    if os.path.exists(torch_bin): os.add_dll_directory(torch_bin)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANT_MESH_BASE = os.path.join(BASE_DIR, "InstantMesh")
if INSTANT_MESH_BASE not in sys.path: sys.path.insert(0, INSTANT_MESH_BASE)

from pipeline.image_cleaner import clean_image
from pipeline.mesh_generator import generate_mesh

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)
app.mount(f"/{OUTPUT_DIR}", StaticFiles(directory=OUTPUT_DIR), name="output")

NODE_CALLBACK_URL = "http://127.0.0.1:5000/api/ml/callback"
OUTPUT_BASE_URL = "http://127.0.0.1:8000/output"

def run_full_ml_logic(asset_id, input_path, category):
    try:
        print(f"🧼 [1/3] Cleaning background for {category}: {asset_id}...")
        cleaned_path = clean_image(input_path)
        
        print(f"🤖 [2/3] Generating 3D Mesh for {category}...")
        raw_mesh_path = generate_mesh(cleaned_path, OUTPUT_DIR, asset_id, category)

        if raw_mesh_path:
            send_callback(asset_id, f"{OUTPUT_BASE_URL}/{asset_id}.glb", "completed")
            print(f"✨ ALL STEPS COMPLETE for {asset_id}")
        else:
            send_callback(asset_id, None, "failed")
    except Exception as e:
        print(f"❌ PIPELINE ERROR: {e}")
        send_callback(asset_id, None, "failed")

def send_callback(asset_id, public_url, status):
    payload = {"jewelryId": asset_id, "model3DUrl": public_url, "conversionStatus": status}
    try:
        headers = {'Content-Type': 'application/json', 'x-ml-api-key': 'ml-callback-secret'}
        req = urllib.request.Request(NODE_CALLBACK_URL, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as resp: print(f'✅ Callback: {resp.status}')
    except Exception as e: print('❌ Callback failed:', e)

@app.post("/convert-2d-to-3d")
async def convert_image(file: UploadFile = File(...), product_id: str = Form(...), category: str = Form("necklace")):
    asset_id = str(product_id)
    input_path = os.path.join(OUTPUT_DIR, f"{asset_id}_input.png")
    with open(input_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    threading.Thread(target=run_full_ml_logic, args=(asset_id, input_path, category.lower()), daemon=True).start()
    return {"success": True, "asset_id": asset_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)