import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * JewelryAnchor Component
 * 
 * Anchors 3D jewelry models to specific facial landmarks with smoothing
 * and dynamic scaling based on face size.
 * 
 * Landmark Reference:
 * - Nose Pin: Landmark 4 (nose tip) or 197 (nose bridge)
 * - Earrings: Landmarks 234 (left ear) and 454 (right ear)
 * - Necklace: Landmark 152 (chin) with Y-offset
 */

// Low-pass filter for smooth position/rotation transitions
function lerp(start, end, alpha) {
    return start + (end - start) * alpha;
}

function lerpVector3(current, target, alpha) {
    current.x = lerp(current.x, target.x, alpha);
    current.y = lerp(current.y, target.y, alpha);
    current.z = lerp(current.z, target.z, alpha);
}

export default function JewelryAnchor({
    landmarks,
    modelUrl,
    category,
    manualScale = 1.0,
    manualXPos = 0,
    manualYRot = 0,
    manualZRot = 0
}) {
    const groupRef = useRef();
    const smoothedPosition = useRef(new THREE.Vector3());
    const smoothedRotation = useRef(new THREE.Euler());
    const smoothedScale = useRef(1);

    // Load the 3D model
    const { scene } = useGLTF(modelUrl);

    // Get anchor landmarks based on category
    const anchorConfig = useMemo(() => {
        const config = {
            nosepin: {
                primary: 4,      // Nose tip
                secondary: 197,  // Nose bridge (for orientation)
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
                secondary: 10,   // Forehead (for scaling reference)
                offset: { x: 0, y: -0.5, z: 0 },
                baseScale: 0.25,
                flatRotation: true
            }
        };

        return config[category] || config.necklace;
    }, [category]);

    // Calculate dynamic scale based on face size
    const calculateFaceScale = (landmarks) => {
        if (!landmarks || landmarks.length < 468) return 1;

        // Distance between forehead (10) and chin (152)
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
    };

    // Convert MediaPipe normalized coordinates to Three.js world space
    const landmarkToWorld = (landmark) => {
        if (!landmark) return new THREE.Vector3();

        // MediaPipe uses normalized coordinates (0-1)
        // Convert to Three.js space (-1 to 1, with Y inverted)
        return new THREE.Vector3(
            (landmark.x - 0.5) * 2,      // X: 0-1 -> -1 to 1
            -(landmark.y - 0.5) * 2,     // Y: 0-1 -> 1 to -1 (inverted)
            -landmark.z * 2 || 0         // Z: depth
        );
    };

    // Update position and rotation every frame
    useFrame(() => {
        if (!groupRef.current || !landmarks || landmarks.length < 468) return;

        const faceScale = calculateFaceScale(landmarks);
        let targetPosition = new THREE.Vector3();
        let targetRotation = new THREE.Euler();

        // Calculate position and rotation based on category
        if (category === 'nosepin') {
            const noseTip = landmarkToWorld(landmarks[anchorConfig.primary]);
            const noseBridge = landmarkToWorld(landmarks[anchorConfig.secondary]);

            targetPosition.copy(noseTip);
            targetPosition.x += anchorConfig.offset.x + manualXPos;
            targetPosition.y += anchorConfig.offset.y;
            targetPosition.z += anchorConfig.offset.z;

            // Calculate rotation based on nose orientation
            const direction = new THREE.Vector3().subVectors(noseTip, noseBridge);
            targetRotation.y = Math.atan2(direction.x, direction.z) + manualYRot;
            targetRotation.z = manualZRot;

        } else if (category === 'earring') {
            // For earrings, we need to render two instances (left and right)
            // For now, use left ear as primary
            const leftEar = landmarkToWorld(landmarks[anchorConfig.left]);

            targetPosition.copy(leftEar);
            targetPosition.x += anchorConfig.offset.x + manualXPos;
            targetPosition.y += anchorConfig.offset.y;
            targetPosition.z += anchorConfig.offset.z;

            targetRotation.y = manualYRot;
            targetRotation.z = manualZRot;

        } else if (category === 'necklace') {
            const chin = landmarkToWorld(landmarks[anchorConfig.primary]);

            targetPosition.copy(chin);
            targetPosition.x += anchorConfig.offset.x + manualXPos;
            targetPosition.y += anchorConfig.offset.y;
            targetPosition.z += anchorConfig.offset.z;

            // Keep necklace flat against chest
            if (anchorConfig.flatRotation) {
                targetRotation.x = Math.PI / 6; // Tilt forward slightly
                targetRotation.y = manualYRot;
                targetRotation.z = manualZRot;
            }
        }

        // Apply smoothing using low-pass filter (lerp)
        const smoothingFactor = 0.3; // Lower = smoother but more lag

        lerpVector3(smoothedPosition.current, targetPosition, smoothingFactor);

        smoothedRotation.current.x = lerp(smoothedRotation.current.x, targetRotation.x, smoothingFactor);
        smoothedRotation.current.y = lerp(smoothedRotation.current.y, targetRotation.y, smoothingFactor);
        smoothedRotation.current.z = lerp(smoothedRotation.current.z, targetRotation.z, smoothingFactor);

        smoothedScale.current = lerp(
            smoothedScale.current,
            faceScale * anchorConfig.baseScale * manualScale,
            smoothingFactor
        );

        // Apply to group
        groupRef.current.position.copy(smoothedPosition.current);
        groupRef.current.rotation.copy(smoothedRotation.current);
        groupRef.current.scale.setScalar(smoothedScale.current);
    });

    return (
        <group ref={groupRef}>
            <primitive object={scene.clone()} />

            {/* Render second earring if category is earring */}
            {category === 'earring' && (
                <EarringPair
                    landmarks={landmarks}
                    scene={scene}
                    anchorConfig={anchorConfig}
                    manualXPos={manualXPos}
                    manualYRot={manualYRot}
                    manualZRot={manualZRot}
                    faceScale={calculateFaceScale(landmarks)}
                    manualScale={manualScale}
                />
            )}
        </group>
    );
}

// Component to render both earrings
function EarringPair({
    landmarks,
    scene,
    anchorConfig,
    manualXPos,
    manualYRot,
    manualZRot,
    faceScale,
    manualScale
}) {
    const rightEarRef = useRef();
    const smoothedRightPos = useRef(new THREE.Vector3());
    const smoothedRightRot = useRef(new THREE.Euler());

    const landmarkToWorld = (landmark) => {
        if (!landmark) return new THREE.Vector3();
        return new THREE.Vector3(
            (landmark.x - 0.5) * 2,
            -(landmark.y - 0.5) * 2,
            -landmark.z * 2 || 0
        );
    };

    useFrame(() => {
        if (!rightEarRef.current || !landmarks || landmarks.length < 468) return;

        const rightEar = landmarkToWorld(landmarks[anchorConfig.right]);

        const targetPosition = new THREE.Vector3(
            rightEar.x + anchorConfig.offset.x + manualXPos,
            rightEar.y + anchorConfig.offset.y,
            rightEar.z + anchorConfig.offset.z
        );

        const targetRotation = new THREE.Euler(0, manualYRot, manualZRot);

        const smoothingFactor = 0.3;

        lerpVector3(smoothedRightPos.current, targetPosition, smoothingFactor);
        smoothedRightRot.current.y = lerp(smoothedRightRot.current.y, targetRotation.y, smoothingFactor);
        smoothedRightRot.current.z = lerp(smoothedRightRot.current.z, targetRotation.z, smoothingFactor);

        rightEarRef.current.position.copy(smoothedRightPos.current);
        rightEarRef.current.rotation.copy(smoothedRightRot.current);
        rightEarRef.current.scale.setScalar(faceScale * anchorConfig.baseScale * manualScale);
    });

    return (
        <group ref={rightEarRef}>
            <primitive object={scene.clone()} />
        </group>
    );
}

// Preload models
useGLTF.preload = (url) => {
    if (url) useGLTF(url);
};
