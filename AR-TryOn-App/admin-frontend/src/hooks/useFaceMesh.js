import { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

/**
 * useFaceMesh Hook
 * 
 * Custom React hook for MediaPipe Face Mesh integration.
 * Handles initialization, camera setup, and landmark tracking.
 * 
 * @param {Object} options - MediaPipe Face Mesh options
 * @returns {Object} { landmarks, isReady, error, videoRef }
 */
export function useFaceMesh(options = {}) {
    const videoRef = useRef(null);
    const faceMeshRef = useRef(null);
    const cameraRef = useRef(null);

    const [landmarks, setLandmarks] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    const defaultOptions = {
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        ...options
    };

    useEffect(() => {
        let mounted = true;
        let camera = null;
        let faceMesh = null;

        const initializeFaceMesh = async () => {
            if (isReady || error) return; // Prevent double init

            try {
                // Create FaceMesh instance
                faceMesh = new FaceMesh({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    }
                });

                faceMesh.setOptions(defaultOptions);

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
                    camera = new Camera(videoRef.current, {
                        onFrame: async () => {
                            if (!mounted) return;
                            if (faceMeshRef.current && videoRef.current) {
                                try {
                                    await faceMeshRef.current.send({ image: videoRef.current });
                                } catch (e) {
                                    // Ignore send errors during cleanup
                                }
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

        if (!isReady && !error) {
            initializeFaceMesh();
        }

        return () => {
            mounted = false;
            // Cleanup
            if (camera) {
                try { camera.stop(); } catch (e) { }
            }
            if (faceMesh) {
                try { faceMesh.close(); } catch (e) { }
            }
            cameraRef.current = null;
            faceMeshRef.current = null;
        };
    }, []); // Empty dependency array - strict single run

    return {
        landmarks,
        isReady,
        error,
        videoRef
    };
}

/**
 * Utility function to convert MediaPipe landmark to Three.js world coordinates
 */
export function landmarkToWorld(landmark) {
    if (!landmark) return { x: 0, y: 0, z: 0 };

    return {
        x: (landmark.x - 0.5) * 2,      // X: 0-1 -> -1 to 1
        y: -(landmark.y - 0.5) * 2,     // Y: 0-1 -> 1 to -1 (inverted)
        z: -landmark.z * 2 || 0         // Z: depth
    };
}

/**
 * Calculate face scale based on forehead-to-chin distance
 */
export function calculateFaceScale(landmarks) {
    if (!landmarks || landmarks.length < 468) return 1;

    const forehead = landmarks[10];
    const chin = landmarks[152];

    if (!forehead || !chin) return 1;

    const faceHeight = Math.sqrt(
        Math.pow(forehead.x - chin.x, 2) +
        Math.pow(forehead.y - chin.y, 2) +
        Math.pow((forehead.z || 0) - (chin.z || 0), 2)
    );

    // Normalize scale (typical face height is ~0.4 in normalized coords)
    return faceHeight / 0.4;
}

/**
 * Get anchor landmark indices for different jewelry categories
 */
export function getAnchorLandmarks(category) {
    const anchors = {
        nosepin: {
            primary: 4,      // Nose tip
            secondary: 197,  // Nose bridge
            offset: { x: 0, y: 0, z: 0.02 },
            baseScale: 0.08
        },
        earring: {
            left: 234,       // Left ear
            right: 454,      // Right ear
            offset: { x: 0, y: -0.03, z: 0 },
            baseScale: 0.06
        },
        necklace: {
            primary: 152,    // Chin
            secondary: 10,   // Forehead
            offset: { x: 0, y: -0.5, z: 0 },
            baseScale: 0.25,
            flatRotation: true
        }
    };

    return anchors[category] || anchors.necklace;
}

export default useFaceMesh;
