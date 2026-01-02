import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Jewelry from '../models/Jewelry.js';

export const createOrGetChat = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { otherUserId, propertyId } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ success: false, message: "Other user ID is required." });
        }
        if (currentUserId.toString() === otherUserId.toString()) {
            return res.status(400).json({ success: false, message: "Cannot chat with yourself." });
        }

        const [currentUser, otherUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(otherUserId)
        ]);
        if (!currentUser || !otherUser) {
            return res.status(404).json({ success: false, message: "One or both users not found." });
        }

        let query = { participants: { $all: [currentUserId, otherUserId] } };
        let chatName = `Chat between ${currentUser.name} and ${otherUser.name}`;

        // If specific to a jewelry item
        if (propertyId) {
            const property = await Jewelry.findById(propertyId);
            if (!property) {
                return res.status(404).json({ success: false, message: "Jewelry not found." });
            }
            query.property = propertyId;
            chatName = `Chat for ${property.name}: ${currentUser.name} - ${otherUser.name}`;

            // Try explicit find first
            let chat = await Chat.findOne(query);
            if (!chat) {
                // If not found specific to property, check if generic chat exists to reuse? 
                // DreamDwell logic seems to create new chat if propertyId provided, separated from generic.
                // We'll stick to creating new if property provided.
            }
        } else {
            query.property = { $exists: false };
        }

        let chat = await Chat.findOne(query);

        if (!chat) {
            chat = await Chat.create({
                name: chatName,
                participants: [currentUserId, otherUserId],
                property: propertyId || null,
                messages: []
            });
            return res.status(201).json({ success: true, message: "New chat created.", data: chat });
        }

        return res.json({ success: true, message: "Existing chat retrieved.", data: chat });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const getMyChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'name email role')
            .populate('property', 'name image2D')
            .sort({ lastMessageAt: -1 });
        return res.json({ success: true, data: chats });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findById(chatId)
            .populate('participants', 'name email role')
            .populate('property', 'name image2D')
            .populate('messages.sender', 'name email')
            .sort({ "messages.createdAt": 1 });

        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found." });
        }

        const isParticipant = chat.participants.some(p => p._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: "Not authorized." });
        }

        return res.json({ success: true, data: chat });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
