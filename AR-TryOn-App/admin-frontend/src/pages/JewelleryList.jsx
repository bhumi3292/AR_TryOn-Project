import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { jewelleryService } from "../services";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaFilter, FaCamera } from "react-icons/fa";

export default function JewelleryList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Fetch Items
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await jewelleryService.getAllJewellery();
        if (mounted) {
          setItems(data?.data || data || []);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to load jewelry", e);
        setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  // Filter Items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      category === "All" ||
      (item.category?.name || item.category || "").toLowerCase() ===
      category.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Extract Categories
  const categories = ["All", ...new Set(items.map((i) => i.category?.name || i.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-black text-gold-500 font-sans selection:bg-gold-500/30">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[40vh] bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-500/20 via-black to-black opacity-60"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 text-center space-y-4 px-4">
          <h1 className="text-5xl md:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-gold-400 to-yellow-600 drop-shadow-2xl">
            The Collection
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide">
            Discover pieces that define elegance. Try them on instantly with our AR technology.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20 -mt-10 relative z-20">
        {/* Controls */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-gold-500/20 rounded-xl p-4 md:p-6 mb-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/50 group-hover:text-gold-500 transition-colors" />
            <input
              type="text"
              placeholder="Search masterpieces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/60 border border-gold-500/10 rounded-full py-3 pl-12 pr-6 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Filter */}
          <div className="relative w-full md:w-64 group">
            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/50 group-hover:text-gold-500 transition-colors" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/60 border border-gold-500/10 rounded-full py-3 pl-12 pr-6 text-white appearance-none cursor-pointer focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-black text-white">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gold-500">▼</div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-2xl font-serif mb-2">No treasures found.</p>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item._id || item.id}
                className="group relative bg-zinc-900/40 rounded-xl overflow-hidden border border-gold-500/10 hover:border-gold-500/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] flex flex-col h-[400px]"
              >
                {/* Image */}
                <div className="h-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-10"></div>
                  <img
                    src={item.image2D}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                  />

                  {/* Hover Action - Desktop */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
                    <button
                      onClick={() => navigate("/tryon", { state: { item } })}
                      className="flex items-center gap-3 px-6 py-3 border border-gold-500 bg-gold-500/10 text-gold-500 rounded-full font-medium hover:bg-gold-500 hover:text-black transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 justify-between relative z-20 bg-gradient-to-t from-black to-transparent -mt-10">
                  <div>
                    <div className="text-xs font-bold text-gold-400 uppercase tracking-widest mb-1 opacity-80">
                      {item.category?.name || item.category || "Jewelry"}
                    </div>
                    <h3 className="text-xl font-serif text-white font-medium truncate mb-2 group-hover:text-gold-200 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-gold-300 font-light text-lg">
                      {item.price ? `$${item.price}` : "Price On Request"}
                    </div>
                  </div>

                  {/* Mobile/Always Visible TryOn Button (Transparent Design) */}
                  <button
                    onClick={() => navigate("/tryon", { state: { item } })}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-gold-500 hover:border-gold-500 hover:text-black transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    <FaCamera className="text-lg" />
                    <span className="tracking-wide font-medium">TRY ON NOW</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
