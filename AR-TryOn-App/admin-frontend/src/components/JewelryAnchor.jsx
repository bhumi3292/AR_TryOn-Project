import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* =========================
   SMOOTHING FILTERS
========================= */
class VectorFilter {
  constructor(alpha = 0.25) {
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
  constructor(alpha = 0.25) {
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
  modelUrl,
  category,
  landmarksRef,
  manualScale = 1,
  confidenceScore = 1.0, // optional
  debugMode = false,
}) {
  const { scene } = useGLTF(modelUrl);
  const { camera } = useThree();

  const mainGroup = useRef();
  const leftEarGroup = useRef();
  const rightEarGroup = useRef();

  const filterPos = useMemo(() => new VectorFilter(0.15), [modelUrl]); // Slower lerp for weight
  const filterRot = useMemo(() => new QuatFilter(0.15), [modelUrl]);

  const sceneMain = useMemo(() => scene.clone(true), [scene]);
  const sceneLeft = useMemo(() => scene.clone(true), [scene]);
  const sceneRight = useMemo(() => scene.clone(true), [scene]);

  const baseScaleRef = useRef(1);
  const [isValidModel, setIsValidModel] = useState(false);

  const CATEGORY_SCALES = {
    necklace: 0.22, // Adjusted for typical neck width relative to face
    earring: 0.035,
    nosepin: 0.008,
  };

  /* =========================
     MODEL NORMALIZATION
  ========================= */
  useEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);

    const currentCategory = (category || '').toLowerCase().trim();
    const targetSize = CATEGORY_SCALES[currentCategory] || 0.05;
    const computedScale = targetSize / maxDim;
    const finalLockedScale = Math.min(computedScale, 10.0);

    baseScaleRef.current = finalLockedScale;

    // PHYSICAL MATERIAL UPGRADE
    // We want high metalness and smoothness for jewelry
    const overrideMaterial = new THREE.MeshStandardMaterial({
      color: '#FFD700',
      metalness: 1.0,   // Full metal
      roughness: 0.15,  // Polished but not perfect mirror
      envMapIntensity: 2.0,
      side: THREE.DoubleSide
    });

    [sceneMain, sceneLeft, sceneRight].forEach(s => {
      if (!s) return;

      // Recenter geometry locally
      const localBox = new THREE.Box3().setFromObject(s);
      const localCenter = new THREE.Vector3();
      localBox.getCenter(localCenter);

      s.traverse(o => {
        if (o.isMesh) {
          // Centering geometry
          if (o.geometry) {
            o.geometry.translate(-localCenter.x, -localCenter.y, -localCenter.z);
            o.geometry.computeVertexNormals();
          }
          o.frustumCulled = false;
          o.castShadow = true;
          o.receiveShadow = true;

          // Apply PBR Material if texture map is missing, else enhance existing
          if (o.material) {
            if (o.material.map) {
              // If generated mesh has texture, keep it but make it metallic
              o.material.metalness = 0.8;
              o.material.roughness = 0.2;
              o.material.envMapIntensity = 1.5;
            } else {
              o.material = overrideMaterial;
            }
            o.material.needsUpdate = true;
          }
        }
      });
      s.scale.setScalar(1);
    });

    setIsValidModel(true);
  }, [scene, modelUrl, category]);

  // Handle visibility resets
  useEffect(() => {
    if (!modelUrl) return;
    try {
      if (mainGroup.current) {
        mainGroup.current.visible = false;
        mainGroup.current.scale.setScalar(0);
      }
      if (leftEarGroup.current) {
        leftEarGroup.current.visible = false;
        leftEarGroup.current.scale.setScalar(0);
      }
      if (rightEarGroup.current) {
        rightEarGroup.current.visible = false;
        rightEarGroup.current.scale.setScalar(0);
      }
    } catch (e) { }

    requestAnimationFrame(() => {
      // Restore visibility on next frame
      try {
        const s = baseScaleRef.current * manualScale;
        if (mainGroup.current) mainGroup.current.scale.setScalar(s);
        if (leftEarGroup.current) leftEarGroup.current.scale.setScalar(s);
        if (rightEarGroup.current) rightEarGroup.current.scale.setScalar(s);
      } catch (e) { }
    });
  }, [modelUrl, manualScale]);

  /* =========================
      3D ANCHOR LOGIC
  ========================= */
  function getWorldPos(landmarks, idx) {
    if (!landmarks || !landmarks[idx]) return null;
    const lm = landmarks[idx];
    // Mirror X for selfie mode
    const x = ((1 - lm.x) - 0.5) * 2;
    const y = -(lm.y - 0.5) * 2;
    // Helper depth: Face mesh typically resides around Z=0 to -0.5 in normalized space
    // We project to a fixed depth plane for stability, but use 3 points to determine rotation plane
    const z = -lm.z;

    // Unproject isn't strictly needed if we map 2D directly to view plane, 
    // but useful if scene has depth. For simple overlay:
    const vec = new THREE.Vector3(x, y, 0);
    // We add Z depth manually in the frame loop relative to head
    return vec;
  }

  // DRAPING OFFSET LOGIC
  function getDrapingPoint(chin, neckBase) {
    if (!chin || !neckBase) return chin;
    // Interpolate between chin (152) and assumed neck/collarbone
    // We want the necklace to "hang". 
    // Simple physics approximation: Point is 
    const vec = new THREE.Vector3().subVectors(neckBase, chin);
    // Extend downwards by 20% to hit collarbone area simulated
    const drapingPoint = chin.clone().add(vec.multiplyScalar(0.5));
    return drapingPoint;
  }

  /* =========================
     RENDER LOOP
  ========================= */
  useFrame(() => {
    const landmarks = landmarksRef?.current;
    if (!landmarks || !isValidModel || !mainGroup.current) return;

    // Reset visibility
    mainGroup.current.visible = true;
    if (leftEarGroup.current) leftEarGroup.current.visible = true;
    if (rightEarGroup.current) rightEarGroup.current.visible = true;

    // ANCHORING
    const currentCat = (category || '').toLowerCase().trim();

    if (currentCat === 'necklace') {
      /* 
         NECKLACE: 3-POINT PLANE ANCHOR (Gravity Simulation)
         Points: 152 (Chin), 234 (Left Jaw), 454 (Right Jaw)
         Actually, for "Draping", we need 152 and the Neck line. 
         We use the Jaw line to determine the "Chest Plane" rotation.
      */
      const pChin = getWorldPos(landmarks, 152);
      const pLeft = getWorldPos(landmarks, 234);
      const pRight = getWorldPos(landmarks, 454);

      if (pChin && pLeft && pRight) {
        // 1. Calculate Center Position (Anatomy-based)
        // Necklace hangs from neck base. We simulate neck base relative to chin.
        // Downwards vector in face local space is roughly (pChin - midpoint(eyes)). 
        // Simplification: Just go down local Y.

        // Midpoint of Jaws
        const midJaw = new THREE.Vector3().addVectors(pLeft, pRight).multiplyScalar(0.5);
        // Vector Chin -> MidJaw is "Up" relative to face.
        const faceDown = new THREE.Vector3().subVectors(pChin, midJaw).normalize();

        // Gravity / Draping offset: 12cm down from chin along face vector?
        // Taking Z depth into account (pChin.z is approx 0). 
        // We put it at z = pChin.z + offset (wrap around neck?)

        // New Position: Chin + (DownVector * 0.15)
        const anchorPos = pChin.clone().add(faceDown.multiplyScalar(0.15));
        // Push Z back slightly to wrap around neck (pseudo-3D)
        anchorPos.z -= 0.05;

        // 2. Calculate Rotation (Assessment of Pitch/Roll/Yaw)
        // X-axis: Right - Left
        const xAxis = new THREE.Vector3().subVectors(pRight, pLeft).normalize();
        // Y-axis: Up (MidJaw - Chin)
        const yAxis = new THREE.Vector3().subVectors(midJaw, pChin).normalize();
        // Z-axis: Cross Logic (Normal to face)
        const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();

        // Create Rotation Matrix
        const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

        // Apply gravity correction? Necklace should hang logic vertical if user leans? 
        // We actually want "Conform to Body". Body follows head roughly. 
        // We stick to the computed face plane for specific "stuck" feeling, 
        // but we relax it with Slerp to give "weight".

        mainGroup.current.position.copy(filterPos.update(anchorPos));
        mainGroup.current.quaternion.copy(filterRot.update(targetQuat));

        // Apply Scale
        const scale = baseScaleRef.current * manualScale;
        mainGroup.current.scale.setScalar(scale);
      }
    } else if (currentCat === 'earring') {
      // EARRINGS: 234 (Left) and 454 (Right)
      // Simple lobe offset
      const pLeft = getWorldPos(landmarks, 234);
      const pRight = getWorldPos(landmarks, 454);

      if (pLeft && leftEarGroup.current) {
        // Offset down for lobe
        pLeft.y -= 0.02;
        leftEarGroup.current.position.copy(filterPos.update(pLeft));
        leftEarGroup.current.scale.setScalar(baseScaleRef.current * manualScale);
        // Zero rotation for earrings usually fine (gravity)
        leftEarGroup.current.rotation.set(0, 0, 0);
      }
      if (pRight && rightEarGroup.current) {
        // Offset down for lobe
        pRight.y -= 0.02;
        rightEarGroup.current.position.copy(pRight); // Shared filter might jump, careful.
        // Ideally independent filter for R/L. For now direct copy for R to avoid jumpiness 
        // or create 2nd filter. Let's use direct for now.
        rightEarGroup.current.scale.setScalar(baseScaleRef.current * manualScale);
        rightEarGroup.current.rotation.set(0, 0, 0);
      }
    }
  });

  return (
    <group>
      {/* Light setup for Physicality */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 10, 5]} intensity={1.5} castShadow />
      <spotLight position={[5, 0, 5]} intensity={0.8} angle={0.5} penumbra={1} />

      <Environment preset="city" />

      {/* Groups */}
      <primitive ref={mainGroup} object={sceneMain} />
      <primitive ref={leftEarGroup} object={sceneLeft} />
      <primitive ref={rightEarGroup} object={sceneRight} />
    </group>
  );
}