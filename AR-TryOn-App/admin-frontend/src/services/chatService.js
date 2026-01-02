import API from "./api";
import { io } from "socket.io-client";

let socket;

export const chatService = {
    // --- REST API Methods ---

    async createOrGetChat(otherUserId, propertyId = null) {
        const resp = await API.post("/chats", { otherUserId, propertyId });
        return resp.data;
    },

    async getMyChats() {
        const resp = await API.get("/chats");
        return resp.data;
    },

    async getChatById(chatId) {
        const resp = await API.get(`/chats/${chatId}`);
        return resp.data;
    },

    // --- Socket.IO Methods ---

    connect() {
        if (socket) return socket;
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        socket = io(BASE_URL);
        return socket;
    },

    disconnect() {
        if (socket) {
            if (socket.connected) {
                socket.disconnect();
            }
            socket = null;
        }
    },

    joinChat(chatId) {
        if (!socket) this.connect();
        if (socket) socket.emit("joinChat", chatId);
    },

    leaveChat(chatId) {
        if (socket) socket.emit("leaveChat", chatId);
    },

    sendMessage(chatId, senderId, text) {
        if (!socket) this.connect();
        if (socket) socket.emit("sendMessage", { chatId, senderId, text });
    },

    onNewMessage(callback) {
        // Ensure connection exists
        if (!socket) {
            this.connect();
        }

        // Safety check: if connection failed or socket is somehow null (shouldn't be if connect() works),
        // we guard against the crash.
        if (socket) {
            socket.on("newMessage", callback);
        }

        return () => {
            // Check if socket still exists before turning listener off
            if (socket) {
                socket.off("newMessage", callback);
            }
        };
    }
};
