import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { chatService, authService } from "../services";
import { toast } from "react-toastify";
import { FaPaperPlane, FaUserCircle } from "react-icons/fa";

export default function Chat() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        const user = authService.getUser();
        if (!user) {
            navigate("/login");
            return;
        }
        setCurrentUser(user);
        loadChats();

        chatService.connect();

        return () => {
            chatService.disconnect();
        };
    }, []);

    // Handle "Preselect Chat" redirection (DreamDwell Style)
    useEffect(() => {
        if (state?.preselectChatId && currentUser) {
            handleChatIdPreselection(state.preselectChatId);
        }
    }, [state?.preselectChatId, currentUser]);

    const handleChatIdPreselection = async (chatId) => {
        // We might not have this chat in 'chats' list yet if we just created it
        // and 'loadChats' hasn't finished or returned it yet. 
        // We should explicitly fetch it and set it as selected.
        try {
            // First check if it's already in our list
            const existing = chats.find(c => c._id === chatId);
            if (existing) {
                handleChatSelect(existing);
            } else {
                // Fetch details
                const res = await chatService.getChatById(chatId);
                if (res.success) {
                    const chat = res.data;
                    setChats(prev => {
                        // Avoid duplicates
                        if (prev.find(c => c._id === chat._id)) return prev;
                        return [chat, ...prev];
                    });
                    handleChatSelect(chat);
                }
            }
        } catch (err) {
            console.error("Failed to preselect chat", err);
        }
    };

    // Socket Listener
    useEffect(() => {
        const unsub = chatService.onNewMessage((msg) => {
            if (selectedChat && msg.chat === selectedChat._id) {
                setMessages((prev) => [...prev, msg]);
                scrollToBottom();
            }
            // Update last message in sidebar list
            setChats(prev => prev.map(c => {
                if (c._id === msg.chat) {
                    return { ...c, lastMessage: msg.text, lastMessageAt: msg.createdAt };
                }
                return c;
            }));
        });
        return unsub;
    }, [selectedChat]);

    const loadChats = async () => {
        try {
            const res = await chatService.getMyChats();
            setChats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const initiateChat = async (otherUserId, propertyId = null) => {
        try {
            const res = await chatService.createOrGetChat(otherUserId, propertyId);
            if (res.success) {
                const chat = res.data;
                // Add to list if new
                setChats(prev => {
                    if (!prev.find(c => c._id === chat._id)) return [chat, ...prev];
                    return prev;
                });
                handleChatSelect(chat);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to start chat");
        }
    };

    const handleChatSelect = async (chat) => {
        if (selectedChat) {
            chatService.leaveChat(selectedChat._id);
        }

        setSelectedChat(chat);
        chatService.joinChat(chat._id);

        try {
            // Load full details + messages
            const res = await chatService.getChatById(chat._id);
            setMessages(res.data.messages || []);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        chatService.sendMessage(selectedChat._id, currentUser._id || currentUser.id, newMessage);
        setNewMessage("");
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const _socket = chatService.connect();
        setConnected(_socket.connected);

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        _socket.on('connect', onConnect);
        _socket.on('disconnect', onDisconnect);

        return () => {
            _socket.off('connect', onConnect);
            _socket.off('disconnect', onDisconnect);
        }
    }, []);

    const getOtherParticipant = (chat) => {
        if (!chat || !chat.participants) return { name: "Unknown" };
        const other = chat.participants.find(p => p._id !== (currentUser?._id || currentUser?.id));
        return other || chat.participants[0] || { name: "Unknown" };
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col">
            <Navbar />

            <div className="flex-1 container mx-auto pt-24 pb-6 px-4 flex gap-6 h-[calc(100vh-2rem)]">

                {/* Chat List Sidebar */}
                <div className="w-1/3 bg-zinc-900/50 border border-[var(--gold)]/20 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[var(--gold)]/10 bg-black/40 flex justify-between items-center">
                        <h2 className="text-xl font-serif text-[var(--gold)]">Messages</h2>
                        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} title={connected ? "Connected" : "Disconnected"}></div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {chats.length === 0 ? (
                            <p className="p-4 text-gray-500 text-center">No conversations yet.</p>
                        ) : (
                            chats.map(chat => {
                                const other = getOtherParticipant(chat);
                                const isActive = selectedChat?._id === chat._id;
                                return (
                                    <div
                                        key={chat._id}
                                        onClick={() => handleChatSelect(chat)}
                                        className={`p-4 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition ${isActive ? 'bg-[var(--gold)]/10 border-l-4 border-l-[var(--gold)]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-gray-300">
                                                <FaUserCircle size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-white truncate">{other.name}</h4>
                                                <p className="text-sm text-gray-400 truncate">{chat.lastMessage || "Start chatting..."}</p>
                                            </div>
                                            <span className="text-xs text-zinc-600">
                                                {new Date(chat.lastMessageAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-zinc-900/50 border border-[var(--gold)]/20 rounded-xl overflow-hidden flex flex-col">
                    {selectedChat ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-[var(--gold)]/10 bg-black/40 flex items-center gap-3">
                                <FaUserCircle size={28} className="text-[var(--gold)]" />
                                <h3 className="text-lg font-medium text-white">{getOtherParticipant(selectedChat).name}</h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender._id === (currentUser._id || currentUser.id) || msg.sender === (currentUser._id || currentUser.id);
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-[var(--gold)] text-black rounded-tr-none' : 'bg-zinc-800 text-white rounded-tl-none'}`}>
                                                <p>{msg.text}</p>
                                                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-black/60' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={sendMessage} className="p-4 border-t border-[var(--gold)]/10 bg-black/40 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-white focus:border-[var(--gold)] focus:outline-none"
                                />
                                <button type="submit" className="bg-[var(--gold)] text-black p-3 rounded-full hover:bg-[#e5c560] transition">
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 text-[var(--gold)]/20">
                                <FaUserCircle size={40} />
                            </div>
                            <p>Select a conversation to start chatting.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
