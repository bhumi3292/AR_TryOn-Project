import React, { useEffect, useRef, useState } from "react";
import ARCanvas from "../components/ARCanvas";
import ControlPanel from "../components/ControlPanel";
import JewelryScrollbar from "../components/JewelryScrollbar";
import { getJewelryByCategory } from "../services/jewelryApi";
import { productService } from "../services";
import { useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar"; // Ensure Navbar is present if not in App layout
import CapturePreviewModal from "../components/CapturePreviewModal";
import ErrorBoundary from "../components/ErrorBoundary";

// DISABLE HMR FOR THIS MODULE
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload();
  });
}

export default function TryOn() {
  const location = useLocation();
  const { productId } = useParams();

  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("Necklaces");
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tryonError, setTryonError] = useState(null);

  // Transform controls
  const [scale, setScale] = useState(1.0);
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  const [zPos, setZPos] = useState(0);
  const [yRot, setYRot] = useState(0);
  const [zRot, setZRot] = useState(0);
  const [material, setMaterial] = useState("Silver");

  // Map UI category labels to backend enum values
  const mapCategoryToApi = (label) => {
    if (!label) return "";
    const lc = label.toLowerCase();
    if (lc.includes("neck")) return "necklace";
    if (lc.includes("ear")) return "earring";
    if (lc.includes("nose")) return "nosepin";
    return label;
  };

  const mapApiToCategory = (apiCat) => {
    if (!apiCat) return "Necklaces";
    const lc = apiCat.toLowerCase();
    if (lc === 'necklace') return "Necklaces";
    if (lc === 'earring') return "Earrings";
    if (lc === 'nosepin') return "Nose Pins";
    return "Necklaces";
  }

  // 1. Initial Load: If productId is present, load it specifically
  useEffect(() => {
    let mounted = true;

    const initLoad = async () => {
      if (productId) {
        try {
          // If we came from navigation state, we might have the item already
          if (location.state?.item && location.state.item._id === productId) {
            const item = location.state.item;
            setSelected(item);
            const catLabel = mapApiToCategory(item.category);
            setCategory(catLabel);
            return;
          }

          // Otherwise fetch fresh
          const product = await productService.getProductById(productId);
          if (!mounted) return;

          if (product) {
            setSelected(product);
            const catLabel = mapApiToCategory(product.category);
            setCategory(catLabel);
            // The category change will trigger the list fetch in the next effect
          }
        } catch (err) {
          console.error("Failed to load initial product", err);
          setTryonError("Product not found");
        }
      }
    };

    initLoad();
    return () => { mounted = false; };
  }, [productId, location.state]);


  // 2. Fetch jewelry list when category changes
  useEffect(() => {
    let mounted = true;
    async function loadByCategory() {
      try {
        const apiCat = mapCategoryToApi(category || "");
        const list = await getJewelryByCategory(apiCat, 1, 100);
        if (!mounted) return;

        setItems(list || []);

        // Filter locally just in case, though backend now handles it
        const readyItems = (list || []).filter(item =>
          item.model3D || item.glbModelUrl
        );

        setFiltered(readyItems);

        // If we have a selected item, ensure it's in the list or just keep it selected
        // If NO item is selected, select the first one
        setSelected((prev) => {
          if (prev) {
            // Check if the previous item matches the new category. 
            // If we just loaded a specific product (e.g. Necklace), category became "Necklaces".
            // The list should contain it. We keep 'prev'.
            const prevCat = mapApiToCategory(prev.category);
            if (prevCat === category) return prev;
          }
          return readyItems && readyItems.length ? readyItems[0] : null;
        });

      } catch (err) {
        if (!mounted) return;
        setItems([]);
        setFiltered([]);
      }
    }
    loadByCategory();
    return () => { mounted = false; };
  }, [category]); // Depend ONLY on category

  // 3. Poll for Model Status when 'selected' changes
  useEffect(() => {
    let mounted = true;
    let pollTimer = null;

    const fetchModelStatus = async (id) => {
      try {
        // We re-fetch the specific product to get the latest status
        const product = await productService.getProductById(id);
        if (!mounted) return;

        const { tryOnStatus, glbModelUrl, model3D, conversionStatus } = product;

        // Normalize status
        const status = tryOnStatus || conversionStatus || 'pending';
        const url = glbModelUrl || model3D;

        if (status === 'ready' || status === 'completed') {
          setModelUrl(url);
          setTryonError(null);
        } else if (status === 'failed') {
          setModelUrl(null);
          setTryonError('Generation failed. Tap to retry.');
        } else {
          // Pending/Processing
          setModelUrl(null);
          setTryonError('Generating 3D Model...');
          // Poll again
          clearTimeout(pollTimer);
          pollTimer = setTimeout(() => fetchModelStatus(id), 3000);
        }
      } catch (err) {
        console.error("Error fetching model status", err);
        setTryonError("Could not load model info");
      }
    };

    if (selected) {
      const id = selected._id || selected.id;
      // Use the URL from the selected object immediately if available to reduce latency
      if (selected.model3D || selected.glbModelUrl) {
        setModelUrl(selected.model3D || selected.glbModelUrl);
      }
      // Then verify status/poll
      fetchModelStatus(id);
    } else {
      setModelUrl(null);
    }

    return () => {
      mounted = false;
      clearTimeout(pollTimer);
    };
  }, [selected]); // Depend only on selected

  const triggerGeneration = async () => {
    if (!selected) return;
    try {
      const id = selected._id || selected.id;
      setTryonError('Starting generation...');
      await productService.generateTryOn(id);
      // Effect will pick up polling
    } catch (e) {
      setTryonError('Trigger failed: ' + e.message);
    }
  };

  // Actions
  const handleReset = () => {
    setScale(1);
    setXPos(0);
    setYPos(0);
    setZPos(0);
    setYRot(0);
    setZRot(0);
  };

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);

  // Safe Setters with Clamping
  const safeSetScale = (val) => setScale(Math.min(Math.max(val, 0.05), 0.5)); // Clamp 0.05 to 0.5
  const safeSetZPos = (val) => setZPos(Math.min(Math.max(val, -2), 1)); // Clamp Z so it doesn't disappear too far

  const handleTakePhoto = async () => {
    try {
      const video = document.getElementById('ar-video');
      const glCanvas = document.getElementById('ar-canvas');
      if (!glCanvas || !video) return;

      // Create an offscreen canvas to composite video + GL canvas
      const w = glCanvas.width || glCanvas.clientWidth || 1280;
      const h = glCanvas.height || glCanvas.clientHeight || 720;
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d');

      // Draw mirrored video (video is flipped in UI)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -w, 0, w, h);
      ctx.restore();

      // Draw the WebGL canvas on top
      ctx.drawImage(glCanvas, 0, 0, w, h);

      const dataUrl = out.toDataURL('image/png');
      setCapturedImage(dataUrl);
      setShowPreview(true);
    } catch (err) {
      console.error('Capture failed', err);
    }
  };

  const handleDownloadCaptured = (dataUrl) => {
    try {
      const a = document.createElement('a');
      a.href = dataUrl;
      const ts = Date.now();
      a.download = `ar-tryon-${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) { console.error(err); }
  };

  const handleShareCaptured = async (dataUrl) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `ar-tryon-${Date.now()}.png`, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'AR Try-On', text: 'Try-on image' });
      } else {
        // Fallback: download and inform user
        handleDownloadCaptured(dataUrl);
        alert('Image downloaded, share manually');
      }
    } catch (err) {
      console.error('Share failed', err);
      handleDownloadCaptured(dataUrl);
      alert('Image downloaded, share manually');
    }
  };

  return (
    <div className="h-screen w-screen bg-[var(--bg-deep)] overflow-hidden flex flex-col relative text-gold font-sans selection:bg-gold selection:text-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--bg-light)_0%,_var(--bg-deep)_100%)] opacity-50 pointer-events-none"></div>

      {/* Use absolute positioning for maximum space usage or flex? Flex is safer for responsiveness. */}
      {/* HEADER: Minimal or Hidden? Image shows no navbar, just app window. We'll keep it minimal or rely on Back button. */}
      {/* Assuming we keep Navbar for consistency but maybe make it transparent absolute? Let's keep existing Navbar but maybe compact. */}
      <Navbar />

      {/* MAIN LAYOUT: 3 Columns */}
      <div className="flex-1 flex flex-row items-stretch pt-20 pb-6 px-8 gap-8 overflow-hidden z-10">

        {/* === LEFT COLUMN: CATEGORIES === */}
        <div className="w-48 flex flex-col justify-center gap-6 py-4">
          <h3 className="text-[var(--gold)] font-serif text-xs tracking-[0.2em] opacity-80 mb-2">CATEGORIES</h3>

          <div className="flex flex-col gap-4">
            {['Necklaces', 'Earrings', 'Nose Pins'].map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setModelUrl(null);
                    setSelected(null);
                  }}
                  className={`w-full py-3 px-4 text-xs font-bold uppercase tracking-wider border transition-all duration-300 relative overflow-hidden group
                    ${active
                      ? 'border-[var(--gold)] text-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)] bg-black'
                      : 'border-transparent text-[var(--gold-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--gold)]'
                    }`}
                >
                  <span className="relative z-10">{cat}</span>
                  {active && <div className="absolute inset-0 bg-[var(--gold)] opacity-10"></div>}
                  <div className="absolute left-0 top-0 h-full w-0.5 bg-[var(--gold)] transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300"></div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto">
            {/* Back Button matching "BACK TO MAIN MENU" style */}
            <button
              onClick={() => window.location.href = '/'} // Simple nav for now
              className="w-full py-3 px-4 border border-[var(--gold-dim)] text-[var(--gold)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--gold)] hover:text-black transition-colors"
            >
              Back to Main Menu
            </button>
          </div>
        </div>

        {/* === CENTER COLUMN: CAMERA + ITEMS === */}
        <div className="flex-1 flex flex-col gap-6 h-full min-w-0">

          {/* CAMERA FRAME */}
          <div className="relative flex-1 rounded-sm border-2 border-[var(--gold)] shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-black overflow-hidden group">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--gold-light)] z-20"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--gold-light)] z-20"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--gold-light)] z-20"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--gold-light)] z-20"></div>

            {/* AR ACTIVE BADGE */}
            <div className="absolute top-4 right-4 z-30 px-2 py-1 border border-[var(--gold)] bg-black/50 text-[var(--gold)] text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">
              AR Active
            </div>

            <ErrorBoundary>
              <ARCanvas
                modelUrl={modelUrl}
                category={mapCategoryToApi(category)}
                scale={scale}
                xPos={xPos}
                yPos={yPos}
                zPos={zPos}
                yRot={yRot}
                zRot={zRot}
                material={material}
                debugMode={debugMode}
              />
            </ErrorBoundary>

            {/* ERROR/STATUS OVERLAY */}
            {(!modelUrl || tryonError) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <p className="text-[var(--gold-light)] text-lg mb-6 font-serif tracking-wide">{tryonError || "Select a piece to try on"}</p>
                {!tryonError?.includes("Generating") && selected && (
                  <button
                    onClick={triggerGeneration}
                    className="px-8 py-3 bg-[var(--gold)] text-black font-bold text-xs tracking-[0.2em] rounded-none hover:bg-white transition shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                  >
                    GENERATE 3D MODEL
                  </button>
                )}
                {tryonError?.includes("Generating") && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[var(--gold)] text-xs tracking-widest animate-pulse">CREATING MODEL...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* JEWELRY LIST (Circular Items) */}
          <div className="h-40 mb-2 w-full flex flex-col justify-end">
            <div className="w-full h-full border-t border-[var(--gold-dim)]/30 pt-2 relative">
              <div className="absolute -top-3 left-8 bg-[var(--bg-deep)] px-2 text-[10px] text-[var(--gold-dim)] uppercase tracking-[0.2em] z-10">
                {category} Collection
              </div>
              {filtered && filtered.length ? (
                <JewelryScrollbar
                  items={filtered}
                  selected={selected}
                  onSelect={(item) => setSelected(item)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--gold-dim)] text-xs italic">
                  No items found in this collection.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* === RIGHT COLUMN: CONTROLS === */}
        <div className="w-64 flex flex-col py-4 h-full relative">
          {/* Custom Control Panel Layout to match Image */}
          <div className="flex flex-col items-center gap-8">

            {/* TAKE PHOTO BUTTON */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={handleTakePhoto}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold-dark)] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[var(--gold)] text-[10px] font-bold tracking-widest">TAKE PHOTO</span>
            </div>

            {/* ACTION LINKS */}
            <div className="flex flex-col items-center gap-4 w-full">
              <button className="flex items-center gap-2 text-[var(--gold-dim)] hover:text-[var(--gold)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-[10px] uppercase tracking-wider">SHARE</span>
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 border border-[var(--gold-dim)] text-[var(--gold-dim)] text-[10px] uppercase tracking-wider hover:bg-[var(--gold-dim)] hover:text-black transition-all"
              >
                RESET PLACEMENT
              </button>
            </div>

            <div className="w-full h-px bg-[var(--gold-dim)] opacity-30"></div>

            {/* SLIDERS */}
            <div className="w-full flex flex-col gap-6">
              {/* Scale */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[var(--gold-dim)] text-[10px] uppercase tracking-wider">
                  <span>Scale</span>
                </div>
                <input
                  type="range" min="0.05" max="0.5" step="0.01"
                  value={scale} onChange={(e) => safeSetScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[var(--gold-dim)] rounded-lg appearance-none cursor-pointer accent-[var(--gold)]"
                />
              </div>

              {/* X-Pos */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[var(--gold-dim)] text-[10px] uppercase tracking-wider">
                  <span>X-Pos</span>
                  <span>{xPos.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="-0.5" max="0.5" step="0.01"
                  value={xPos} onChange={(e) => setXPos(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[var(--gold-dim)] rounded-lg appearance-none cursor-pointer accent-[var(--gold)]"
                />
              </div>

              {/* Y-Rot */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[var(--gold-dim)] text-[10px] uppercase tracking-wider">
                  <span>Y-Rot</span>
                </div>
                <input
                  type="range" min={-Math.PI} max={Math.PI} step="0.1"
                  value={yRot} onChange={(e) => setYRot(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[var(--gold-dim)] rounded-lg appearance-none cursor-pointer accent-[var(--gold)]"
                />
              </div>

              {/* Z-Rot */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[var(--gold-dim)] text-[10px] uppercase tracking-wider">
                  <span>Z-Rot</span>
                </div>
                <input
                  type="range" min={-Math.PI} max={Math.PI} step="0.1"
                  value={zRot} onChange={(e) => setZRot(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[var(--gold-dim)] rounded-lg appearance-none cursor-pointer accent-[var(--gold)]"
                />
              </div>
            </div>

          </div>

          <div className="mt-auto flex justify-center opacity-50 text-[10px] text-[var(--gold-dim)]">
            © 2026 AR JEWELRY
          </div>

        </div>

      </div>

      <CapturePreviewModal
        open={showPreview}
        src={capturedImage}
        onClose={() => setShowPreview(false)}
        onRetake={() => { setShowPreview(false); setCapturedImage(null); }}
        onDownload={(src) => handleDownloadCaptured(src)}
        onShare={(src) => handleShareCaptured(src)}
      />
    </div>
  );
}

