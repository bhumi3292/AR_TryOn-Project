import React, { useEffect, useRef, useState } from "react";
import ARCanvas from "../components/ARCanvas";
import ControlPanel from "../components/ControlPanel";
import JewelryScrollbar from "../components/JewelryScrollbar";
import { getJewelryByCategory } from "../services/jewelryApi";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar"; // Ensure Navbar is present if not in App layout

export default function TryOn() {
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("Necklaces");
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);

  // Transform controls
  const [scale, setScale] = useState(1.0);
  const [xPos, setXPos] = useState(0); // Kept for logic, but might not expose all to UI
  const [yRot, setYRot] = useState(0);
  const [zRot, setZRot] = useState(0);

  // Map UI category labels to backend enum values
  const mapCategoryToApi = (label) => {
    if (!label) return "";
    const lc = label.toLowerCase();
    if (lc.includes("neck")) return "necklace";
    if (lc.includes("ear")) return "earring";
    if (lc.includes("nose")) return "nosepin";
    return label;
  };

  // Handle incoming navigation state
  useEffect(() => {
    if (location.state?.item) {
      const incomingItem = location.state.item;
      setSelected(incomingItem);
      const incCat = (incomingItem.category?.name || incomingItem.category || "").toLowerCase();
      if (incCat.includes("neck")) setCategory("Necklaces");
      else if (incCat.includes("ear")) setCategory("Earrings");
      else if (incCat.includes("nose")) setCategory("Nose Pins");
    }
  }, [location]);

  // Fetch jewelry from backend when category changes
  useEffect(() => {
    let mounted = true;
    async function loadByCategory() {
      try {
        const apiCat = mapCategoryToApi(category || "");
        const list = await getJewelryByCategory(apiCat, 1, 100);
        if (!mounted) return;
        setItems(list || []);
        setFiltered(list || []);
        setSelected((prev) => {
          if (prev) return prev;
          return list && list.length ? list[0] : null;
        });
      } catch (err) {
        if (!mounted) return;
        setItems([]);
        setFiltered([]);
      }
    }
    loadByCategory();
    return () => { mounted = false; };
  }, [category]);

  // Update 3D model
  useEffect(() => {
    if (selected) {
      const id = selected._id || selected.id || selected.product_id || selected.productId;
      if (id) {
        setModelUrl(`http://localhost:5000/ml-output/${encodeURIComponent(id)}.glb`);
      } else {
        setModelUrl(null);
      }
    }
  }, [selected]);

  // Actions
  const handleReset = () => {
    setScale(1);
    setXPos(0);
    setYRot(0);
    setZRot(0);
  };

  const handleTakePhoto = () => {
    const canvas = document.getElementById('ar-canvas');
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const w = window.open();
      w.document.write(`<img src="${dataUrl}" style="width:100%"/>`);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="h-screen w-screen bg-[var(--bg-deep)] overflow-hidden flex flex-col">
      <Navbar />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex pt-24 pb-6 px-8 gap-8 overflow-hidden h-full">

        {/* CENTER STAGE: AR VIEW + BOTTOM CAROUSEL */}
        <div className="flex-[2] flex flex-col h-full gap-6 relative">

          {/* AR Frame */}
          <div className="relative flex-1 rounded-2xl border border-[var(--gold-dim)] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black">

            <div className="absolute inset-0 z-10 pointer-events-none border border-[var(--gold-soft)] opacity-20 rounded-2xl box-border m-2"></div>

            {/* Guide Lines (Minimal) */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[var(--gold-primary)] opacity-10 z-10 pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[var(--gold-primary)] opacity-10 z-10 pointer-events-none"></div>

            <ARCanvas
              modelUrl={modelUrl}
              category={mapCategoryToApi(category)}
              scale={scale}
              xPos={xPos}
              yRot={yRot}
              zRot={zRot}
            />

            <div className="absolute top-6 left-6 z-20">
              <span className="lux-badge animate-pulse">Live AR View</span>
            </div>

            <div className="absolute bottom-6 right-6 z-20 text-[var(--gold-dim)] text-xs font-serif uppercase tracking-widest">
              Smart Tracking Active
            </div>
          </div>

          {/* Bottom Controls: Categories + Carousel */}
          <div className="h-auto flex flex-col gap-4 z-10">
            {/* Category Tabs */}
            <div className="flex gap-4">
              {["Necklaces", "Earrings", "Nose Pins"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-sm tracking-widest uppercase transition-all duration-300 pb-1 ${category === cat
                    ? "text-[var(--gold-primary)] border-b border-[var(--gold-primary)]"
                    : "text-[var(--text-muted)] hover:text-white"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Carousel */}
            <div className="w-full">
              <JewelryScrollbar
                items={filtered}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR: PRODUCT DETAILS */}
        <div className="w-[380px] h-full overflow-y-auto hidden md:block">
          <ControlPanel
            onTakePhoto={handleTakePhoto}
            onReset={handleReset}
            scale={scale}
            setScale={setScale}
            selectedJewelry={selected}
          />
        </div>

      </div>
    </div>
  );
}
