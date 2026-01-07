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

/* =========================
   COMPONENT
========================= */
export default function JewelryAnchor({
  modelUrl,
  category,
  landmarksRef,
  manualScale = 1,
  confidenceScore = 1.0, // optional
  debugMode = false,
}) {
  const { scene } = useGLTF(modelUrl);
  const { camera, scene: threeScene } = useThree();

  const mainGroup = useRef();
  const leftEarGroup = useRef();
  const rightEarGroup = useRef();

  const filterPos = useMemo(() => new VectorFilter(0.25), [modelUrl]);
  const filterRot = useMemo(() => new QuatFilter(0.25), [modelUrl]);

  const sceneMain = useMemo(() => scene.clone(true), [scene]);
  const sceneLeft = useMemo(() => scene.clone(true), [scene]);
  const sceneRight = useMemo(() => scene.clone(true), [scene]);

  const baseScaleRef = useRef(1);
  const [isValidModel, setIsValidModel] = useState(false);

  const CATEGORY_SCALES = {
    necklace: 0.2,
    earring: 0.02,
    nosepin: 0.005,
  };

  /* =========================
     MODEL NORMALIZATION
  ========================= */
  useEffect(() => {
    if (!scene) return;

    // Safety Shield: compute one locked scale from the original scene
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    // 1. Safety Check: floor to avoid division by zero for broken models
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);

    // 2. Set Target per category mapping (necklace default increased to 0.2)
    const currentCategory = (category || '').toLowerCase().trim();
    const targetSize = CATEGORY_SCALES[currentCategory] || 0.05;

    // 3. Compute once and store in ref
    const computedScale = targetSize / maxDim;

    // 4. Clamp the scale: never allow > 10x
    const finalLockedScale = Math.min(computedScale, 10.0);
    baseScaleRef.current = finalLockedScale;

    // Shiny gold material using scene environment
    const overrideMaterial = new THREE.MeshStandardMaterial({
      color: '#FFD700', // Brighter Gold
      metalness: 1.0,
      roughness: 0.1,   // Very shiny
      envMapIntensity: 1.5,
    });

    // Sanitize clones but DO NOT compute scale per-frame — clones left at neutral scale
    [sceneMain, sceneLeft, sceneRight].forEach(s => {
      if (!s) return;

      s.traverse(o => {
        if (o.isMesh) {
          try {
            if (o.geometry) {
              try { o.geometry.computeVertexNormals(); } catch (e) { }
              try { o.geometry.computeBoundingBox(); } catch (e) { }
              try { o.geometry.computeBoundingSphere(); } catch (e) { }
            }

            o.frustumCulled = false;
            o.castShadow = true;
            o.receiveShadow = true;

            if (o.material) {
              try {
                o.material.side = THREE.DoubleSide;
                o.material.transparent = false;
                o.material.opacity = 1.0;
              } catch (e) { }
            }
          } catch (e) { }
        }
      });

      // Compute fresh bounding box for this cloned scene and recentre geometry
      const localBox = new THREE.Box3().setFromObject(s);
      const localSize = new THREE.Vector3();
      const localCenter = new THREE.Vector3();
      localBox.getSize(localSize);
      localBox.getCenter(localCenter);

      s.traverse(o => {
        if (o.isMesh && o.geometry && o.geometry.translate) {
          try { o.geometry.translate(-localCenter.x, -localCenter.y, -localCenter.z); } catch (e) { }
        }
      });

      // Keep clone at neutral scale — actual displayed scale is applied from baseScaleRef in the frame loop
      try { s.scale.setScalar(1); } catch (e) { }

      // Apply safe override material
      s.traverse(node => {
        if (node.isMesh) {
          try {
            node.material = overrideMaterial;
            node.material.depthWrite = true;
            node.material.needsUpdate = true;
            node.frustumCulled = false;
          } catch (e) { }
        }
      });
    });

    setIsValidModel(true);
  }, [scene, modelUrl, category]);

  // Reset scales when a new model is loaded to avoid carrying over exploded state
  useEffect(() => {
    if (!modelUrl) return;

    // Hide and zero-scale previous/exploded models immediately
    try {
      if (mainGroup.current) {
        mainGroup.current.visible = false;
        mainGroup.current.scale.set(0, 0, 0);
      }
      if (leftEarGroup.current) {
        leftEarGroup.current.visible = false;
        leftEarGroup.current.scale.set(0, 0, 0);
      }
      if (rightEarGroup.current) {
        rightEarGroup.current.visible = false;
        rightEarGroup.current.scale.set(0, 0, 0);
      }
    } catch (e) { }

    // Restore scale/visibility on next animation frame once baseScaleRef is available
    requestAnimationFrame(() => {
      const restore = baseScaleRef.current && Number.isFinite(baseScaleRef.current) && baseScaleRef.current > 0;
      if (!restore) return;
      try {
        if (mainGroup.current) {
          mainGroup.current.scale.setScalar(baseScaleRef.current * manualScale);
          mainGroup.current.visible = true;
        }
        if (leftEarGroup.current) {
          leftEarGroup.current.scale.setScalar(baseScaleRef.current * manualScale);
          leftEarGroup.current.visible = true;
        }
        if (rightEarGroup.current) {
          rightEarGroup.current.scale.setScalar(baseScaleRef.current * manualScale);
          rightEarGroup.current.visible = true;
        }
      } catch (e) { }
    });
  }, [modelUrl, manualScale]);

  /* =========================
      LANDMARK → WORLD
  ========================= */
  function getWorldPos(landmarks, idx) {
    if (!landmarks || !landmarks[idx]) return null;
    const lm = landmarks[idx];
    const x = (lm.x - 0.5) * 2;
    const y = -(lm.y - 0.5) * 2;
    const zDepth = 0.8; // push further into scene
    const vec = new THREE.Vector3(x, y, zDepth);
    vec.unproject(camera);
    return vec;
  }

  function forceNormalizeObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    // Recenter to origin
    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);

    // Brutal fallback if model is broken
    if (!Number.isFinite(maxDim) || maxDim < 1e-4) {
      object.scale.set(50, 50, 50);
    } else {
      const scale = 0.15 / maxDim; // ~15cm jewelry size
      object.scale.setScalar(scale);
    }
  }

  /* =========================
     RENDER LOOP
  ========================= */
  useFrame(() => {
    const landmarks = landmarksRef?.current;

    // Reset rotations and force visibility for debugging (temporary)
    if (mainGroup.current) {
      mainGroup.current.rotation.set(0, 0, 0);
      mainGroup.current.visible = true;
    }
    if (leftEarGroup.current) {
      leftEarGroup.current.rotation.set(0, 0, 0);
      leftEarGroup.current.visible = true;
    }
    if (rightEarGroup.current) {
      rightEarGroup.current.rotation.set(0, 0, 0);
      rightEarGroup.current.visible = true;
    }

    if (!landmarks || !isValidModel) {
      // Keep guards but do not hide; visibility is forced above for debugging
      return;
    }

    // Ensure required landmark indices exist for current category
    const requiredIndices =
      category === 'necklace' ? [152] : category === 'earring' ? [234, 454] : category === 'nosepin' ? [1] : [];
    for (let idx of requiredIndices) {
      if (!landmarks[idx]) {
        return; // abort frame if tracking data incomplete
      }
    }

    // confidenceScore is OPTIONAL – only block if provided AND low
    if (typeof confidenceScore === 'number' && confidenceScore < 0.85) {
      return;
    }

    // Per-category anchoring
    switch ((category || '').toLowerCase().trim()) {
      case 'necklace': {
        const pos = getWorldPos(landmarks, 152);
        if (!pos) break;
        // Drop to neck and pull forward slightly
        pos.y -= 0.18;
        pos.z += 0.05;

        // NaN / finite guards
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) break;
        if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) break;

        if (mainGroup.current && mainGroup.current.parent) {
          mainGroup.current.visible = true;
          mainGroup.current.position.copy(filterPos.update(pos));
          mainGroup.current.rotation.set(0, 0, 0);
          try { mainGroup.current.scale.setScalar(baseScaleRef.current * manualScale); } catch (e) { }
        }
        if (leftEarGroup.current && leftEarGroup.current.parent) leftEarGroup.current.visible = true;
        if (rightEarGroup.current && rightEarGroup.current.parent) rightEarGroup.current.visible = true;
        break;
      }

      case 'earring': {
        const leftPos = getWorldPos(landmarks, 234);
        const rightPos = getWorldPos(landmarks, 454);
        if (!leftPos || !rightPos) break;
        if (!Number.isFinite(leftPos.x) || !Number.isFinite(leftPos.y) || !Number.isFinite(leftPos.z)) break;
        if (!Number.isFinite(rightPos.x) || !Number.isFinite(rightPos.y) || !Number.isFinite(rightPos.z)) break;

        leftPos.y -= 0.015;
        rightPos.y -= 0.015;
        if (isNaN(leftPos.x) || isNaN(leftPos.y) || isNaN(leftPos.z)) break;
        if (isNaN(rightPos.x) || isNaN(rightPos.y) || isNaN(rightPos.z)) break;

        if (leftEarGroup.current && leftEarGroup.current.parent) {
          leftEarGroup.current.visible = true;
          leftEarGroup.current.position.copy(filterPos.update(leftPos));
          leftEarGroup.current.rotation.set(0, 0, 0);
          try { leftEarGroup.current.scale.setScalar(baseScaleRef.current * manualScale); } catch (e) { }
        }
        if (rightEarGroup.current && rightEarGroup.current.parent) {
          rightEarGroup.current.visible = true;
          rightEarGroup.current.position.copy(filterPos.update(rightPos));
          rightEarGroup.current.rotation.set(0, 0, 0);
          try { rightEarGroup.current.scale.setScalar(baseScaleRef.current * manualScale); } catch (e) { }
        }
        if (mainGroup.current && mainGroup.current.parent) mainGroup.current.visible = true;
        break;
      }

      case 'nosepin': {
        const pos = getWorldPos(landmarks, 1);
        if (!pos) break;
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) break;

        pos.z += 0.01;
        pos.y -= 0.005;
        if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) break;

        if (mainGroup.current && mainGroup.current.parent) {
          mainGroup.current.visible = true;
          mainGroup.current.position.copy(filterPos.update(pos));
          mainGroup.current.rotation.set(0, 0, 0);
          try { mainGroup.current.scale.setScalar(baseScaleRef.current * manualScale); } catch (e) { }
        }
        if (leftEarGroup.current && leftEarGroup.current.parent) leftEarGroup.current.visible = true;
        if (rightEarGroup.current && rightEarGroup.current.parent) rightEarGroup.current.visible = true;
        break;
      }

      default:
        break;
    }
  });

  useEffect(() => {
    if (!debugMode || !isValidModel) return;
    const helpers = [];
    try {
      if (mainGroup.current) {
        const h = new THREE.BoxHelper(mainGroup.current, 0xff0000);
        mainGroup.current.add(h);
        helpers.push({ parent: mainGroup.current, helper: h });
      }
      if (leftEarGroup.current) {
        const h = new THREE.BoxHelper(leftEarGroup.current, 0xff0000);
        leftEarGroup.current.add(h);
        helpers.push({ parent: leftEarGroup.current, helper: h });
      }
      if (rightEarGroup.current) {
        const h = new THREE.BoxHelper(rightEarGroup.current, 0xff0000);
        rightEarGroup.current.add(h);
        helpers.push({ parent: rightEarGroup.current, helper: h });
      }
    } catch (e) { }

    return () => {
      try {
        helpers.forEach(({ parent, helper }) => {
          if (parent && helper) parent.remove(helper);
        });
      } catch (e) { }
    };
  }, [debugMode, isValidModel]);

  /* =========================
     JSX
  ========================= */
  return (
    <group>
      {/* Environment map for realistic reflections */}
      <Environment preset="city" />
      <primitive ref={mainGroup} object={sceneMain} visible={true} />
      <primitive ref={leftEarGroup} object={sceneLeft} visible={true} />
      <primitive ref={rightEarGroup} object={sceneRight} visible={true} />
    </group>
  );
}
