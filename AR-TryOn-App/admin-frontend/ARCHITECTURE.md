# AR System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                      (TryOn.jsx / ARTest.jsx)                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ARCanvas.jsx                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Initialize MediaPipe Face Mesh                        │  │
│  │  2. Start Camera Feed                                     │  │
│  │  3. Process Video Frames                                  │  │
│  │  4. Detect 468 Facial Landmarks                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Three.js Canvas Overlay                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  FaceOccluder    │  │  JewelryAnchor   │  │   Lighting   │ │
│  │  (Depth Only)    │  │  (3D Model)      │  │   & Camera   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
TryOn.jsx
├── CategorySidebar
├── ARCanvas
│   ├── Video Element (Webcam)
│   ├── MediaPipe Face Mesh
│   └── Three.js Canvas
│       ├── FaceOccluder
│       │   └── Invisible Depth Mesh
│       └── JewelryAnchor
│           ├── Primary Jewelry Model
│           └── Secondary Model (for earrings)
├── JewelryScrollbar
└── ControlPanel
```

## Data Flow

```
┌─────────────┐
│   Webcam    │
└──────┬──────┘
       │ Video Stream
       ▼
┌─────────────────┐
│  MediaPipe      │
│  Face Mesh      │
└──────┬──────────┘
       │ 468 Landmarks
       ▼
┌─────────────────┐
│  ARCanvas       │
│  (State)        │
└──────┬──────────┘
       │ Landmarks Array
       ▼
┌─────────────────┐
│ JewelryAnchor   │
│ (useFrame)      │
└──────┬──────────┘
       │ Position, Rotation, Scale
       ▼
┌─────────────────┐
│  3D Model       │
│  (Rendered)     │
└─────────────────┘
```

## Landmark Processing Pipeline

```
MediaPipe Coordinates          Three.js Coordinates
(Normalized 0-1)              (World Space -1 to 1)

┌─────────────┐               ┌─────────────┐
│ landmark.x  │──────────────▶│ (x - 0.5)*2 │
│ landmark.y  │──────────────▶│-(y - 0.5)*2 │
│ landmark.z  │──────────────▶│ -z * 2      │
└─────────────┘               └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Apply Offset│
                              └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Smoothing   │
                              │ (Lerp)      │
                              └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Final Pos   │
                              └─────────────┘
```

## Jewelry Category Mapping

```
┌──────────────┬─────────────┬──────────────┬────────────┐
│   Category   │   Primary   │  Secondary   │   Offset   │
│              │  Landmark   │  Landmark    │   (Y-axis) │
├──────────────┼─────────────┼──────────────┼────────────┤
│  Nose Pin    │      4      │     197      │     0      │
│              │  (nose tip) │(nose bridge) │            │
├──────────────┼─────────────┼──────────────┼────────────┤
│  Earrings    │  234, 454   │      -       │   -0.03    │
│              │(left, right)│              │            │
├──────────────┼─────────────┼──────────────┼────────────┤
│  Necklace    │     152     │      10      │   -0.5     │
│              │   (chin)    │ (forehead)   │            │
└──────────────┴─────────────┴──────────────┴────────────┘
```

## Smoothing Algorithm

```javascript
// Low-Pass Filter (Lerp)

Current Position ──┐
                   │
                   ├──▶ Lerp ──▶ Smoothed Position
                   │     (α)
Target Position ───┘

Formula: smoothed = current + (target - current) * α

Where:
- α (alpha) = smoothing factor (0.1 - 0.5)
- Lower α = smoother but more lag
- Higher α = more responsive but less smooth
```

## Occlusion Rendering

```
Render Order:
1. Video Background (webcam feed)
2. FaceOccluder (depth-only, colorWrite: false)
3. Jewelry Models (normal rendering)

Result:
- Jewelry behind face is hidden
- Jewelry in front is visible
- Creates realistic depth perception
```

## Performance Optimization

```
┌─────────────────────────────────────────┐
│  Optimization Strategies                 │
├─────────────────────────────────────────┤
│  1. Single Face Detection (maxFaces: 1) │
│  2. Model Preloading (useGLTF.preload)  │
│  3. Geometry Disposal (cleanup)         │
│  4. Smoothing (reduce calculations)     │
│  5. Compressed Models (< 5MB)           │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────┐
│  Initialize AR  │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │Success?│
    └───┬─┬──┘
        │ │
    Yes │ │ No
        │ │
        ▼ ▼
┌──────────┐  ┌──────────────┐
│ Start    │  │ Show Error   │
│ Tracking │  │ Message      │
└──────────┘  └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Retry Button │
              └──────────────┘
```

## State Management

```
TryOn.jsx State:
├── items (jewelry list)
├── category (selected category)
├── selected (selected item)
├── modelUrl (GLB URL)
└── transform controls
    ├── scale
    ├── xPos
    ├── yRot
    └── zRot

ARCanvas.jsx State:
├── landmarks (468 points)
├── isReady (boolean)
└── error (string | null)

JewelryAnchor.jsx Refs:
├── groupRef (Three.js Group)
├── smoothedPosition (Vector3)
├── smoothedRotation (Euler)
└── smoothedScale (number)
```

## Integration Points

```
Backend                    Frontend
┌──────────────┐          ┌──────────────┐
│ Upload Image │─────────▶│ Select Item  │
└──────────────┘          └──────┬───────┘
                                 │
┌──────────────┐                 │
│ Generate 3D  │                 │
│ Model (GLB)  │                 │
└──────┬───────┘                 │
       │                         │
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ Save to      │          │ Fetch GLB    │
│ /ml-output/  │◀─────────│ from URL     │
└──────────────┘          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Render in AR │
                          └──────────────┘
```

## Browser Compatibility

```
┌────────────┬─────────┬──────────────────────┐
│  Browser   │ Version │      Status          │
├────────────┼─────────┼──────────────────────┤
│  Chrome    │  90+    │  ✅ Full Support     │
│  Edge      │  90+    │  ✅ Full Support     │
│  Firefox   │  88+    │  ✅ Full Support     │
│  Safari    │  14+    │  ⚠️  Limited         │
│  IE 11     │   -     │  ❌ Not Supported    │
└────────────┴─────────┴──────────────────────┘
```

## File Structure

```
admin-frontend/
├── src/
│   ├── components/
│   │   ├── ARCanvas.jsx          ← Main AR component
│   │   ├── JewelryAnchor.jsx     ← Positioning logic
│   │   └── FaceOccluder.jsx      ← Occlusion mesh
│   ├── hooks/
│   │   └── useFaceMesh.js        ← MediaPipe hook
│   ├── pages/
│   │   ├── TryOn.jsx             ← Main try-on page
│   │   └── ARTest.jsx            ← Test page
│   └── App.jsx                   ← Routes
├── AR_SYSTEM_README.md           ← Full documentation
└── QUICK_START.md                ← Quick start guide
```
