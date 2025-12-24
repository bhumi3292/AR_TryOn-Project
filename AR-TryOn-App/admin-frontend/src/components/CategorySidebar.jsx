import React from "react";

export default function CategorySidebar({
  category = "Necklaces",
  setCategory = () => {},
}) {
  const cats = ["Necklaces", "Earrings", "Nose Pins"];
  return (
    <aside className="w-64 flex flex-col h-full">
      <div>
        <h3 className="text-xs tracking-widest lux-upper lux-gold mb-6">
          CATEGORIES
        </h3>
        <ul className="space-y-3">
          {cats.map((c) => {
            const sel = category === c;
            return (
              <li key={c}>
                <button
                  onClick={() => setCategory(c)}
                  className={`w-full text-left py-3 px-4 rounded-xl transition-colors duration-200 text-sm lux-upper ${sel ? "bg-[var(--gold)] text-[#0b0b0b] lux-outline" : "lux-transparent-btn lux-hover-dark"}`}
                >
                  {c}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
