import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FaceOccluder Component
 * 
 * Creates an invisible mesh that follows the face geometry to provide
 * realistic occlusion. This makes earrings appear to go behind the face
 * when the user turns their head.
 * 
 * The mesh is rendered with colorWrite disabled so it only affects the
 * depth buffer, not the visible pixels.
 */

export default function FaceOccluder({ landmarks }) {
    const meshRef = useRef();
    const geometryRef = useRef();

    // Key landmarks for creating a simplified face mesh
    const faceContourIndices = useMemo(() => {
        return [
            // Face oval contour
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
            397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
            172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,

            // Nose bridge and sides
            168, 6, 197, 195, 5, 4,

            // Forehead area
            10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149,

            // Cheeks
            234, 127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454
        ];
    }, []);

    // Create geometry from landmarks
    const createFaceGeometry = (landmarks) => {
        if (!landmarks || landmarks.length < 468) return null;

        const vertices = [];
        const indices = [];

        // Convert landmarks to vertices
        faceContourIndices.forEach((idx) => {
            const lm = landmarks[idx];
            if (lm) {
                // Convert MediaPipe coords to Three.js space
                vertices.push(
                    (lm.x - 0.5) * 2,      // X
                    -(lm.y - 0.5) * 2,     // Y (inverted)
                    -lm.z * 2 || 0         // Z
                );
            }
        });

        // Create triangles using a simple fan triangulation from center
        // This is a simplified approach - for better results, use Delaunay triangulation
        const centerIdx = Math.floor(faceContourIndices.length / 2);

        for (let i = 0; i < faceContourIndices.length - 1; i++) {
            if (i !== centerIdx) {
                indices.push(centerIdx, i, i + 1);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    };

    // Update geometry every frame
    useFrame(() => {
        if (!landmarks || landmarks.length < 468) return;

        const newGeometry = createFaceGeometry(landmarks);
        if (newGeometry && meshRef.current) {
            if (geometryRef.current) {
                geometryRef.current.dispose();
            }
            geometryRef.current = newGeometry;
            meshRef.current.geometry = newGeometry;
        }
    });

    // Material that only writes to depth buffer (invisible but blocks rendering)
    const occluderMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            colorWrite: false,      // Don't write color
            depthWrite: true,       // Write to depth buffer
            depthTest: true,        // Test depth
            side: THREE.DoubleSide  // Render both sides
        });
    }, []);

    return (
        <mesh ref={meshRef} material={occluderMaterial}>
            <bufferGeometry />
        </mesh>
    );
}
