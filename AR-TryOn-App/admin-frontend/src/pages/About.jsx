import React from "react";
import Navbar from "../components/Navbar";

export default function About() {
    return (
        <div className="min-h-screen bg-black text-gold-500 font-sans selection:bg-gold-500/30">
            <Navbar />
            <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -z-10"></div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-6 py-2">
                        Our Story
                    </h1>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                        Crafting digital elegance for the modern soul. We bridge the gap between tradition and technology, bringing the finest jewelry to your screen with augmented reality.
                    </p>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gold-600 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-black/80 p-8 rounded-lg border border-gold-500/20 backdrop-blur-sm">
                            <h2 className="text-2xl font-serif text-white mb-4">The Vision</h2>
                            <p className="text-gray-400 leading-relaxed">
                                Founded with a passion for innovation, AR Jewelry allows you to experience luxury without leaving your home. Our proprietary Try-On technology ensures that every piece fits your style perfectly before you make it yours.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-gold-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-black/80 p-8 rounded-lg border border-gold-500/20 backdrop-blur-sm">
                            <h2 className="text-2xl font-serif text-white mb-4">Craftsmanship</h2>
                            <p className="text-gray-400 leading-relaxed">
                                We partner with world-renowned artisans to digitize their masterpieces. Every reflection, every sparkle is captured with physics-based rendering to provide an experience indistinguishable from reality.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
