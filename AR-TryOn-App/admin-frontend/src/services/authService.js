import API from "./api";

// Use explicit localStorage keys for admin auth to match other parts of the app
const TOKEN_KEY = "adminToken";
const USER_KEY = "adminUser";

export const authService = {
  async register(fullName, email, password) {
    const resp = await API.post("/admin/signup", {
      fullName,
      email,
      password,
      confirmPassword: password,
    });
    // If backend returns success, optionally auto-login
    if (resp?.data?.success) {
      return this.login(email, password);
    }
    throw new Error(resp?.data?.message || "Registration failed");
  },

  async login(email, password) {
    const resp = await API.post("/admin/login", { email, password });
    const data = resp?.data || {};
    if (resp.status === 200 && (data.token || data?.data?.token)) {
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user || null;
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return data;
    }
    throw new Error(data.message || "Login failed");
  },

  async logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Password management helpers (backend endpoints must exist)
  async forgotPassword(email) {
    const resp = await API.post("/admin/forgot-password", { email });
    return resp.data;
  },

  async resetPassword(token, newPassword, confirmPassword) {
    const resp = await API.post(`/admin/reset-password/${token}`, {
      newPassword,
      confirmPassword,
    });
    return resp.data;
  },

  async getProfile() {
    const resp = await API.get("/admin/me");
    return resp.data;
  },

  async updateProfile(formData) {
    // API wrapper should handle Content-Type: multipart/form-data when data is FormData
    const resp = await API.put("/admin/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (resp?.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(resp.data.user));
    }
    return resp.data;
  },
};
