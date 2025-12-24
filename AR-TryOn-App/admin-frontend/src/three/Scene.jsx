import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import JewelryModel from "./JewelryModel";

export default function Scene({
  modelUrl,
  scale = 1,
  xPos = 0,
  yRot = 0,
  zRot = 0,
}) {
  return (
    <Canvas
      id="r3f-canvas"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      gl={{ alpha: true }}
      camera={{ position: [0, 0, 2] }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[1, 2, 3]} intensity={0.8} />
      <Suspense fallback={<mesh />}>
        {modelUrl && (
          <JewelryModel
            src={modelUrl}
            position={[xPos, -0.6, 0]}
            scale={scale}
            rotation={[0, yRot, zRot]}
          />
        )}
      </Suspense>
    </Canvas>
  );
}
