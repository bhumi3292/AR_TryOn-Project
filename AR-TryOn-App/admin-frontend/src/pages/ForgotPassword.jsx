import React, { useState } from "react";
import { authService } from "../services/authService";
import { navigateTo } from "../router/router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      setLoading(true);
      const resp = await authService.forgotPassword(email);
      setMessage(
        resp?.message || "If an account exists, a reset link has been sent.",
      );
    } catch (err) {
      setError(err?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-6 bg-black/60 border border-gold-500/20 rounded-xl">
        <h2 className="text-2xl text-white mb-4">Forgot Password</h2>
        {message && <div className="mb-3 text-green-300">{message}</div>}
        {error && <div className="mb-3 text-red-400">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full p-3 rounded bg-white/5 text-white"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="golden-button py-3 px-4"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              className="py-3 px-4 border rounded"
              onClick={() => navigateTo("login")}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
