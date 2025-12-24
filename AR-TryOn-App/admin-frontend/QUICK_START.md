# AR Jewelry Try-On - Quick Start Guide

## 🚀 Getting Started

### 1. Installation Complete ✅
The following packages have been installed:
- `@mediapipe/face_mesh` - Face landmark detection
- `@mediapipe/camera_utils` - Camera utilities
- `@mediapipe/drawing_utils` - Drawing utilities
- `@react-three/fiber` - React Three.js renderer
- `@react-three/drei` - Three.js helpers
- `three` - 3D graphics library

### 2. Files Created

#### Components
- **`src/components/ARCanvas.jsx`** - Main AR component with MediaPipe integration
- **`src/components/JewelryAnchor.jsx`** - Jewelry positioning and anchoring logic
- **`src/components/FaceOccluder.jsx`** - Invisible mesh for realistic occlusion

#### Hooks
- **`src/hooks/useFaceMesh.js`** - Custom React hook for MediaPipe Face Mesh

#### Pages
- **`src/pages/TryOn.jsx`** - Updated with AR integration
- **`src/pages/ARTest.jsx`** - Standalone test page

#### Documentation
- **`AR_SYSTEM_README.md`** - Complete system documentation

### 3. How to Run

#### Start Development Server
```bash
cd admin-frontend
npm run dev
```

#### Access the Application
- **Main Try-On Page**: http://localhost:5173/tryon
- **AR Test Page**: http://localhost:5173/ar-test

### 4. Testing the AR System

#### Option 1: Use AR Test Page (Recommended for Testing)
1. Navigate to http://localhost:5173/ar-test
2. Allow camera access when prompted
3. Enter a GLB model URL (e.g., `http://localhost:5000/ml-output/product123.glb`)
4. Select jewelry category (necklace, earring, or nosepin)
5. Adjust controls to fine-tune positioning

#### Option 2: Use Main Try-On Page
1. Navigate to http://localhost:5173/tryon
2. Select a jewelry category from the sidebar
3. Choose a jewelry item from the scrollbar
4. The AR system will automatically load and track your face

### 5. Camera Requirements

✅ **Required:**
- Modern browser (Chrome 90+, Edge 90+, Firefox 88+)
- HTTPS or localhost (required for camera access)
- Camera permissions granted
- Good lighting conditions

❌ **Not Supported:**
- Internet Explorer
- Very old mobile browsers
- Browsers without WebGL support

### 6. Troubleshooting

#### Camera Not Working
```
Problem: "Camera access denied" or black screen
Solution:
1. Check browser camera permissions
2. Close other apps using the camera
3. Try a different browser
4. Ensure you're on HTTPS or localhost
```

#### No Face Detected
```
Problem: "No face detected" message
Solution:
1. Ensure good lighting
2. Face the camera directly
3. Move closer to the camera
4. Check if MediaPipe CDN is accessible
```

#### Jewelry Not Appearing
```
Problem: Model doesn't load
Solution:
1. Verify the GLB file URL is correct
2. Check if the file exists on the server
3. Open browser console for errors
4. Ensure CORS is configured on the backend
```

#### Jittery Movement
```
Problem: Jewelry shakes/jitters
Solution:
1. Increase smoothing factor in JewelryAnchor.jsx
2. Improve lighting conditions
3. Stay still for a moment to let tracking stabilize
```

### 7. Configuration

#### Adjust Smoothing (in JewelryAnchor.jsx)
```javascript
const smoothingFactor = 0.3; // Lower = smoother (0.1-0.5)
```

#### Modify Landmark Anchors (in JewelryAnchor.jsx)
```javascript
const anchorConfig = {
  nosepin: {
    primary: 4,      // Change landmark index
    offset: { x: 0, y: 0, z: 0.02 },  // Adjust position
    baseScale: 0.08  // Adjust size
  }
};
```

#### Change MediaPipe Settings (in ARCanvas.jsx)
```javascript
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,  // Lower = more sensitive
  minTrackingConfidence: 0.5    // Lower = more sensitive
});
```

### 8. Landmark Reference

| Jewelry Type | Primary Landmark | Secondary Landmark | Purpose |
|--------------|------------------|-------------------|---------|
| Nose Pin | 4 (nose tip) | 197 (nose bridge) | Position & rotation |
| Earrings | 234 (left ear), 454 (right ear) | - | Position |
| Necklace | 152 (chin) | 10 (forehead) | Position & scaling |

### 9. Development Workflow

#### Adding New Jewelry
1. Upload jewelry image to backend
2. Backend generates 3D model (GLB)
3. Model is saved to `/ml-output/{id}.glb`
4. Frontend fetches and displays in AR

#### Testing New Jewelry Types
1. Add new category to `getAnchorLandmarks()` in `useFaceMesh.js`
2. Define landmarks and offsets
3. Update `JewelryAnchor.jsx` to handle new category
4. Test on AR Test page

### 10. Performance Optimization

#### For Better Performance:
- Keep GLB files under 5MB
- Use compressed textures
- Limit to 1 face detection
- Reduce camera resolution if needed
- Dispose of unused geometries

#### Check Performance:
```javascript
// Add to useFrame in JewelryAnchor.jsx
console.log('FPS:', 1000 / delta);
```

### 11. Next Steps

✅ **System is Ready!**

You can now:
1. Test the AR system on the test page
2. Upload jewelry and try them on
3. Customize landmark positions
4. Adjust smoothing and scaling
5. Add new jewelry categories

### 12. Common Use Cases

#### Use Case 1: Try On Necklace
```jsx
<ARCanvas
  modelUrl="http://localhost:5000/ml-output/necklace123.glb"
  category="necklace"
  scale={1.0}
/>
```

#### Use Case 2: Try On Earrings
```jsx
<ARCanvas
  modelUrl="http://localhost:5000/ml-output/earring456.glb"
  category="earring"
  scale={1.0}
/>
```

#### Use Case 3: Try On Nose Pin
```jsx
<ARCanvas
  modelUrl="http://localhost:5000/ml-output/nosepin789.glb"
  category="nosepin"
  scale={1.0}
/>
```

### 13. Support

For detailed documentation, see `AR_SYSTEM_README.md`

For MediaPipe documentation: https://google.github.io/mediapipe/solutions/face_mesh.html

For Three.js documentation: https://threejs.org/docs/

---

**Happy AR Development! 🎉**
