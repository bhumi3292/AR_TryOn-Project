import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

import http from 'http';
import { Server } from 'socket.io';
import Chat from './models/Chat.js';
import User from './models/User.js';

// Global error handlers for better diagnostics
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  // It's unsafe to continue after an uncaught exception in many cases
});

mongoose.connection.once('open', () => {
  console.log('MongoDB connected');

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat room ${chatId}`);
    });

    socket.on("leaveChat", (chatId) => {
      if (!chatId) return;
      socket.leave(chatId);
    });

    socket.on("sendMessage", async ({ chatId, senderId, text }) => {
      if (!chatId || !senderId || !text) return;

      try {
        // Save to DB
        const messageData = {
          sender: senderId,
          text: text.trim(),
          createdAt: new Date()
        };

        const updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: messageData },
            lastMessage: text.trim(),
            lastMessageAt: messageData.createdAt
          },
          { new: true }
        );

        if (!updatedChat) return;

        // Populate sender for realtime display
        const senderUser = await User.findById(senderId).select('name email');

        const broadcastMessage = {
          _id: messageData._id || new mongoose.Types.ObjectId().toString(),
          sender: {
            _id: senderId,
            name: senderUser ? senderUser.name : 'Unknown',
          },
          text: messageData.text,
          createdAt: messageData.createdAt.toISOString(),
          chat: chatId
        };

        io.to(chatId).emit("newMessage", broadcastMessage);

      } catch (e) {
        console.error("Socket message error", e);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  // Note: We need to listen on 'server', not 'app', for socket to work on same port?
  // Actually, standard is server.listen. app.listen creates its own http server if not passed.
  // Correct pattern:
  // server.listen(PORT, ...)
});



