import React, { useState, useEffect } from "react";
import { Input, FileUpload, Button, Card } from "../components";
import { useNavigate } from "react-router-dom";
import { productService, authService } from "../services"; // Use productService

export default function AddJewellery({ onSuccess, onNavigate }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    image: null,
  });
  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  // 1. Check Role on Mount
  useEffect(() => {
    const user = authService.getUser();
    if (!user || (user.role !== 'SELLER' && user.role.toLowerCase() !== 'admin')) {
      // Redirect or show forbidden
      setIsSeller(false);
      setTimeout(() => {
        if (typeof onNavigate === "function") onNavigate("dashboard");
        else navigate("/dashboard");
      }, 2000);
    } else {
      setIsSeller(true);
    }
  }, [onNavigate, navigate]);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const showToast = (message, type = "info", ms = 3000) => {
    setToast({ visible: true, message, type });
    setTimeout(
      () => setToast({ visible: false, message: "", type: "info" }),
      ms,
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.image) newErrors.image = "Image is required";
    // Price > 0
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("category", formData.category);
      fd.append("description", formData.description);
      fd.append("price", formData.price);

      // The backend expects 'preview' for the main product image (or 'image2D')
      // Append as 'preview' to potential fix "Unexpected field" if backend uses .fields([{ name: 'preview' }])
      if (formData.image) {
        fd.append("preview", formData.image);
      }

      await productService.addProduct(fd);

      setErrors({});
      showToast("Product added successfully", "success", 2500);
      onSuccess?.();
      setTimeout(() => {
        if (typeof onNavigate === "function") onNavigate("jewelry-list");
        else navigate("/jewelry");
      }, 1000);
    } catch (error) {
      console.error(error);
      const msg = error?.message || "Failed to add product";
      setErrors({ submit: msg });
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-bold">
        Access Restricted: Sellers Only. Redirecting...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-start justify-center py-12">
      <div className="absolute inset-0 shimmer-background opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      <div className="w-full max-w-2xl px-6 z-10 text-luxury-gold">
        <h1 className="text-3xl font-serif mb-6">Add New Product</h1>

        <Card>
          {errors.submit && (
            <div className="bg-red-600 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Product Name"
              placeholder="e.g., Golden Ring with Diamonds"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
              required
            />

            <div>
              <label className="block text-luxury-gold text-sm font-semibold mb-2">
                Category <span className="text-red-500">*</span>
              </label>

              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={`w-full px-4 py-2.5 lux-input border rounded-lg placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-gold-500 transition ${errors.category ? "border-red-500" : "border-gold-600"
                  }`}
                required
              >
                <option value="">Select a category</option>
                <option value="necklace">Necklace</option>
                <option value="earring">Earring</option>
                <option value="nosepin">Nosepin</option>
              </select>

              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <Input
              label="Description"
              placeholder="Describe the product..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              textarea={true}
              rows={3}
            />

            <Input
              label="Price"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              error={errors.price}
              min="0.01"
              step="0.01"
              required
            />

            <FileUpload
              label="Upload Product Image"
              accept="image/*"
              onChange={handleImageChange}
              preview={preview}
              error={errors.image}
              required
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Add Product"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (typeof onNavigate === "function")
                    onNavigate("jewelry-list");
                  else navigate("/jewelry");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Toast */}
        {toast.visible && (
          <div
            className={`fixed top-6 right-6 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-800 text-white"}`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
// Note: removed duplicate alternate component export to avoid multiple default exports
