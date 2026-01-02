import { useState } from "react";
import { authService } from "../services/authService";
import { navigateTo } from "../router/router";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Signup({ onSignup }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    role: 'BUYER',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      await authService.register(formData.fullName || formData.name, formData.email, formData.password, formData.role);
      toast.success("Account created successfully! Welcome.");

      if (typeof onSignup === "function") {
        onSignup();
      } else {
        navigateTo("login");
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err.message || "Signup failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center py-12">
      {/* Shimmer Background */}
      <div className="absolute inset-0 shimmer-background opacity-30" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* Back to Login */}
      <a
        href="/login"
        className="absolute top-8 left-8 text-white/70 hover:text-white transition-colors flex items-center gap-2 z-20"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="text-sm tracking-wide">Back to Login</span>
      </a>

      {/* Signup Form */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="backdrop-blur-xl bg-black/40 border border-gold-500/20 rounded-2xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold-500 to-[rgba(201,163,74,0.6)] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-serif text-white mb-2">
              Create Account
            </h1>
            <p className="text-white/60 text-sm">
              Join our luxury jewelry experience
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-white/90 block">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-white/90 block">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-white/90 block">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label htmlFor="address" className="text-white/90 block">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label htmlFor="city" className="text-white/90 block">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="New York"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label htmlFor="country" className="text-white/90 block">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="United States"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-white/90 block">
                  Password *
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gold-primary)] hover:text-[var(--gold-light)] cursor-pointer z-10 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-white/90 block"
                >
                  Confirm Password *
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold transition-colors outline-none pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gold-primary)] hover:text-[var(--gold-light)] cursor-pointer z-10 p-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>
              {/* Role Selector */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="role" className="text-white/90 block">
                  Account Type *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white p-3 rounded-md focus:border-gold outline-none"
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full lux-btn-primary py-4 mt-6 rounded-md text-black font-bold uppercase tracking-wider hover:scale-[1.02] transition-transform shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-white/60 text-sm mt-6">
            Already have an account?{" "}
            <button
              type="button"
              className="text-[var(--gold)] hover:text-[var(--gold)]/80 transition-colors font-medium cursor-pointer"
              onClick={() => navigateTo("login")}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
