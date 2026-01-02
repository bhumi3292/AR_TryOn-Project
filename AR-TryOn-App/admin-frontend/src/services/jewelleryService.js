import { authService } from "./authService";

const API_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

const getHeaders = () => ({
  Authorization: `Bearer ${authService.getToken()}`,
});

export const jewelleryService = {
  async getSellerJewellery() {
    const response = await fetch(`${API_URL}/jewelry/seller`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data.data || data;
  },

  async getAllJewellery(page = 1, limit = 10, search = "") {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append("search", search);

    const response = await fetch(`${API_URL}/jewelry?${params}`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data.data || data;
  },

  async getJewelleryById(id) {
    const response = await fetch(`${API_URL}/jewelry/${id}`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data.data || data;
  },

  async addJewellery(formData) {
    const response = await fetch(`${API_URL}/jewelry`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data.data || data;
  },

  async updateJewellery(id, formData) {
    const response = await fetch(`${API_URL}/jewelry/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data.data || data;
  },

  async deleteJewellery(id) {
    const response = await fetch(`${API_URL}/jewelry/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async getCategories() {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: getHeaders(),
      });

      // If backend returns non-JSON (e.g., HTML) or an error, guard against parse errors
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        // Return empty array when response isn't JSON
        return [];
      }

      if (!response.ok) {
        // If backend indicates error, surface message or return empty list
        return [];
      }

      return data.data || data || [];
    } catch (err) {
      // Network or other fetch error — return empty categories
      return [];
    }
  },
};
