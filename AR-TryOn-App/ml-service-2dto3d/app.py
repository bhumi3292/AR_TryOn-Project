# ---------------------------------------------------------------------------
# AR Jewelry 2D-to-3D ML Service
# ---------------------------------------------------------------------------
import os
import os
import logging
import shutil
import urllib.request
import json
import base64

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import os
import logging
import shutil
import urllib.request
import json
import base64

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AR-TryOn-ML")

# ---------------------------------------------------------------------------
# Path setup
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "mern-backend", "ml-output"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Serve the generated GLB files statically
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# ---------------------------------------------------------------------------
# External callback configuration (Node.js backend)
# ---------------------------------------------------------------------------
NODE_CALLBACK_URL = "http://127.0.0.1:5000/api/ml/callback"
OUTPUT_BASE_URL = "http://localhost:5000/ml-output"

# ---------------------------------------------------------------------------
# Import ML pipeline components
# ---------------------------------------------------------------------------
from pipeline.image_cleaner import clean_image
from pipeline.mesh_generator import MeshGenerator

# Initialize MeshGenerator
try:
    generator = MeshGenerator(model_dir=os.path.join(BASE_DIR, "models"))
    logger.info("MeshGenerator successfully instantiated.")
except Exception as e:
    logger.error(f"Failed to initialise MeshGenerator: {e}")
    generator = None

# ---------------------------------------------------------------------------
# Callback helper
# ---------------------------------------------------------------------------
def send_callback(jewelry_id: str, payload: dict) -> None:
    final_payload = {"jewelryId": jewelry_id, **payload}
    try:
        headers = {"Content-Type": "application/json", "x-ml-api-key": "ml-callback-secret"}
        data_bytes = json.dumps(final_payload).encode("utf-8")
        req = urllib.request.Request(NODE_CALLBACK_URL, data=data_bytes, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            logger.info(f"Callback to Node.js succeeded with status {resp.status}")
    except Exception as e:
        logger.error(f"Callback to Node.js failed: {e}")

# ---------------------------------------------------------------------------
# Core 2D-to-3D pipeline
# ---------------------------------------------------------------------------
def run_pipeline(jewelry_id: str, input_path: str, category: str, metadata: dict = {}) -> str:
    output_glb_path = os.path.join(OUTPUT_DIR, f"{jewelry_id}.glb")
    public_url = f"{OUTPUT_BASE_URL}/{jewelry_id}.glb"

    try:
        if generator is None:
            raise RuntimeError("ML Engine unavailable")

        logger.info(f"[1/3] Pipeline Start: {category} (id={jewelry_id})")
        cleaned_path = clean_image(input_path)
        metrics = generator.generate_mesh(cleaned_path, output_glb_path)

        success_payload = {
            "status": "completed",
            "glb_url": public_url,
            "metrics": metrics,
            "is_fallback": False
        }
        success_payload.update(metadata)

        logger.info(f"[3/3] ML Pipeline Success: {public_url}")
        send_callback(jewelry_id, success_payload)
        return public_url

    except Exception as e:
        logger.warning(f"ML Pipeline STRICT FAIL for {jewelry_id}: {e}. Engaging FALLBACK.")
        try:
            from pipeline.fallback_generator import FallbackGenerator
            fallback_metrics = FallbackGenerator.generate(
                category=category,
                output_path=output_glb_path,
                reason=str(e)
            )
            fallback_payload = {
                "status": "completed",
                "glb_url": public_url,
                "metrics": fallback_metrics,
                "is_fallback": True,
                "fallback_reason": str(e)
            }
            fallback_payload.update(metadata)

            logger.info(f"[Fallback] Saved template to {public_url}")
            send_callback(jewelry_id, fallback_payload)
            return public_url
        except Exception as fatal_e:
            logger.critical(f"FATAL: Fallback failed: {fatal_e}")
            fail_payload = {"status": "failed", "reason": f"ML and Fallback failed: {str(e)}"}
            send_callback(jewelry_id, fail_payload)
            return None

# ---------------------------------------------------------------------------
# AR Try-On endpoint
# ---------------------------------------------------------------------------
@app.post("/ar/try-on")
async def ar_try_on(file: UploadFile = File(...), model_url: str = Form(...)):
    try:
        import cv2
        import numpy as np
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Face detection using MediaPipe if available
        try:
            import mediapipe as mp
            mp_face_detection = mp.solutions.face_detection
            with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
                results = face_detection.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                if results.detections:
                    for detection in results.detections:
                        bboxC = detection.location_data.relative_bounding_box
                        ih, iw, _ = img.shape
                        x, y, w, h = int(bboxC.xmin * iw), int(bboxC.ymin * ih), int(bboxC.width * iw), int(bboxC.height * ih)
                        cv2.rectangle(img, (x, y), (x + w, y + h), (212, 175, 55), 2)
                        cv2.putText(img, "Jewelry Applied", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (212, 175, 55), 2)
        except ImportError:
            cv2.putText(img, "AR Service (MP Missing)", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        _, encoded_img = cv2.imencode('.jpg', img)
        base64_str = base64.b64encode(encoded_img).decode('utf-8')
        return JSONResponse({"success": True, "image": f"data:image/jpeg;base64,{base64_str}"})

    except Exception as e:
        logger.error(f"AR Try-On failed: {e}")
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

# ---------------------------------------------------------------------------
# 2D-to-3D conversion endpoint
# ---------------------------------------------------------------------------
@app.post("/convert-2d-to-3d")
async def convert_image(
    file: UploadFile = File(...),
    product_id: str = Form(...),
    category: str = Form("necklace"),
    name: str = Form(None),
    description: str = Form(None),
    price: str = Form(None),
    image2D: str = Form(None),
    createdBy: str = Form(None),
    sellerId: str = Form(None)
):
    jewelry_id = str(product_id)
    input_path = os.path.join(OUTPUT_DIR, f"{jewelry_id}_input.png")

    metadata = {
        "name": name,
        "description": description,
        "price": price,
        "image2D": image2D,
        "createdBy": createdBy,
        "sellerId": sellerId,
        "category": category
    }
    metadata = {k: v for k, v in metadata.items() if v is not None}

    try:
        with open(input_path, "wb") as out_file:
            shutil.copyfileobj(file.file, out_file)
    except Exception as e:
        logger.error(f"Failed to write uploaded image: {e}")
        raise HTTPException(status_code=500, detail="Failed to store uploaded image")

    glb_url = run_pipeline(jewelry_id, input_path, category.lower(), metadata)
    if glb_url is None:
        raise HTTPException(status_code=500, detail="Mesh generation failed")

    return {"success": True, "asset_id": jewelry_id, "model_url": glb_url}

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/")
def health_check():
    return {"message": "AR Jewelry 2D-to-3D service is operational"}

# ---------------------------------------------------------------------------
# Run server
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
