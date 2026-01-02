import { useState } from "react";
import { authService } from "../services/authService";
import { navigateTo } from "../router/router";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login({ onLogin, goSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authService.login(email, password);
      toast.success("Login successful! Welcome back.");

      if (typeof onLogin === "function") {
        onLogin();
      } else {
        // After successful login, take the user to the public Home page where the Navbar
        // will show the Add Jewellery button because auth state is stored in localStorage.
        navigateTo("home");
        // Force reload to ensure Navbar reads latest localStorage (simple approach)
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 shimmer-background opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      <a
        href="/"
        className="absolute top-6 left-6 text-white/70 hover:text-white transition-colors flex items-center gap-2 z-20"
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
        <span className="text-sm tracking-wide">Back to Home</span>
      </a>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-xl bg-black/40 border border-gold-500/20 rounded-2xl p-8 md:p-10 shadow-2xl">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-serif text-white mb-2">Login</h1>
            <p className="text-white/60 text-sm">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-white/90 block">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@arjewelry.com"
                className="mt-2 w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-white/90 block">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-gold-500/20 text-white placeholder:text-white/40 p-3 rounded-md focus:border-gold outline-none transition-colors pr-10"
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

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-gold-500 hover:text-gold-400 transition-colors"
                onClick={() => navigateTo("forgot-password")}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full lux-btn-primary py-3 mt-4 rounded-md text-black font-bold uppercase tracking-wider hover:scale-[1.02] transition-transform"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gold-500/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/40 px-2 text-white/50">Or</span>
            </div>
          </div>

          <p className="text-center text-white/60 text-sm">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-[var(--gold)] hover:text-[var(--gold)]/80 transition-colors font-medium"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
