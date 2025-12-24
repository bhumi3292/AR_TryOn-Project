# AR Jewelry Try-On System

A complete AR (Augmented Reality) jewelry try-on system built with React, Three.js, and MediaPipe Face Mesh for real-time facial landmark tracking.

## 🎯 Features

- **Real-time Face Tracking**: Uses MediaPipe Face Mesh to detect 468 facial landmarks
- **Smart Jewelry Anchoring**: Automatically positions jewelry based on facial features
- **Smooth Motion**: Low-pass filter prevents jittering during head movement
- **Dynamic Scaling**: Automatically adjusts jewelry size based on face distance from camera
- **Realistic Occlusion**: Earrings appear behind the face when user turns their head
- **Multiple Categories**: Support for necklaces, earrings, and nose pins

## 📦 Components

### ARCanvas.jsx
Main AR component that integrates MediaPipe Face Mesh with Three.js.

**Props:**
- `modelUrl` (string): URL to the GLB model from backend
- `category` (string): Jewelry category - 'necklace', 'earring', or 'nosepin'
- `scale` (number): Manual scale adjustment (default: 1.0)
- `xPos` (number): Manual X position offset
- `yRot` (number): Manual Y rotation
- `zRot` (number): Manual Z rotation

**Example:**
```jsx
<ARCanvas
  modelUrl="http://localhost:5000/ml-output/product123.glb"
  category="necklace"
  scale={1.2}
  xPos={0}
  yRot={0}
  zRot={0}
/>
```

### JewelryAnchor.jsx
Helper component that anchors 3D models to specific facial landmarks.

**Landmark Mapping:**
- **Nose Pin**: Landmark 4 (nose tip) or 197 (nose bridge)
- **Earrings**: Landmarks 234 (left ear) and 454 (right ear)
- **Necklace**: Landmark 152 (chin) with Y-offset (-0.5 to -1.0)

**Features:**
- Low-pass filter smoothing (lerp) to prevent jitter
- Dynamic scaling based on face size
- Automatic rotation calculation for natural positioning

### FaceOccluder.jsx
Creates an invisible mesh for realistic occlusion effects.

**How it works:**
- Renders a depth-only mesh (colorWrite: false)
- Follows face contour using key landmarks
- Makes jewelry appear behind face when user turns head

### useFaceMesh.js
Custom React hook for MediaPipe Face Mesh integration.

**Returns:**
- `landmarks`: Array of 468 facial landmarks
- `isReady`: Boolean indicating if tracking is active
- `error`: Error message if initialization fails
- `videoRef`: Reference to video element

**Utility Functions:**
- `landmarkToWorld(landmark)`: Converts MediaPipe coords to Three.js space
- `calculateFaceScale(landmarks)`: Calculates face scale for dynamic sizing
- `getAnchorLandmarks(category)`: Returns anchor config for jewelry type

## 🚀 Installation

1. Install required dependencies:
```bash
npm install @mediapipe/face_mesh @mediapipe/camera_utils @mediapipe/drawing_utils
npm install @react-three/fiber @react-three/drei three
```

2. Import components in your page:
```jsx
import ARCanvas from '../components/ARCanvas';
```

3. Use in your React component:
```jsx
<ARCanvas
  modelUrl={modelUrl}
  category="necklace"
  scale={scale}
  xPos={xPos}
  yRot={yRot}
  zRot={zRot}
/>
```

## 🎨 Landmark Reference

MediaPipe Face Mesh provides 468 landmarks. Key landmarks for jewelry:

| Landmark | Location | Use Case |
|----------|----------|----------|
| 4 | Nose tip | Nose pin primary anchor |
| 197 | Nose bridge | Nose pin orientation |
| 234 | Left ear | Left earring |
| 454 | Right ear | Right earring |
| 152 | Chin | Necklace anchor |
| 10 | Forehead | Face scale calculation |

## ⚙️ Configuration

### Smoothing Factor
Adjust smoothing in `JewelryAnchor.jsx`:
```javascript
const smoothingFactor = 0.3; // Lower = smoother but more lag (0.1-0.5)
```

### Base Scales
Modify base scales for different jewelry types:
```javascript
const anchorConfig = {
  nosepin: { baseScale: 0.08 },
  earring: { baseScale: 0.06 },
  necklace: { baseScale: 0.25 }
};
```

### Offsets
Adjust position offsets:
```javascript
offset: { 
  x: 0,      // Left/Right
  y: -0.5,   // Up/Down
  z: 0       // Forward/Back
}
```

## 🔧 Troubleshooting

### Camera Not Working
- Check browser camera permissions
- Ensure HTTPS or localhost (required for getUserMedia)
- Try different browsers (Chrome/Edge recommended)

### Landmarks Not Detected
- Ensure good lighting
- Face camera directly
- Check MediaPipe CDN is accessible

### Jewelry Jittering
- Increase smoothing factor (0.1-0.3)
- Reduce frame rate if needed
- Check for performance issues

### Occlusion Not Working
- Verify FaceOccluder is rendered before jewelry
- Check depth buffer settings in Canvas
- Ensure material has depthWrite: true

## 📊 Performance Tips

1. **Optimize Models**: Keep GLB files under 5MB
2. **Limit Faces**: Set `maxNumFaces: 1` in MediaPipe options
3. **Reduce Resolution**: Lower camera resolution if needed
4. **Dispose Resources**: Clean up geometries and materials on unmount

## 🎯 Best Practices

1. **Always validate landmarks**: Check if landmarks exist before using
2. **Use smoothing**: Apply lerp to prevent jitter
3. **Handle errors gracefully**: Show user-friendly error messages
4. **Preload models**: Use `useGLTF.preload()` for better UX
5. **Test on multiple devices**: Different cameras behave differently

## 📝 API Reference

### ARCanvas Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| modelUrl | string | null | URL to GLB model |
| category | string | 'necklace' | Jewelry type |
| scale | number | 1.0 | Scale multiplier |
| xPos | number | 0 | X position offset |
| yRot | number | 0 | Y rotation (radians) |
| zRot | number | 0 | Z rotation (radians) |

### useFaceMesh Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxNumFaces | number | 1 | Max faces to detect |
| refineLandmarks | boolean | true | Use refined landmarks |
| minDetectionConfidence | number | 0.5 | Detection threshold |
| minTrackingConfidence | number | 0.5 | Tracking threshold |

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+ (limited)
- ❌ IE 11 (not supported)

## 📄 License

This AR system is part of the AR Jewelry Try-On project.

## 🤝 Contributing

When adding new jewelry types:
1. Define landmarks in `getAnchorLandmarks()`
2. Add category to `JewelryAnchor.jsx`
3. Update offset and scale values
4. Test with multiple face angles

## 📚 Resources

- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Landmark Visualization](https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png)
