import React, { useState } from 'react';
import ARCanvas from '../components/ARCanvas';

/**
 * AR Test Page
 * 
 * Standalone page for testing the AR jewelry try-on system
 * without dependencies on the backend or jewelry catalog.
 */
export default function ARTest() {
    const [category, setCategory] = useState('necklace');
    const [scale, setScale] = useState(1.0);
    const [xPos, setXPos] = useState(0);
    const [yRot, setYRot] = useState(0);
    const [zRot, setZRot] = useState(0);
    const [modelUrl, setModelUrl] = useState('');

    const handleReset = () => {
        setScale(1.0);
        setXPos(0);
        setYRot(0);
        setZRot(0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">
                    AR Jewelry Try-On Test
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* AR View */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-xl p-4 shadow-2xl">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <ARCanvas
                                    modelUrl={modelUrl}
                                    category={category}
                                    scale={scale}
                                    xPos={xPos}
                                    yRot={yRot}
                                    zRot={zRot}
                                />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-4 bg-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-3">📋 Instructions</h2>
                            <ul className="space-y-2 text-gray-300">
                                <li>✅ Allow camera access when prompted</li>
                                <li>💡 Ensure good lighting for better tracking</li>
                                <li>👤 Face the camera directly</li>
                                <li>🎯 Enter a GLB model URL to test jewelry</li>
                                <li>🎨 Adjust controls to fine-tune positioning</li>
                            </ul>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-6">
                        {/* Model URL */}
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">🔗 Model URL</h2>
                            <input
                                type="text"
                                value={modelUrl}
                                onChange={(e) => setModelUrl(e.target.value)}
                                placeholder="http://localhost:5000/ml-output/model.glb"
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Enter the URL to your GLB model file
                            </p>
                        </div>

                        {/* Category Selection */}
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">📦 Category</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {['necklace', 'earring', 'nosepin'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${category === cat
                                                ? 'bg-purple-600 text-white shadow-lg'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Transform Controls */}
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">🎛️ Controls</h2>

                            {/* Scale */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Scale: {scale.toFixed(2)}
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="3"
                                    step="0.1"
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* X Position */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    X Position: {xPos.toFixed(2)}
                                </label>
                                <input
                                    type="range"
                                    min="-1"
                                    max="1"
                                    step="0.01"
                                    value={xPos}
                                    onChange={(e) => setXPos(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Y Rotation */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Y Rotation: {yRot.toFixed(2)}
                                </label>
                                <input
                                    type="range"
                                    min="-3.14"
                                    max="3.14"
                                    step="0.01"
                                    value={yRot}
                                    onChange={(e) => setYRot(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Z Rotation */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Z Rotation: {zRot.toFixed(2)}
                                </label>
                                <input
                                    type="range"
                                    min="-3.14"
                                    max="3.14"
                                    step="0.01"
                                    value={zRot}
                                    onChange={(e) => setZRot(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                            >
                                Reset All
                            </button>
                        </div>

                        {/* Landmark Info */}
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">📍 Landmarks</h2>
                            <div className="text-sm text-gray-300 space-y-2">
                                <div className="flex justify-between">
                                    <span>Nose Pin:</span>
                                    <span className="text-purple-400">4, 197</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Earrings:</span>
                                    <span className="text-purple-400">234, 454</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Necklace:</span>
                                    <span className="text-purple-400">152</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Face Scale:</span>
                                    <span className="text-purple-400">10, 152</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => window.history.back()}
                        className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all"
                    >
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
}
