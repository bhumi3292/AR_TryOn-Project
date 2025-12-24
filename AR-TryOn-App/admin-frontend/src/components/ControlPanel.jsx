import React, { useState } from "react";
import { FaHeart, FaShoppingCart, FaShareAlt, FaRedo, FaCamera } from "react-icons/fa";

export default function ControlPanel({
  onTakePhoto,
  onShare,
  onReset,
  scale,
  setScale,
  selectedJewelry
}) {
  const [material, setMaterial] = useState("Gold");

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
      <div className="lux-card p-6 flex flex-col gap-5">
        <h3 className="text-sm font-serif tracking-widest text-[var(--gold-soft)] uppercase border-b border-[var(--gold-dim)] pb-2">
          Customization
        </h3>

        {/* Materials */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Material</span>
          <div className="flex gap-2">
            {["Gold", "Rose Gold", "Silver"].map((m) => (
              <button
                key={m}
                onClick={() => setMaterial(m)}
                className={`flex-1 py-2 text-xs font-medium rounded-md border transition-all ${material === m
                    ? "bg-[var(--gold-dim)] border-[var(--gold-primary)] text-[var(--gold-primary)]"
                    : "border-[#333] text-[var(--text-muted)] hover:border-[var(--gold-dim)]"
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Size / Scale */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Size Adjustment</span>
            <span className="text-xs text-[var(--gold-primary)]">{(scale * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="lux-range w-full"
          />
        </div>

        {/* Action Row */}
        <div className="flex gap-2 mt-2">
          <button onClick={onReset} className="flex-1 py-2 lux-btn-outline text-xs flex items-center justify-center gap-2">
            <FaRedo size={10} /> Reset
          </button>
          <button onClick={onTakePhoto} className="flex-1 py-2 lux-btn-outline text-xs flex items-center justify-center gap-2">
            <FaCamera size={10} /> Capture
          </button>
        </div>
      </div>

      {/* 2. PRODUCT INFO SECTION */}
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

    </div>
  );
}
