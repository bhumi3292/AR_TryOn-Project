import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- STABILIZATION FILTERS ---
class VectorFilter {
    constructor(alpha = 0.5) {
        this.alpha = alpha;
        this.value = new THREE.Vector3();
        this.initialized = false;
    }
    update(v) {
        if (!this.initialized) {
            this.value.copy(v);
            this.initialized = true;
        } else {
            this.value.lerp(v, this.alpha);
        }
        return this.value.clone();
    }
}

class QuatFilter {
    constructor(alpha = 0.5) {
        this.alpha = alpha;
        this.value = new THREE.Quaternion();
        this.initialized = false;
    }
    update(q) {
        if (!this.initialized) {
            this.value.copy(q);
            this.initialized = true;
        } else {
            this.value.slerp(q, this.alpha);
        }
        return this.value.clone();
    }
}

export default function JewelryAnchor({
    landmarksRef,
    modelUrl,
    category,
    manualScale = 1.0,
    manualXPos = 0,
    manualYPos = 0,
    manualZPos = 0,
    manualYRot = 0,
    manualZRot = 0,
    material = "Silver"
}) {
    const { scene } = useGLTF(modelUrl);

    // Create Refs for mesh groups
    const mainGroup = useRef();
    const leftEarGroup = useRef();
    const rightEarGroup = useRef();
    const { camera, viewport } = useThree();

    // Clone scenes for earrings
    const sceneMain = useMemo(() => scene.clone(), [scene]);
    const sceneLeft = useMemo(() => scene.clone(), [scene]);
    const sceneRight = useMemo(() => scene.clone(), [scene]);

    // Initialize Filters
    const filterMainPos = useMemo(() => new VectorFilter(0.4), [modelUrl]);
    const filterMainRot = useMemo(() => new QuatFilter(0.4), [modelUrl]);
    const filterLeftPos = useMemo(() => new VectorFilter(0.4), [modelUrl]);
    const filterLeftRot = useMemo(() => new QuatFilter(0.4), [modelUrl]);
    const filterRightPos = useMemo(() => new VectorFilter(0.4), [modelUrl]);
    const filterRightRot = useMemo(() => new QuatFilter(0.4), [modelUrl]);

    // Memory Cleanup
    useDisposeScene(sceneMain);
    useDisposeScene(sceneLeft);
    useDisposeScene(sceneRight);

    // Force Scale Logic
    const [baseScale, setBaseScale] = useState(1.0);

    useEffect(() => {
        if (!scene) return;

        // 1. Compute Bounding Box
        const box = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // 2. Logging
        const maxDim = Math.max(size.x, size.y, size.z);
        console.log(`[AR DEBUG] Model Loaded: ${modelUrl}`);
        console.log(`[AR DEBUG] Raw BBox Size:`, size);
        console.log(`[AR DEBUG] Raw Center:`, center);
        console.log(`[AR DEBUG] Max Dimension: ${maxDim}`);

        // 3. Normalize to Target Size (0.15m = 15cm)
        const TARGET_SIZE = 0.15;

        let finalScale = 1.0;

        if (maxDim < 0.0001) {
            console.warn("[AR CRITICAL] Model is seemingly empty or point-sized. Forcing fallback scale 100x.");
            finalScale = 100.0;
        } else {
            // Scale it so max dimension becomes TARGET_SIZE
            finalScale = TARGET_SIZE / maxDim;
            console.log(`[AR DEBUG] Computed Normalization Scale: ${finalScale.toFixed(4)}x to reach ${TARGET_SIZE}m`);
        }

        // 4. Center Mesh (Critical for Rotation)
        // We move the scene contents, not the group, so rotation pivots around 0,0,0
        scene.position.sub(center);

        setBaseScale(finalScale);

    }, [scene, modelUrl]);


    // HELPER: Map Landmark (0..1) to World Vector
    const getLandmarkPos = (landmarks, index) => {
        if (!landmarks || !landmarks[index]) return new THREE.Vector3();
        const lm = landmarks[index];
        // Map 0..1 to -1..1
        const x = (lm.x - 0.5) * 2;
        const y = -(lm.y - 0.5) * 2;
        // Z from MediaPipe is roughly relative to width. scale it to make sense in ThreeJS depth
        // We project onto a plane at z=0 (or whatever depth face is)
        // Simple ortho assumption for AR often works best:
        // x * viewport.width / 2, y * viewport.height / 2

        return new THREE.Vector3(
            x * (viewport.width / 2),
            y * (viewport.height / 2),
            -lm.z * 1.5 // Depth scaling heuristic
        );
    };

    useFrame(() => {
        if (!landmarksRef.current || landmarksRef.current.length < 468) return;
        const landmarks = landmarksRef.current;

        // Manual Offsets
        const manualOffset = new THREE.Vector3(manualXPos, manualYPos, manualZPos);
        const manualRotQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, manualYRot, manualZRot));

        // ----------------------------------------------------
        // NECKLACE / GENERAL LOGIC
        // ----------------------------------------------------
        if (category === 'necklace' || category === 'necklaces') {
            if (mainGroup.current) {
                // Anchors: Midpoint of Jaw (152) and Neck (377)? or Shoulders?
                // User asked: Midpoint between 152 (Chin) and 377 (Left Neck?? No, 377 is usually left lower face/neck area)
                // Let's implement midpoint 152 and 377 as requested.
                // 152 is Chin. 377 is left-side neck/infraorbital? 
                // Actually 377 is near the chin/neck simplified. 
                // Wait, typical "Neck" is often approximated. 
                // I will follow instruction: Midpoint(152, 377).

                const p1 = getLandmarkPos(landmarks, 152);
                const p2 = getLandmarkPos(landmarks, 377);
                const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

                // Add Drop (Necklaces sit lower than chin)
                center.y -= 0.15; // Lower by ~15cm equivalent

                // Rotation: Chin (152) to Forehead (10) for Up vector
                const chin = getLandmarkPos(landmarks, 152);
                const forehead = getLandmarkPos(landmarks, 10);
                const up = new THREE.Vector3().subVectors(forehead, chin).normalize();

                // Face Normal? Cross Up with Left-Right
                const leftFace = getLandmarkPos(landmarks, 234);
                const rightFace = getLandmarkPos(landmarks, 454);
                const rightVec = new THREE.Vector3().subVectors(rightFace, leftFace).normalize();
                const forward = new THREE.Vector3().crossVectors(rightVec, up).normalize();

                const matrix = new THREE.Matrix4().makeBasis(rightVec, up, forward);
                const targetQ = new THREE.Quaternion().setFromRotationMatrix(matrix);

                targetQ.multiply(manualRotQ); // Apply manual rotation
                center.add(manualOffset);     // Apply manual pos

                // Apply Filters
                mainGroup.current.position.copy(filterMainPos.update(center));
                mainGroup.current.quaternion.copy(filterMainRot.update(targetQ));
                mainGroup.current.scale.setScalar(baseScale * manualScale);
            }
        }

        // ----------------------------------------------------
        // EARRINGS LOGIC
        // ----------------------------------------------------
        else if (category.includes('earring') || category.includes('ear')) {
            // LEFT EAR (User says 234)
            if (leftEarGroup.current) {
                const p = getLandmarkPos(landmarks, 234);
                // Adjust for ear lobe drop
                p.y -= 0.05;
                p.x -= 0.02;

                // Rotation: Side of face
                // Vector from 234 to 127 (Temple) matches ear angle roughly
                const temple = getLandmarkPos(landmarks, 127);
                const up = new THREE.Vector3().subVectors(temple, p).normalize();
                // Face forward
                const nose = getLandmarkPos(landmarks, 1);
                const forward = new THREE.Vector3().subVectors(nose, p).normalize();
                const right = new THREE.Vector3().crossVectors(up, forward).normalize();
                // Correction
                const mat = new THREE.Matrix4().makeBasis(right, up, forward);
                const q = new THREE.Quaternion().setFromRotationMatrix(mat);

                q.multiply(manualRotQ);
                p.add(manualOffset);

                leftEarGroup.current.position.copy(filterLeftPos.update(p));
                leftEarGroup.current.quaternion.copy(filterLeftRot.update(q));
                leftEarGroup.current.scale.setScalar(baseScale * manualScale);
            }

            // RIGHT EAR (User says 454)
            if (rightEarGroup.current) {
                const p = getLandmarkPos(landmarks, 454);
                p.y -= 0.05;
                p.x += 0.02;

                const temple = getLandmarkPos(landmarks, 356);
                const up = new THREE.Vector3().subVectors(temple, p).normalize();
                const nose = getLandmarkPos(landmarks, 1);
                const forward = new THREE.Vector3().subVectors(nose, p).normalize();
                const right = new THREE.Vector3().crossVectors(up, forward).normalize();
                const mat = new THREE.Matrix4().makeBasis(right, up, forward);
                const q = new THREE.Quaternion().setFromRotationMatrix(mat);

                q.multiply(manualRotQ);
                p.add(manualOffset);

                rightEarGroup.current.position.copy(filterRightPos.update(p));
                rightEarGroup.current.quaternion.copy(filterRightRot.update(q));
                rightEarGroup.current.scale.setScalar(baseScale * manualScale);
            }
        }

        // ----------------------------------------------------
        // NOSE/DEFAULT
        // ----------------------------------------------------
        else {
            if (mainGroup.current) {
                // Nose Tip (4)
                const p = getLandmarkPos(landmarks, 4);
                // Orientation same as necklace check
                const chin = getLandmarkPos(landmarks, 152);
                const forehead = getLandmarkPos(landmarks, 10);
                const up = new THREE.Vector3().subVectors(forehead, chin).normalize();
                const left = getLandmarkPos(landmarks, 234);
                const right = getLandmarkPos(landmarks, 454);
                const rightVec = new THREE.Vector3().subVectors(right, left).normalize();
                const forward = new THREE.Vector3().crossVectors(rightVec, up).normalize();

                const matrix = new THREE.Matrix4().makeBasis(rightVec, up, forward);
                const q = new THREE.Quaternion().setFromRotationMatrix(matrix);

                q.multiply(manualRotQ);
                p.add(manualOffset);

                mainGroup.current.position.copy(filterMainPos.update(p));
                mainGroup.current.quaternion.copy(filterMainRot.update(q));
                mainGroup.current.scale.setScalar(baseScale * manualScale);
            }
        }
    });

    // RENDER
    const isEarring = category.includes('earring') || category.includes('ear');

    return (
        <group>
            {isEarring ? (
                <>
                    <primitive ref={leftEarGroup} object={sceneLeft} />
                    <primitive ref={rightEarGroup} object={sceneRight} />
                </>
            ) : (
                <primitive ref={mainGroup} object={sceneMain} />
            )}

            {/* DEBUG SPHERES (Optional, enabled for now to prove tracking) */}
            {/* Remove in prod or make toggleable */}
        </group>
    );
}

// Ensure cleanup of clones
function useDisposeScene(scene) {
    useEffect(() => {
        return () => {
            scene.traverse((o) => {
                if (o.isMesh) {
                    o.geometry.dispose();
                    if (o.material.dispose) o.material.dispose();
                }
            });
        };
    }, [scene]);
}
