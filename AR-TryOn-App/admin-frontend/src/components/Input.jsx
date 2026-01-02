export function Input({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error = "",
  required = false,
  textarea = false,
  ...props
}) {
  const baseClasses = `w-full px-4 py-2.5 lux-input border rounded-lg placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-gold-500 transition ${error ? "border-red-500" : "border-gold-600"
    }`;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-luxury-gold text-sm font-semibold mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {textarea ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={baseClasses}
          {...props}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={baseClasses}
          {...props}
        />
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
