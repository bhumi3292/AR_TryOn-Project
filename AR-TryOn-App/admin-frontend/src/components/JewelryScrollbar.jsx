import React, { useRef, useState, useEffect } from 'react';

export default function JewelryScrollbar({ items = [], selected, onSelect }) {
  const scrollerRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const scrollStart = useRef(0);
  const [canDrag, setCanDrag] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // hide native scrollbar for cleaner look
    el.style.scrollBehavior = 'smooth';
    setCanDrag(true);
  }, []);

  const onPointerDown = (e) => {
    const el = scrollerRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStart.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    scrollStart.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const dx = dragStart.current - x;
    el.scrollLeft = scrollStart.current + dx;
  };

  const onPointerUp = () => {
    const el = scrollerRef.current;
    isDragging.current = false;
    if (el) el.style.cursor = 'grab';
  };

  const onWheel = (e) => {
    const el = scrollerRef.current;
    if (el) {
      el.scrollLeft += e.deltaY; // Map vertical wheel to horizontal scroll
    }
  };

  return (
    <div className="w-full h-full flex items-center">
      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-4 px-8 items-center w-full scrollbar-thin scrollbar-thumb-[var(--gold)] scrollbar-track-transparent"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        onWheel={onWheel}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      >
        {items.map((item) => {
          const id = item._id || item.id || item.productId || item.id;
          const isActive = selected?._id === id || selected?.id === id;

          const thumb = item.thumbnail || item.image2D || item.image || '/public/images/placeholder.png';

          return (
            <button
              key={id}
              onClick={() => onSelect && onSelect(item)}
              className={`relative flex-none w-20 group transition-all duration-300 flex flex-col items-center gap-2 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
            >
              <div
                className={`w-20 h-20 rounded-full overflow-hidden relative border-2 transition-all duration-300 shadow-lg
                  ${isActive
                    ? 'border-[var(--gold)] shadow-[0_0_20px_rgba(212,175,55,0.5)] ring-2 ring-[var(--gold-soft)] ring-offset-2 ring-offset-black'
                    : 'border-[var(--gold-dim)] bg-zinc-900 group-hover:border-[var(--gold-soft)]'
                  }`}
              >
                <img
                  src={thumb}
                  alt={item.name || 'jewelry'}
                  onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className={`text-[10px] font-serif tracking-widest uppercase max-w-[80px] truncate text-center transition-colors ${isActive ? 'text-[var(--gold)] font-bold' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                {item.name || ''}
              </p>

              {isActive && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]" />
              )}
            </button>
          );
        })}
      </div>
    </div >
  );
}
