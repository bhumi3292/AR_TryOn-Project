import React from "react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/dashboard" },
  { id: "jewelry-list", label: "Jewelry List", icon: "💎", path: "/jewelry" },
  { id: "jewelry-add", label: "Add Jewelry", icon: "➕", path: "/jewelry/add" },
];

export function Sidebar({ onNavigate, currentPath }) {
  const isActive = (path) => currentPath === path;

  return (
    <aside className="w-64 bg-luxury-dark border-r border-luxury-gold min-h-screen sticky top-0">
      <div className="p-6 border-b border-luxury-gold">
        <h1 className="text-luxury-gold text-2xl font-bold font-elegant">
          Menu
        </h1>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-smooth ${
              isActive(item.path)
                ? "bg-luxury-gold text-luxury-black font-semibold"
                : "text-luxury-gold hover:bg-luxury-gray"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
