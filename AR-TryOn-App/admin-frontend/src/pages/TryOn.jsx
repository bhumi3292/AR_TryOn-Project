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
    <div className="h-screen w-screen bg-[var(--bg-deep)] overflow-hidden flex flex-col">
      <Navbar />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex pt-20 pb-4 px-6 gap-6 overflow-hidden h-full">

        {/* LEFT PANEL: Category Selector */}
        <div className="w-32 flex flex-col gap-4 py-4">
          <h3 className="text-[var(--gold)] font-serif text-sm tracking-widest text-center mb-2 border-b border-[var(--gold-dim)] pb-2">CATEGORIES</h3>
          {['Necklaces', 'Earrings', 'Nose Pins'].map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  // Requirement: Remove current 3D jewelry
                  setModelUrl(null);
                  setSelected(null);
                }}
                className={`w-full h-14 flex items-center justify-center text-xs font-bold uppercase rounded-lg transition-all duration-300
                  ${active
                    ? 'bg-[var(--gold)] text-black border-2 border-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105'
                    : 'bg-black text-[var(--gold)] border border-[var(--gold)] hover:bg-[rgba(212,175,55,0.1)] hover:border-[var(--gold-primary)]'
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* CENTER PANEL: AR View Container */}
        <div className="flex-1 flex flex-col gap-4 relative">
          {/* AR Canvas Area */}
          <div className="relative flex-1 rounded-2xl border border-[var(--gold-dim)] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black">
            {/* Decorative lines */}
            <div className="absolute inset-0 z-10 pointer-events-none border border-[var(--gold-soft)] opacity-20 rounded-2xl box-border m-2"></div>

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
              />
            </ErrorBoundary>

            {/* Status Overlay */}
            {(!modelUrl || tryonError) && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <p className="text-white text-lg mb-4 font-serif">{tryonError || "Model not generated yet"}</p>
                {!tryonError?.includes("Generating") && (
                  <button
                    onClick={triggerGeneration}
                    className="px-6 py-3 bg-[var(--gold)] text-black font-bold rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  >
                    GENERATE 3D MODEL
                  </button>
                )}
                {tryonError?.includes("Generating") && (
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
                )}
              </div>
            )}

            <div className="absolute top-6 left-6 z-20">
              <span className="lux-badge animate-pulse">Live AR View</span>
            </div>

            <div className="absolute bottom-6 right-6 z-20 text-[var(--gold-dim)] text-xs font-serif uppercase tracking-widest">
              Smart Tracking Active
            </div>
          </div>

          {/* BOTTOM PANEL: Jewelry Scroll Bar (Inside Center Column or spanning? - Prompt implies Bottom Panel. 
                Let's keep it under the AR view for mobile responsiveness, or layout implies it's "Bottom Panel" of the main area) 
            */}
          <div className="h-40 w-full flex flex-col">
            <div className="text-[var(--gold-dim)] text-xs mb-2 uppercase tracking-wide">Select Product</div>
            <div className="flex-1 border-t border-[var(--gold-dim)] pt-2">
              {filtered && filtered.length ? (
                <JewelryScrollbar
                  items={filtered}
                  selected={selected}
                  onSelect={(item) => {
                    // Update selection immediately. 
                    // ARCanvas handles the transition via Suspense and key prop logic.
                    // If smooth cross-fading is needed, ARCanvas key prop should be stable.
                    // For now, removing the blink by not nullifying URL first unless necessary.
                    setSelected(item);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-[var(--gold-dim)]">No items for {category}</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Controls using reusable component */}
        <div className="w-64 py-4 px-2 h-full overflow-hidden">
          <ControlPanel
            onTakePhoto={handleTakePhoto}
            onReset={handleReset}
            scale={scale} setScale={setScale}
            xPos={xPos} setXPos={setXPos}
            yPos={yPos} setYPos={setYPos}
            zPos={zPos} setZPos={setZPos}
            yRot={yRot} setYRot={setYRot}
            zRot={zRot} setZRot={setZRot}
            material={material}
            setMaterial={setMaterial}
            selectedJewelry={selected}
            hidePurchase={true} // Only showing controls here
          />
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
