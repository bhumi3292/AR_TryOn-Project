import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { cartService } from "../services";
import { FaTrash, FaMinus, FaPlus, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Cart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const data = await cartService.getCart();
            if (data && data.cart) {
                setCart(data.cart);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load cart");
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, newQty) => {
        if (newQty < 1) return;
        try {
            const data = await cartService.updateCartItem(productId, newQty);
            if (data.cart) setCart(data.cart);
        } catch (err) {
            toast.error("Failed to update quantity");
        }
    };

    const removeItem = async (productId) => {
        try {
            const data = await cartService.removeFromCart(productId);
            if (data.cart) setCart(data.cart);
            toast.success("Item removed");
        } catch (err) {
            toast.error("Failed to remove item");
        }
    };

    const calculateTotal = () => {
        if (!cart?.items) return 0;
        return cart.items.reduce(
            (acc, item) => acc + (item.productId?.price || 0) * item.quantity,
            0
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <h1 className="text-4xl font-serif text-[var(--gold)] mb-8 border-b border-[var(--gold)]/20 pb-4">
                    Your Shopping Cart
                </h1>

                {!cart || cart.items.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-[var(--gold)]/10">
                        <p className="text-gray-400 text-xl mb-6">Your cart is empty.</p>
                        <button
                            onClick={() => navigate("/jewelry")}
                            className="px-8 py-3 bg-[var(--gold)] text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            Browse Collection
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            {cart.items.map((item) => {
                                const product = item.productId;
                                if (!product) return null; // Safety check
                                return (
                                    <div
                                        key={product._id}
                                        className="flex flex-col md:flex-row items-center gap-6 bg-zinc-900/50 p-6 rounded-xl border border-[var(--gold)]/10"
                                    >
                                        <img
                                            src={product.image2D}
                                            alt={product.name}
                                            className="w-24 h-24 object-cover rounded-lg border border-[var(--gold)]/20"
                                        />
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-xl font-serif text-white mb-1">
                                                {product.name}
                                            </h3>
                                            <p className="text-sm text-gray-400 mb-2 capitalize">
                                                {product.category}
                                            </p>
                                            <p className="text-[var(--gold)] font-medium">
                                                Rs. {product.price}
                                            </p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-3 bg-black/40 rounded-lg px-3 py-2 border border-[var(--gold)]/10">
                                            <button
                                                onClick={() => updateQuantity(product._id, item.quantity - 1)}
                                                className="text-gray-400 hover:text-white p-1"
                                                disabled={item.quantity <= 1}
                                            >
                                                <FaMinus size={12} />
                                            </button>
                                            <span className="w-8 text-center font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(product._id, item.quantity + 1)}
                                                className="text-gray-400 hover:text-white p-1"
                                            >
                                                <FaPlus size={12} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeItem(product._id)}
                                            className="text-red-500/70 hover:text-red-500 p-2 transition-colors"
                                            title="Remove Item"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-xl border border-[var(--gold)]/20 sticky top-32">
                                <h2 className="text-2xl font-serif text-white mb-6">Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Subtotal</span>
                                        <span>Rs. {calculateTotal()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Shipping</span>
                                        <span>Free</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-4"></div>
                                    <div className="flex justify-between text-xl font-medium text-[var(--gold)]">
                                        <span>Total</span>
                                        <span>Rs. {calculateTotal()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate("/checkout")}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[var(--gold)] text-black font-bold uppercase tracking-wide rounded-lg hover:scale-[1.02] transition-transform shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                                >
                                    Proceed to Checkout <FaArrowRight />
                                </button>

                                <p className="text-xs text-center text-gray-500 mt-4">
                                    Secure Checkout powered by eSewa & Khalti
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
