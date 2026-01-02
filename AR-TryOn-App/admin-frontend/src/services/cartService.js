import API from "./api";

export const cartService = {
    async getCart() {
        const resp = await API.get("/cart");
        return resp.data;
    },

    async addToCart(productId, quantity = 1) {
        const resp = await API.post("/cart/add", { productId, quantity });
        return resp.data;
    },

    async updateCartItem(productId, quantity) {
        const resp = await API.put("/cart/update", { productId, quantity });
        return resp.data;
    },

    async removeFromCart(productId) {
        const resp = await API.delete("/cart/remove", { data: { productId } });
        return resp.data;
    },
};
