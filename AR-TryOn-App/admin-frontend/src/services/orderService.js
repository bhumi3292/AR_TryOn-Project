import API from "./api";

export const orderService = {
    async checkout(payload) {
        const resp = await API.post("/orders/checkout", payload);
        return resp.data;
    },

    async getBuyerOrders() {
        const resp = await API.get("/orders/buyer");
        return resp.data;
    },

    async getSellerOrders() {
        const resp = await API.get("/orders/seller");
        return resp.data;
    },

    async updateOrderStatus(id, status) {
        const resp = await API.put(`/orders/status/${id}`, { status });
        return resp.data;
    },
};
