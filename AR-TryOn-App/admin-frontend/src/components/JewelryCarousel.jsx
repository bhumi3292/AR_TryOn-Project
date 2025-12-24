import React from "react";

export default function JewelryCarousel({ items = [], selectedId, onSelect }) {
  return (
    <div className="w-full h-36 p-2">
      <div className="flex gap-4 items-center overflow-x-auto scrollbar-hide py-2 px-3">
        {items.map((item) => (
          <button
            key={item._id || item.id || item.modelUrl}
            onClick={() => onSelect(item)}
            className={`flex flex-col items-center gap-2 min-w-[84px] transition-transform duration-200 ${selectedId === (item._id || item.id || item.modelUrl) ? "scale-105" : "hover:scale-105"}`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${selectedId === (item._id || item.id || item.modelUrl) ? "border-[#d4af37] shadow-[0_8px_30px_rgba(212,175,55,0.35)]" : "border-[#7a611f]/30"} bg-[#0f0f0f]`}
            >
              <img
                src={item.thumbnail || "/assets/ui/frame.png"}
                alt={item.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            {selectedId === (item._id || item.id || item.modelUrl) && (
              <div className="text-xs text-[#d4af37] mt-1">{item.name}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
