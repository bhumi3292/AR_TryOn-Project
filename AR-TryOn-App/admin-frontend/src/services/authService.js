import API from "./api";

// Use explicit localStorage keys for admin auth to match other parts of the app
const TOKEN_KEY = "token"; // generic token for buyer/seller/admin
const USER_KEY = "user";

export const authService = {
  async register(name, email, password, role = 'BUYER') {
    // Map 'USER' to 'BUYER' if needed, or pass as is.
    const resp = await API.post("/auth/signup", { name, email, password, role });
    if (resp?.status === 201 && resp?.data?.token) {
      const token = resp.data.token;
      const user = resp.data.user || null;
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return resp.data;
    }
    throw new Error(resp?.data?.message || "Registration failed");
  },

  async login(email, password) {
    const resp = await API.post('/auth/login', { email, password });
    const data = resp?.data || {};
    if (resp.status === 200 && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data;
    }
    throw new Error(data.message || 'Login failed');
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

  // Password management helpers
  async forgotPassword(email) {
    const resp = await API.post("/auth/forgot-password", { email });
    return resp.data;
  },

  async resetPassword(email, newPassword) {
    const resp = await API.post(`/auth/reset-password`, {
      email,
      newPassword,
    });
    return resp.data;
  },

  async getProfile() {
    const resp = await API.get('/user/profile');
    return resp.data;
  },

  async updateProfile(payload) {
    const resp = await API.put('/user/profile', payload);
    if (resp?.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(resp.data.user));
    }
    return resp.data;
  },
  async saveAddress(address) {
    const resp = await API.post('/user/address', address);
    if (resp?.data?.user) localStorage.setItem(USER_KEY, JSON.stringify(resp.data.user));
    return resp.data;
  },
  async updateAddress(address) {
    const resp = await API.put('/user/address', address);
    if (resp?.data?.user) localStorage.setItem(USER_KEY, JSON.stringify(resp.data.user));
    return resp.data;
  },
  async savePayment(payment) {
    const resp = await API.post('/user/payment', payment);
    if (resp?.data?.user) localStorage.setItem(USER_KEY, JSON.stringify(resp.data.user));
    return resp.data;
  },
  async updatePayment(payment) {
    const resp = await API.put('/user/payment', payment);
    if (resp?.data?.user) localStorage.setItem(USER_KEY, JSON.stringify(resp.data.user));
    return resp.data;
  },
};
