import React, { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";

function InnerModel({ src, position, scale, rotation }) {
  // This hook must only be called when we know the file exists (handled by parent)
  const { scene } = useGLTF(src);
  return (
    <primitive
      object={scene}
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}

export default function JewelryModel({
  src,
  position = [0, -0.2, 0],
  scale = 0.5,
  rotation = [0, 0, 0],
}) {
  const [available, setAvailable] = useState(null);

  useEffect(() => {
    let mounted = true;
    setAvailable(null);
    if (!src) {
      setAvailable(false);
      return () => {
        mounted = false;
      };
    }

    // Do a HEAD check to confirm the .glb exists before attempting to load it.
    (async () => {
      try {
        const res = await fetch(src, { method: "HEAD" });
        if (!mounted) return;
        setAvailable(res.ok);
      } catch (err) {
        if (!mounted) return;
        setAvailable(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [src]);

  if (available === null) {
    // still checking — render nothing (Suspense fallback will show a simple mesh)
    return null;
  }

  if (!available) {
    // GLB not found — avoid calling useGLTF to prevent errors / context loss
    return null;
  }

  // Log the URL being loaded so developer can verify path in browser console
  console.log("JewelryModel loading:", src);

  return (
    <InnerModel
      src={src}
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}

// Optionally preload a known placeholder model to keep things snappy
useGLTF.preload &&
  useGLTF.preload("http://127.0.0.1:8000/output/6942db40121b3d94440f2ca2.glb");
