import React, { useState } from "react";
import { authService } from "../services/authService";
import { navigateTo } from "../router/router";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const resp = await authService.resetPassword(
        email,
        newPassword
      );
      setMessage(resp?.message || "Password reset successful. Please sign in.");

      setTimeout(() => {
        navigateTo("login");
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-6 bg-black/60 border border-gold-500/20 rounded-xl">
        <h2 className="text-2xl text-white mb-4">Reset Password</h2>
        {message && <div className="mb-3 text-green-300">{message}</div>}
        {error && <div className="mb-3 text-red-400">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Confirm your email"
            className="w-full p-3 rounded bg-white/5 text-white"
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full p-3 rounded bg-white/5 text-white"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full p-3 rounded bg-white/5 text-white"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="golden-button py-3 px-4"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
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
