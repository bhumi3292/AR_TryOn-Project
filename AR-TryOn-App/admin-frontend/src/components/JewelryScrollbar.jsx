import React from 'react';

export default function JewelryScrollbar({ items, selected, onSelect }) {
  return (
    <div className="w-full max-w-[900px]">
      <div className="flex gap-5 overflow-x-auto carousel-scroll pb-6 pt-2 px-2">
        {items.map((item) => {
          const id = item._id;
          const isActive = selected?._id === id;

          return (
            <button
              key={id}
              onClick={() => onSelect(item)}
              className={`relative flex-none w-36 group transition-all duration-500 ${isActive ? "scale-105 -translate-y-2" : "hover:scale-105 hover:-translate-y-1"
                }`}
            >
              <div
                className={`w-full aspect-[3/4] rounded-xl overflow-hidden relative border transition-all duration-500
                ${isActive
                    ? "border-[2px] border-[var(--gold-primary)] shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                    : "border-[var(--gold-dim)] bg-[var(--bg-card)] brightness-75 group-hover:brightness-100 group-hover:border-[var(--gold-soft)]"
                  }`}
              >
                <img
                  src={item.thumbnail || item.image2D}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                {/* Price Tag */}
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <p className={`text-xs font-serif tracking-widest transition-colors ${isActive ? 'text-[var(--gold-primary)]' : 'text-white/80'}`}>
                    {item.name?.split(' ')[0]} {/* Show partial name */}
                  </p>
                </div>
              </div>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)] shadow-[0_0_10px_var(--gold-primary)]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
