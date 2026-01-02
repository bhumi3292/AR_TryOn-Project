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
      // Requirement: Simple reset without email service.
      // We assume user is verified (or just mocked) and redirect to reset page.
      // In a real app with no email service, this flow is unusual, but per requirements:
      // "Forgot Password (simple reset, no email/OTP)"
      // So we just let them proceed.
      setMessage(resp?.message || "Email verified.");

      // Delay slightly to show message then redirect
      setTimeout(() => {
        // Using window.location or navigate helper
        // We can use navigate from router
        import("../router/router").then(({ navigate }) => {
          navigate("/reset-password");
        });
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to verify email");
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
