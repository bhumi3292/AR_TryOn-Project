import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import JewelryAnchor from './JewelryAnchor';
import FaceOccluder from './FaceOccluder';

/**
 * ARCanvas Component
 * 
 * Main AR component that integrates MediaPipe Face Mesh with Three.js
 * to enable real-time jewelry try-on with facial landmark tracking.
 * 
 * @param {string} modelUrl - URL to the GLB model from backend
 * @param {string} category - Jewelry category: 'necklace', 'earring', or 'nosepin'
 * @param {number} scale - Manual scale adjustment (default: 1.0)
 * @param {number} xPos - Manual X position offset
 * @param {number} yRot - Manual Y rotation
 * @param {number} zRot - Manual Z rotation
 */
// Simple Error Boundary for Three.js components
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
            return null; // Just don't render the broken component
        }
        return this.props.children;
    }
}

export default function ARCanvas({
    modelUrl,
    category = 'necklace',
    scale = 1.0,
    xPos = 0,
    yRot = 0,
    zRot = 0
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    const cameraRef = useRef(null);

    const [landmarks, setLandmarks] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    // Initialize MediaPipe Face Mesh
    useEffect(() => {
        let mounted = true;

        const initializeFaceMesh = async () => {
            try {
                // Create FaceMesh instance
                const faceMesh = new FaceMesh({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    }
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // Set up results callback
                faceMesh.onResults((results) => {
                    if (!mounted) return;

                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        setLandmarks(results.multiFaceLandmarks[0]);
                    } else {
                        setLandmarks(null);
                    }
                });

                faceMeshRef.current = faceMesh;

                // Initialize camera
                if (videoRef.current) {
                    const camera = new Camera(videoRef.current, {
                        onFrame: async () => {
                            if (faceMeshRef.current && videoRef.current) {
                                await faceMeshRef.current.send({ image: videoRef.current });
                            }
                        },
                        width: 1280,
                        height: 720
                    });

                    cameraRef.current = camera;
                    await camera.start();

                    if (mounted) {
                        setIsReady(true);
                    }
                }
            } catch (err) {
                console.error('Failed to initialize Face Mesh:', err);
                if (mounted) {
                    setError('Failed to initialize AR tracking. Please check camera permissions.');
                }
            }
        };

        initializeFaceMesh();

        return () => {
            mounted = false;
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            if (faceMeshRef.current) {
                faceMeshRef.current.close();
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Video element for webcam feed */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror the video
                playsInline
                autoPlay
                muted
            />

            {/* Hidden canvas for MediaPipe processing */}
            <canvas
                ref={canvasRef}
                className="hidden"
            />

            {/* Three.js Canvas overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <Canvas
                    id="ar-canvas"
                    style={{ width: '100%', height: '100%' }}
                    gl={{
                        alpha: true,
                        antialias: true,
                        preserveDrawingBuffer: true
                    }}
                    camera={{
                        position: [0, 0, 1],
                        fov: 63,
                        near: 0.01,
                        far: 1000
                    }}
                >
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} intensity={1.2} />
                    <directionalLight position={[-5, -5, -5]} intensity={0.5} />
                    <pointLight position={[0, 0, 2]} intensity={0.8} />

                    <Suspense fallback={null}>
                        {isReady && landmarks && modelUrl && (
                            <>
                                {/* Face Occluder for realistic rendering */}
                                <FaceOccluder landmarks={landmarks} />

                                {/* Jewelry Anchor wrapped in Error Boundary */}
                                <ARComponentErrorBoundary key={modelUrl}>
                                    <JewelryAnchor
                                        landmarks={landmarks}
                                        modelUrl={modelUrl}
                                        category={category}
                                        manualScale={scale}
                                        manualXPos={xPos}
                                        manualYRot={yRot}
                                        manualZRot={zRot}
                                    />
                                </ARComponentErrorBoundary>
                            </>
                        )}
                    </Suspense>
                </Canvas>
            </div>

            {/* Status indicators */}
            {error && (
                <div className="absolute top-4 left-4 bg-[rgba(25,0,0,0.8)] border border-red-900 text-red-400 px-4 py-2 rounded-full backdrop-blur-md text-xs font-serif tracking-widest uppercase shadow-lg">
                    {error}
                </div>
            )}

            {!isReady && !error && (
                <div className="absolute top-4 left-4 bg-[rgba(0,0,0,0.6)] border border-[var(--gold-dim)] text-[var(--gold-primary)] px-4 py-2 rounded-full backdrop-blur-md text-xs font-serif tracking-widest uppercase shadow-lg animate-pulse">
                    Initializing AR...
                </div>
            )}

            {isReady && !landmarks && (
                <div className="absolute top-4 left-4 bg-[rgba(20,15,0,0.8)] border border-yellow-900/50 text-yellow-500 px-4 py-2 rounded-full backdrop-blur-md text-xs font-serif tracking-widest uppercase shadow-lg">
                    No face detected - Align Face
                </div>
            )}
        </div>
    );
}
