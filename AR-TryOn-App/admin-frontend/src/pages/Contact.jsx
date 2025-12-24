import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";

export default function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate API call
        toast.success("Message sent successfully! We'll allow 24h for a response.");
        setFormData({ name: "", email: "", message: "" });
    };

    return (
        <div className="min-h-screen bg-black text-gold-500 font-sans selection:bg-gold-500/30">
            <Navbar />
            <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-4 py-2">
                        Get in Touch
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Have a question or custom request? We are here to assist you.
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gold-600 via-yellow-400 to-gold-600 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-zinc-900/80 p-8 md:p-12 rounded-2xl border border-gold-500/20 backdrop-blur-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gold-400 uppercase tracking-wider">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/50 border border-gold-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition duration-300"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gold-400 uppercase tracking-wider">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black/50 border border-gold-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition duration-300"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gold-400 uppercase tracking-wider">Message</label>
                                <textarea
                                    required
                                    rows="5"
                                    className="w-full bg-black/50 border border-gold-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition duration-300 resize-none"
                                    placeholder="How can we help you?"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-gold-600 to-yellow-500 text-black font-bold py-4 rounded-lg hover:from-yellow-400 hover:to-yellow-300 transform hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
