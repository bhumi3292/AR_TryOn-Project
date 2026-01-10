# AR Jewelry Try-On System

## 📌 Project Overview
The **AR Jewelry Try-On System** is a comprehensive solution that allows users to virtually try on jewelry (necklaces, earrings, etc.) in real-time using Augmented Reality (AR). The system features an innovative **2D-to-3D pipeline** that automatically converts static 2D product images into 3D models (.glb files) suitable for AR, eliminating the need for manual 3D modeling.

This project is designed to enhance the e-commerce experience for jewelry retailers by determining how items look on a user before purchase.

## 🚀 Key Features
- **Real-Time AR Try-On**: overlaid 3D jewelry on the user's live camera feed using **MediaPipe Face Mesh**.
- **Automated 2D-to-3D Conversion**: Upload a simple 2D image of a necklace or earring, and the system generates a textured 3D model.
- **Background Removal**: Automatic background removal from product images using **Rembg**.
- **Admin Dashboard**: A React-based interface for sellers to upload products, manage inventory, and view generated 3D assets.
- **Fallback Mechanism**: Robust error handling that provides template-based 3D models if the ML generation fails.
- **Cross-Component Communication**: Seamless data flow between the Node.js backend and Python ML microservice.

---

## 🏗️ System Architecture

The project follows a **Microservices-based Architecture** consisting of three main components:

1.  **Admin Frontend (Client)**:
    -   User Interface for sellers/customers.
    -   Handles camera access and AR rendering.
    -   Communicates with the Backend API.
2.  **MERN Backend (Orchestrator)**:
    -   Main API gateway.
    -   Manages database (MongoDB) and file storage (Cloudinary/Local).
    -   Orchestrates the workflow between the Frontend and ML Service.
3.  **ML Service (Processing)**:
    -   Dedicated Python/FastAPI service.
    -   Performs heavy Lifting: Image Segmentation, Depth Estimation, and 3D Mesh Generation.

---

## 🛠️ Technology Stack

### 1. Frontend (`admin-frontend`)
-   **Framework**: [React.js](https://react.dev/) (Vite)
-   **Language**: JavaScript / JSX
-   **Styling**: [TailwindCSS](https://tailwindcss.com/)
-   **AR & 3D Rendering**:
    -   [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber): For rendering 3D models in the browser.
    -   [@mediapipe/face_mesh](https://developers.google.com/mediapipe/solutions/vision/face_mesh): For precise facial landmark detection and tracking.
-   **State/Data**: Axios, React Router.

### 2. Backend (`mern-backend`)
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose ODM)
-   **Storage**: Multer (File uploads), Cloudinary (Image hosting).
-   **Communication**: REST API, Socket.io (Real-time updates).

### 3. ML Service (`ml-service-2dto3d`)
-   **Framework**: FastAPI (Python)
-   **Core Libraries**:
    -   **PyTorch**: Deep learning backend.
    -   **RemBG**: Background removal.
    -   **Trimesh**: 3D mesh manipulation.
    -   **OpenCV**: Image processing.
    -   **InstantMesh / Zero123++**: (Implied) For single-image to 3D view synthesis.
-   **Server**: Uvicorn

---

## 📂 Folder Structure

The project workspace is organized as follows:

```
AR_Project/
│
├── AR-TryOn-App/                # Main Application Container
│   ├── admin-frontend/          # React Admin Dashboard application
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI & AR components (ARCanvas, etc.)
│   │   │   ├── pages/           # Page layouts
│   │   │   └── ...
│   │   ├── package.json         # Frontend dependencies
│   │   └── vite.config.js       # Build configuration
│   │
│   ├── mern-backend/            # Node.js API Server
│   │   ├── src/
│   │   │   ├── controllers/     # Business logic
│   │   │   ├── models/          # Mongoose Schemas (Product, User)
│   │   │   ├── routes/          # API Endpoint definitions
│   │   │   └── server.js        # Entry point
│   │   └── package.json         # Backend dependencies
│   │
│   └── ml-service-2dto3d/       # Python AI Microservice
│       ├── pipeline/            # Core logic for 2D-to-3D conversion
│       │   ├── image_cleaner.py # Background removal logic
│       │   └── mesh_generator.py # 3D mesh creation logic
│       ├── app.py               # FastAPI server entry point
│       ├── requirements.txt     # Python dependencies
│       └── models/              # Pre-trained ML weights (e.g., zero123)
│
└── README.md                    # This documentation file
```

---

## ⚡ Setup & Installation

### Prerequisites
-   **Node.js** (v18+)
-   **Python** (v3.9+) with CUDA support (recommended for ML speed).
-   **MongoDB** (Local or Atlas connection string).

### 1. Setup Backend
```bash
cd AR-TryOn-App/mern-backend
npm install
# Create a .env file with your credentials (MONGO_URI, etc.)
npm run dev
```
*Runs on Port 5000 by default.*

### 2. Setup ML Service
```bash
cd AR-TryOn-App/ml-service-2dto3d
python -m venv .venv
# Activate environment: .venv\Scripts\activate (Windows)
pip install -r requirements.txt
python app.py
```
*Runs on Port 8000 by default.*

### 3. Setup Frontend
```bash
cd AR-TryOn-App/admin-frontend
npm install
npm run dev
```
*Runs on Port 5173 (usually).*

---

## � Challenges Faced & Solutions

During the development of this system, several significant technical challenges were encountered. These were systematically addressed to ensure a robust final product:

### 1. 3D Model Scaling & Visibility
*   **Challenge**: Initially, generated 3D models (GLB files) would often appear invisible or have zero-sized bounding boxes when loaded into the Three.js scene. This was due to inconsistent unit scales output by the ML pipeline.
*   **Solution**: We implemented an automated normalization step in the frontend. Upon loading, the system calculated the model's bounding box and applied a dynamic scaling factor to ensure all jewelry items fit within a standardized real-world size range (0.12m - 0.18m).

### 2. Accurate AR Anchoring
*   **Challenge**: Mapping the 2D facial landmarks provided by MediaPipe (screen coordinates) to the 3D world space of the AR canvas was unstable. Necklaces would often "float" too far in front of the user or clip through their neck.
*   **Solution**: We refined the coordinate mapping logic by implementing a fixed "safe depth" for projection and applying specific offsets for different jewelry categories (e.g., adjusting the Y-axis for necklaces relative to the chin landmark).

### 3. Mesh Generation Artifacts
*   **Challenge**: The initial 2D-to-3D conversion process occasionally produced "spiky" artifacts or noise, affectionately termed the "Golden Blob" effect, caused by imperfect depth map estimations.
*   **Solution**: We integrated a post-processing step in the Python pipeline. This involved applying a Gaussian filter to the depth maps and enforcing a strict confidence mask that discarded vertices with low background removal confidence, resulting in smoother meshes.

### 4. Microservice Latency & Timeouts
*   **Challenge**: The high computational cost of 3D mesh generation meant that API requests would time out before the process completed, disrupting the user experience.
*   **Solution**: We moved from a synchronous request-response model to an asynchronous callback architecture. The Node.js backend initiated the job and immediately returned a "Processing" status, while the Python service sent a webhook callback to update the database once the model was ready.

### 5. Cross-Platform File Handling
*   **Challenge**: Developing on Windows caused path formatting issues (backslashes vs. forward slashes) when passing file paths between the Node.js backend and the Python environment.
*   **Solution**: We standardized all file path handling using Python's `os.path` and Node.js's `path` modules to ensure robust, OS-agnostic file references throughout the pipeline.

---

## �🔄 Workflow Summary

1.  **Product Upload**: Admin uploads a jewelry image (e.g., a necklace) via the Frontend.
2.  **API Handler**: The Node.js backend receives the image and forwards it to the Python ML Service.
3.  **AI Processing**:
    -   The ML Service removes the background.
    -   It generates a normal map and depth estimation.
    -   It reconstructs a 3D Mesh (.glb).
4.  **Callback**: The ML Service notifies the Backend that the model is ready.
5.  **Database Update**: The Backend saves the Model URL to MongoDB.
6.  **Visualization**: The Frontend fetches the new Product, and the user enters "Try-On Mode" to see it overlaid on their neck/ears via the webcam.
