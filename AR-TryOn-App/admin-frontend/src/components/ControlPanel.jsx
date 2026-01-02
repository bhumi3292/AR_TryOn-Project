import React, { useState } from "react";
import { FaHeart, FaShoppingCart, FaShareAlt, FaRedo, FaCamera } from "react-icons/fa";

export default function ControlPanel({
  onTakePhoto,
  onShare,
  onReset,
  scale,
  setScale,
  xPos, setXPos,
  yPos, setYPos,
  zPos, setZPos,
  yRot, setYRot,
  zRot, setZRot,
  selectedJewelry,
  material,
  setMaterial,
  hidePurchase = false,
}) {

  // Mock data if selectedJewelry fields are missing
  const {
    name = "Select Jewelry",
    price = 1299.00,
    description = "Exquisite craftsmanship meets modern design. This piece is designed to elevate your elegance.",
    rating = 4.8
  } = selectedJewelry || {};

  return (
    <div className="h-full flex flex-col gap-6 p-1">

      {/* 1. CONTROLS SECTION */}
      <div className="lux-card p-6 flex flex-col gap-5 overflow-y-auto max-h-[100%]">
        <div className="flex justify-between items-center border-b border-[var(--gold-dim)] pb-2">
          <h3 className="text-sm font-serif tracking-widest text-[var(--gold-soft)] uppercase">
            Adjustment Console
          </h3>
          <button onClick={onReset} className="text-[10px] text-[var(--gold)] underline hover:text-white">
            Reset All
          </button>
        </div>

        {/* Materials */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Material Finish</span>
          <div className="grid grid-cols-2 gap-2">
            {["Gold", "Rose Gold", "Silver", "Diamond"].map((m) => (
              <button
                key={m}
                onClick={() => setMaterial(m)}
                className={`py-2 text-[10px] font-medium rounded-md border transition-all ${material === m
                  ? "bg-[var(--gold-dim)] border-[var(--gold-primary)] text-[var(--gold-primary)]"
                  : "border-[#333] text-[var(--text-muted)] hover:border-[var(--gold-dim)]"
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Container */}
        <div className="flex flex-col gap-5 mt-2">

          {/* SCALE */}
          <ControlSlider
            label="Scale"
            value={scale}
            setValue={setScale}
            min={0.5} max={2.0} step={0.05}
            displayValue={`${(scale * 100).toFixed(0)}%`}
          />

          {/* POSITIONS */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <span className="text-[10px] text-[var(--gold-dim)] uppercase tracking-wider font-bold">Position</span>
            <ControlSlider
              label="X-Axis (Horizontal)"
              value={xPos || 0}
              setValue={setXPos || (() => { })}
              min={-2} max={2} step={0.1}
              displayValue={(xPos || 0).toFixed(1)}
            />
            <ControlSlider
              label="Y-Axis (Vertical)"
              value={yPos || 0}
              setValue={setYPos || (() => { })}
              min={-2} max={2} step={0.1}
              displayValue={(yPos || 0).toFixed(1)}
            />
            <ControlSlider
              label="Z-Axis (Depth)"
              value={zPos || 0}
              setValue={setZPos || (() => { })}
              min={-2} max={2} step={0.1}
              displayValue={(zPos || 0).toFixed(1)}
            />
          </div>

          {/* ROTATIONS */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <span className="text-[10px] text-[var(--gold-dim)] uppercase tracking-wider font-bold">Rotation</span>
            <ControlSlider
              label="Y-Rotation"
              value={yRot || 0}
              setValue={setYRot || (() => { })}
              min={-Math.PI} max={Math.PI} step={0.1}
              displayValue={`${Math.round((yRot || 0) * (180 / Math.PI))}°`}
            />
            <ControlSlider
              label="Z-Rotation"
              value={zRot || 0}
              setValue={setZRot || (() => { })}
              min={-Math.PI / 2} max={Math.PI / 2} step={0.1}
              displayValue={`${Math.round((zRot || 0) * (180 / Math.PI))}°`}
            />
          </div>

        </div>

        {/* Action Row */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--gold-dim)]">
          <button onClick={onTakePhoto} className="flex-1 py-3 bg-[var(--gold)] text-black font-bold text-xs rounded shadow-lg hover:brightness-110 flex items-center justify-center gap-2">
            <FaCamera size={12} /> CAPTURE LOOK
          </button>
        </div>
      </div>

      {!hidePurchase && (
        <div className="lux-card p-6 flex flex-col gap-4 flex-1">

          {/* Header */}
          <div>
            <h2 className="text-2xl font-serif text-[var(--gold-primary)] mb-1">{name}</h2>
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-light text-white">${price.toLocaleString()}</span>
              <div className="flex items-center gap-1 text-[var(--gold-soft)] text-xs">
                <span>★</span><span>{rating}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed border-l-2 border-[var(--gold-dim)] pl-3">
            {description}
          </p>

          <div className="mt-auto flex flex-col gap-3">
            <button className="lux-btn-primary w-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              BUY NOW
            </button>

            <div className="flex gap-3">
              <button className="flex-1 py-3 lux-btn-outline flex items-center justify-center gap-2 text-sm group">
                <FaShoppingCart className="group-hover:scale-110 transition-transform" /> Add to Cart
              </button>
              <button className="w-12 py-3 lux-btn-outline flex items-center justify-center text-[var(--gold-primary)] hover:bg-[var(--gold-dim)]">
                <FaHeart />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ControlSlider({ label, value, setValue, min, max, step, displayValue }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-[var(--gold)] font-mono">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="lux-range w-full"
      />
    </div>
  );
}
