import axios from "axios";
import { authService } from "./authService";

const API_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

function getHeaders() {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getJewelryByCategory(
  category = "",
  page = 1,
  limit = 100,
) {
  try {
    const params = { page, limit };

    if (category) params.category = category;
    // Optimization: request only ready items from backend
    params.tryOnStatus = 'ready';

    const res = await axios.get(`${API_URL}/jewelry`, {
      params,
      headers: getHeaders(),
    });

    // backend may return { data: { items: [...] } } or an array
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch (err) {
    // surface error to caller
    throw err;
  }
}

export default { getJewelryByCategory };
