import axios from 'axios';
import { authService } from './authService';

const API_URL = import.meta.env.DEV
    ? "/api"
    : import.meta.env.VITE_API_URL || "/api";

const getHeaders = () => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const productService = {
    // 1. Add Product (SELLER only)
    async addProduct(formData) {
        // supports FormData for file upload OR JSON if supported
        const isFormData = formData instanceof FormData;
        const headers = getHeaders();
        // Do not force JSON if it is FormData, axios handles boundary
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        } else {
            // For FormData, let axios set content-type with boundary
            delete headers['Content-Type'];
        }

        try {
            const response = await axios.post(`${API_URL}/products`, formData, { headers });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // 2. Get All Products (Public)
    async getProducts(params = {}) {
        try {
            // Mapping standard params to backend 'jewelry' controller if needed, 
            // but /api/products maps to jewelryRoutes which works fine.
            const response = await axios.get(`${API_URL}/products`, { params });
            // The backend returns { success: true, count: N, data: [] }
            return response.data.data || [];
        } catch (error) {
            console.error("Fetch products failed", error);
            // Non-blocking return empty
            return [];
        }
    },

    // 3. Get Product Details (Public)
    async getProductById(id) {
        try {
            const response = await axios.get(`${API_URL}/products/${id}`);
            // Backend returns { success: true, data: {...} }
            return response.data.data || null;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // 4. Get Seller Products
    async getSellerProducts() {
        try {
            const response = await axios.get(`${API_URL}/products/seller`, { headers: getHeaders() });
            return response.data.data || [];
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // 5. Trigger AR/ML Generation
    async generateTryOn(id) {
        try {
            // Using the new route defined in tryOnRoutes.js
            const response = await axios.post(`${API_URL}/tryon/${id}/generate`, {}, { headers: getHeaders() });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default productService;
