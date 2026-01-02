# Developer Run Guide

This document explains how to run the backend and the ML service locally and a quick test to create a product and trigger 2D→3D conversion.

Prerequisites
- Node.js (>=18)
- Python (>=3.10) with required packages listed in `ml-service-2dto3d/requirements.txt`
- MongoDB running locally or accessible via `MONGODB_URI`

Start Backend

```bash
cd AR-TryOn-App/mern-backend
npm install
# set environment variables in a .env file or shell
# Example .env (development):
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/ar_tryon
# DEV_API_KEY=devsecret
# DEV_USER_ID=60f7b5c4a2b3c4d5e6f78901  # optional
npm run dev
```

Start ML Service

```bash
cd AR-TryOn-App/ml-service-2dto3d
pip install -r requirements.txt
# Start FastAPI
uvicorn app:app --host 127.0.0.1 --port 8000
```

Dev endpoint: create a product (no auth required in dev)

Example curl to create a product and trigger conversion (development only):

```bash
curl -X POST "http://localhost:5000/api/dev/product" \
  -H "Content-Type: application/json" \
  -H "x-dev-api-key: devsecret" \
  -d '{"name":"Silver Earring","category":"earring","price":2345,"image2D":"http://localhost:5000/uploads/example.png"}'
```

Notes
- The ML service writes GLB files into `mern-backend/ml-output/` and calls back to `http://127.0.0.1:5000/api/ml/callback` with header `x-ml-api-key: ml-callback-secret` by default.
- The backend serves `/ml-output` statically so generated GLB files are available at `http://localhost:5000/ml-output/<id>.glb`.
- Use `DEV_API_KEY` to restrict access to the dev endpoint.
