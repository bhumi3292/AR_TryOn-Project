import React, { useState } from "react";

export function FileUpload({
  label,
  accept = "image/*",
  onChange,
  error = "",
  preview = null,
  required = false,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-luxury-gold text-sm font-semibold mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragActive
            ? "border-luxury-gold bg-luxury-gray"
            : "border-luxury-gold hover:border-luxury-gold-light"
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
          id="file-upload"
          required={required}
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <p className="text-luxury-gold font-semibold">
            Click or drag to upload
          </p>
          <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</p>
        </label>
      </div>
      {preview && (
        <div className="mt-4">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-luxury-gold"
          />
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
