import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { jewelleryService } from "../services";

export default function EditJewellery({ params } = {}) {
  const id = params?.id || null;
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    jewelleryService
      .getJewelleryById(id)
      .then((res) => {
        if (mounted) setItem(res?.data || res);
      })
      .catch((e) => console.error(e));
    return () => (mounted = false);
  }, [id]);

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-elegant text-gold-500 mb-4">
          Edit Jewelry
        </h1>
        {!id ? (
          <div className="text-gold-200">No jewelry selected.</div>
        ) : !item ? (
          <div className="text-gold-200">Loading...</div>
        ) : (
          <div className="bg-black/40 p-4 rounded border border-gold-500/10">
            <div className="text-white font-semibold text-lg">{item.name}</div>
            <p className="text-gold-200 mt-2">
              Category: {item.category?.name || item.category}
            </p>
            {/* For brevity, editing UI is omitted; implement form similar to AddJewellery when needed */}
          </div>
        )}
      </div>
    </>
  );
}
