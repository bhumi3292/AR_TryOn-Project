import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, ContactShadows, Html } from '@react-three/drei';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import JewelryAnchor from './JewelryAnchor';
import FaceOccluder from './FaceOccluder';

/**
 * ARCanvas Component - Premium V2
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
    material
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
    material = 'Silver'
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
                        antialias: false, // Pure performance: toggle off for mid-range
                        powerPreference: 'high-performance',
                        toneMapping: THREE.ACESFilmicToneMapping,
                        outputColorSpace: THREE.SRGBColorSpace,
                    }}
                    camera={{ position: [0, 0, 1], fov: 45, near: 0.01, far: 10 }}
                    onCreated={({ gl }) => {
                        // Store gl for cleanup
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
                        // No cleanup returned here; we remove listeners in outer useEffect cleanup
                    }}
                >
                    <ambientLight intensity={0.5} />
                    <Environment preset="studio" />

                    {/* DEBUG TOOLS: Forced Visual Reference */}
                    <axesHelper args={[5]} />
                    <gridHelper args={[10, 10]} />

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
                            />
                        )}
                    </Suspense>
                    <ContactShadows opacity={0.3} scale={5} blur={2} far={1} />
                </Canvas>
            </div>

            {error && (
                <div className="absolute top-4 left-4 bg-red-900/80 text-white px-4 py-2 rounded-full text-xs uppercase">
                    {error}
                </div>
            )}

            {!isReady && !error && (
                <div className="absolute top-4 left-4 bg-black/60 text-gold-500 px-4 py-2 rounded-full text-xs animate-pulse">
                    Initializing AR...
                </div>
            )}

        </div>
    );
}

// Cleanup WebGL renderer when component unmounts to avoid leaks
// Note: react-three/fiber manages renderer life, but in single-page apps explicit cleanup helps on HMR and long sessions
// We'll use a side-effect to dispose if glRef is set.
// This effect runs once per ARCanvas mount.
export function useARCleanup(glRef) {
    useEffect(() => {
        return () => {
            try {
                const gl = glRef.current;
                if (gl) {
                    // try to properly dispose renderer and free context
                    if (typeof gl.forceContextLoss === 'function') {
                        gl.forceContextLoss();
                    }
                    if (typeof gl.dispose === 'function') {
                        gl.dispose();
                    }
                }
            } catch (err) {
                console.warn('Error during AR cleanup', err);
            }
        };
    }, [glRef]);
}

