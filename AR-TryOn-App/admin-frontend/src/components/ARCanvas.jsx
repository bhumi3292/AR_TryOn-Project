import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, ContactShadows, Html } from '@react-three/drei';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import JewelryAnchor from './JewelryAnchor';
import FaceOccluder from './FaceOccluder';

// DISABLE HMR FOR THIS MODULE TO PREVENT WEBGL CRASHES
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        window.location.reload();
    });
}

/**
 * ARCanvas Component - Premium V2
 * 
 * NOTE: HMR is disabled for this file intentionally. 
 * Any changes here will trigger a full page reload.
 */
class ARComponentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("AR Component Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null; // Or a fallback UI
        }
        return this.props.children;
    }
}

/**
 * ARComponents - Encapsulates the 3D objects that rely on face landmarks.
 * This component uses useFrame to react to landmarksRef.current changes without
 * causing re-renders of the parent ARCanvas.
 */
function ARComponents({
    landmarksRef,
    modelUrl,
    category,
    scale,
    xPos,
    yPos,
    zPos,
    yRot,
    zRot,
    material,
    debugMode
}) {
    return (
        <ARComponentErrorBoundary key={modelUrl}>
            <FaceOccluder landmarksRef={landmarksRef} />
            <JewelryAnchor
                landmarksRef={landmarksRef}
                modelUrl={modelUrl}
                category={category}
                manualScale={scale}
                manualXPos={xPos}
                manualYPos={yPos}
                manualZPos={zPos}
                manualYRot={yRot}
                manualZRot={zRot}
                material={material}
                debugMode={debugMode}
            />
        </ARComponentErrorBoundary>
    );
}

export default function ARCanvas({
    modelUrl,
    category = 'necklace',
    scale = 1.0,
    xPos = 0,
    yPos = 0,
    zPos = 0,
    yRot = 0,
    zRot = 0,
    material = 'Silver',
    debugMode = false
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const glRef = useRef(null);
    const faceMeshRef = useRef(null);
    const cameraRef = useRef(null);

    const landmarksRef = useRef(null); // High-performance ref for Three.js tracking
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    // Track frame time to throttle tracking (save CPU)
    const lastProcessTime = useRef(0);
    const THROTTLE_MS = 22; // ~45 FPS tracking is plenty for stable AR

    // Ensure we clean up GL resources on unmount
    useARCleanup(glRef);

    useEffect(() => {
        let mounted = true;
        let camera = null;

        const initializeFaceMesh = async () => {
            try {
                const faceMesh = new FaceMesh({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.6,
                    minTrackingConfidence: 0.6
                });

                faceMesh.onResults((results) => {
                    if (!mounted) return;
                    // Directly update ref to avoid React Re-render cycle
                    landmarksRef.current = results.multiFaceLandmarks?.[0] || null;
                });

                faceMeshRef.current = faceMesh;

                if (videoRef.current) {
                    camera = new Camera(videoRef.current, {
                        onFrame: async () => {
                            const now = performance.now();
                            if (now - lastProcessTime.current < THROTTLE_MS) return;

                            if (faceMeshRef.current && videoRef.current) {
                                lastProcessTime.current = now;
                                await faceMeshRef.current.send({ image: videoRef.current });
                            }
                        },
                        width: 640,  // Lower tracking resolution for speed (keeps GPU free)
                        height: 480
                    });

                    cameraRef.current = camera;
                    try {
                        await camera.start();
                        if (mounted) setIsReady(true);
                    } catch (camErr) {
                        console.error('Camera start error', camErr);
                        if (mounted) {
                            if (camErr && camErr.name === 'NotAllowedError') setError('Camera permission denied');
                            else setError('Camera initialization failed');
                        }
                    }
                }
            } catch (err) {
                console.error('AR Load Error:', err);
                if (mounted) setError('Tracking initialization failed.');
            }
        };

        initializeFaceMesh();

        return () => {
            mounted = false;
            if (camera) camera.stop();
            if (faceMeshRef.current) faceMeshRef.current.close();
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            <video
                ref={videoRef}
                id="ar-video"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                autoPlay
                muted
            />

            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 pointer-events-none">
                <Canvas
                    id="ar-canvas"
                    style={{ width: '100%', height: '100%' }}
                    gl={{
                        alpha: true,
                        antialias: false,
                        powerPreference: 'high-performance',
                        toneMapping: THREE.NoToneMapping, // DISABLED TONE MAPPING AS REQUESTED
                        outputColorSpace: THREE.SRGBColorSpace,
                    }}
                    camera={{ position: [0, 0, 1], fov: 45, near: 0.01, far: 100 }} // INCREASED FAR PLANE
                    onCreated={({ gl }) => {
                        glRef.current = gl;
                        const canvasEl = gl.domElement;
                        const onContextLost = (e) => {
                            e.preventDefault();
                            console.error('WebGL context lost');
                        };
                        const onContextRestored = (e) => {
                            console.info('WebGL context restored');
                        };
                        canvasEl.addEventListener('webglcontextlost', onContextLost);
                        canvasEl.addEventListener('webglcontextrestored', onContextRestored);
                    }}
                >
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[0, 10, 5]} intensity={2.0} castShadow />
                    <Environment preset="studio" />

                    {/* DEBUG TOOLS */}
                    {debugMode && <axesHelper args={[0.5]} />}
                    {debugMode && <gridHelper args={[10, 10]} />}

                    <Suspense fallback={
                        <Html center>
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[var(--gold)] text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-black/30 px-2 py-1 rounded">Loading Model...</span>
                            </div>
                        </Html>
                    }>
                        {isReady && modelUrl && (
                            <ARComponents
                                landmarksRef={landmarksRef}
                                modelUrl={modelUrl}
                                category={category}
                                scale={scale}
                                xPos={xPos}
                                yPos={yPos}
                                zPos={zPos}
                                yRot={yRot}
                                zRot={zRot}
                                material={material}
                                debugMode={debugMode}
                            />
                        )}
                    </Suspense>
                    <ContactShadows opacity={0.3} scale={3} blur={2} far={1} />
                </Canvas>
            </div>


            {error && (
                <div className="absolute top-4 left-4 bg-red-900/80 text-white px-4 py-2 rounded-full text-xs uppercase">
                    {error}
                </div>
            )
            }

            {
                !isReady && !error && (
                    <div className="absolute top-4 left-4 bg-black/60 text-gold-500 px-4 py-2 rounded-full text-xs animate-pulse">
                        Initializing AR...
                    </div>
                )
            }

        </div >
    );
}

// Cleanup WebGL renderer when component unmounts to avoid leaks
// Note: react-three/fiber manages renderer life, but in single-page apps explicit cleanup helps on HMR and long sessions
// We'll use a side-effect to dispose if glRef is set.
// This effect runs once per ARCanvas mount.
// Cleanup WebGL renderer when component unmounts to avoid leaks
// Note: react-three/fiber manages renderer life, but in single-page apps explicit cleanup helps on HMR and long sessions
// We'll use a side-effect to dispose if glRef is set.
// This effect runs once per ARCanvas mount.
export function useARCleanup(glRef) {
    useEffect(() => {
        return () => {
            try {
                // Simplified cleanup: Just let generic dispose happen.
                // Removing forceContextLoss to prevent HMR crash loops.
                const gl = glRef.current;
                if (gl && typeof gl.dispose === 'function') {
                    // gl.dispose(); // Even explicit dispose can be risky with R3F in dev. Let's trust R3F.
                }
            } catch (err) {
                console.warn('Error during AR cleanup', err);
            }
        };
    }, [glRef]);
}

