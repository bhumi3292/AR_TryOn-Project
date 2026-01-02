import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useParams, useNavigate } from "react-router-dom"; // Use useParams
import { jewelleryService } from "../services";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";

export default function EditJewellery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    image: null,
  });
  const [currentImage, setCurrentImage] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [cats, item] = await Promise.all([
        jewelleryService.getCategories(),
        jewelleryService.getJewelleryById(id)
      ]);
      setCategories(Array.isArray(cats) ? cats : cats.data || []);

      if (item) {
        setFormData({
          name: item.name,
          category: item.category?.name || item.category,
          description: item.description || "",
          price: item.price || "",
          image: null // New image only if changed
        });
        setCurrentImage(item.image2D);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load jewelry");
      navigate("/dashboard");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("category", formData.category);
      fd.append("description", formData.description);
      fd.append("price", formData.price);
      if (formData.image) fd.append("image2D", formData.image);

      await jewelleryService.updateJewellery(id, fd);
      toast.success("Jewelry updated successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <FaArrowLeft /> Back to Dashboard
        </button>

        <div className="max-w-2xl mx-auto bg-zinc-900/50 p-8 rounded-xl border border-[var(--gold)]/20">
          <h1 className="text-3xl font-serif text-[var(--gold)] mb-6">Edit Jewelry</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 mb-2">Jewelry Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] outline-none"
              >
                <option value="">Select Category</option>
                <option value="necklace">Necklace</option>
                <option value="earring">Earring</option>
                <option value="nosepin">Nosepin</option>
                {Array.isArray(categories) && categories.map(cat => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Price</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Image (Leave blank to keep current)</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-black/50 rounded-lg overflow-hidden border border-white/10">
                  <img src={preview || currentImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--gold)]/10 file:text-[var(--gold)] hover:file:bg-[var(--gold)]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-[var(--gold)] text-black font-bold uppercase tracking-wide rounded-lg hover:scale-[1.02] transition-transform shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
            >
              {submitting ? 'Updating...' : 'Update Jewelry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
