import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Optimized FaceOccluder Component
 * Accesses landmarks via ref to avoid React re-renders.
 */

export default function FaceOccluder({ landmarksRef }) {
    const geometryRef = useRef();
    const { viewport } = useThree();

    // Key landmarks for a comprehensive face mask (Face Oval + Nose Bridge)
    const faceContourIndices = useMemo(() => [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
        168, 6, 197, 195, 5, 4
    ], []);

    const indices = useMemo(() => {
        const idxs = [];
        const centerIdx = 0; // Use vertex 0 as a fan center if simple
        // Ideally we triangulate properly, but fan is okay for convex-ish face oval
        for (let i = 1; i < faceContourIndices.length - 1; i++) {
            idxs.push(centerIdx, i, i + 1);
        }
        return idxs;
    }, [faceContourIndices]);

    const initialPositions = useMemo(() => new Float32Array(faceContourIndices.length * 3), [faceContourIndices]);

    useFrame(() => {
        if (!landmarksRef.current || landmarksRef.current.length < 468 || !geometryRef.current) return;

        const landmarks = landmarksRef.current;
        const positions = geometryRef.current.attributes.position.array;

        const w = viewport.width / 2;
        const h = viewport.height / 2;

        faceContourIndices.forEach((idx, i) => {
            const lm = landmarks[idx];
            if (lm) {
                // Same projection logic as JewelryAnchor
                positions[i * 3] = (lm.x - 0.5) * 2 * w;
                positions[i * 3 + 1] = -(lm.y - 0.5) * 2 * h;
                positions[i * 3 + 2] = -lm.z * 1.5; // Depth push
            }
        });

        geometryRef.current.attributes.position.needsUpdate = true;
        // geometryRef.current.computeVertexNormals(); // Optional, skipping for perf
    });

    const occluderMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        colorWrite: false, // Don't draw color
        depthWrite: true,  // Do write opacity to depth buffer
        side: THREE.DoubleSide
    }), []);

    return (
        <mesh material={occluderMaterial} renderOrder={0}> {/* Render before content */}
            <bufferGeometry
                ref={geometryRef}
                onUpdate={(self) => {
                    self.setIndex(indices);
                    self.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
                }}
            />
        </mesh>
    );
}
