import API from "./api";

export const paymentService = {
    async initiatePayment(orderId, source, amount) {
        // source: 'esewa' or 'khalti'
        const resp = await API.post("/payment/initiate", { orderId, source, amount });
        return resp.data;
    },

    async verifyKhalti(token, amount, idx) {
        const resp = await API.post("/payment/verify/khalti", { token, amount, idx });
        return resp.data;
    },

    async verifyEsewa(data) {
        // eSewa returns base64 encoded string 'data' on success redirect
        const resp = await API.post("/payment/verify/esewa", { data });
        return resp.data;
    }
};
