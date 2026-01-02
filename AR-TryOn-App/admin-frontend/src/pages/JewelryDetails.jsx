import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productService, cartService, chatService } from "../services"; // swapped to productService
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { FaShoppingCart, FaCamera, FaCreditCard, FaArrowLeft, FaWhatsapp, FaComments } from "react-icons/fa";

export default function JewelryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const data = await productService.getProductById(id);
            setProduct(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load product details");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async () => {
        // UI Placeholder as per requirements, or attempt service if safe.
        // User said "Add to Cart (state only)" and "Do NOT Add payment logic... or cart persistence".
        // But backend has cart routes. I will try service but catch error gracefully.
        toast.info("Added to cart (UI Only)");
    };

    const buyNow = () => {
        // UI Only
        toast.info("Proceeding to checkout (UI Only)");
        navigate("/checkout");
    };

    const handleChat = async () => {
        // Placeholder route
        toast.info("Opening Chat...");
        try {
            // Attempt if chat service exists
            if (product?.sellerId || product?.createdBy?._id) {
                const sellerId = product.sellerId || product.createdBy._id;
                // const res = await chatService.createOrGetChat(sellerId, product._id);
                // navigate('/chat');
                navigate('/chat');
            } else {
                toast.warn("Seller info unavailable");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleTryOn = () => {
        navigate(`/try-on/${product?._id}`);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[var(--gold)]">Loading...</div>;
    if (!product) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Product not found</div>;

    const sellerName = product.createdBy?.fullName || product.seller?.name || "Verified Seller";

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] text-white font-sans">
            <Navbar />

            <div className="container mx-auto px-6 pt-24 pb-12">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                    <FaArrowLeft /> Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* LEFT: IMAGE */}
                    <div className="relative min-h-[500px] bg-zinc-900/50 rounded-2xl border border-[var(--gold)]/20 overflow-hidden flex items-center justify-center">
                        <img
                            src={product.image2D || "https://via.placeholder.com/500x500?text=No+Image"}
                            alt={product.name}
                            className="max-w-full max-h-[600px] object-contain p-6"
                        />
                    </div>

                    {/* RIGHT: DETAILS */}
                    <div className="flex flex-col justify-center space-y-6">
                        <h1 className="text-4xl md:text-5xl font-serif text-[var(--gold)]">{product.name}</h1>
                        <p className="text-xl text-gray-300 capitalize">Category: {product.category}</p>

                        <div className="flex items-baseline gap-4">
                            <span className="text-3xl font-medium text-white">Rs. {product.price?.toLocaleString()}</span>
                        </div>

                        <p className="text-gray-400 leading-relaxed text-lg">
                            {product.description || "No description available."}
                        </p>

                        <div className="pt-8 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleTryOn}
                                    className="py-3 px-5 rounded-xl bg-[var(--gold)] text-black font-semibold text-md uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.25)] transition flex items-center gap-3"
                                >
                                    <FaCamera className="text-sm" /> Try On
                                </button>

                                <div className="flex gap-4 flex-1">
                                    <button
                                        onClick={addToCart}
                                        className="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition flex items-center justify-center gap-2"
                                    >
                                        <FaShoppingCart /> Add to Cart
                                    </button>
                                    <button
                                        onClick={buyNow}
                                        className="flex-1 py-3 rounded-xl golden-button text-black font-bold uppercase tracking-wide hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition flex items-center justify-center gap-2"
                                    >
                                        <FaCreditCard /> Buy Now
                                    </button>
                                </div>
                            </div>

                            {/* Contact Seller Section */}
                            <div className="bg-zinc-900/50 p-6 rounded-xl border border-[var(--gold)]/10 mt-6">
                                <h3 className="text-[var(--gold)] font-serif text-lg mb-4">Seller Information</h3>
                                <div className="flex items-center gap-3">
                                    <p className="text-gray-300 font-medium mr-4">{sellerName}</p>
                                    <button
                                        onClick={handleChat}
                                        className="h-9 px-3 border border-[var(--gold)] text-[var(--gold)] rounded-md bg-transparent flex items-center gap-2 text-sm hover:bg-[rgba(212,175,55,0.05)] transition"
                                    >
                                        <FaComments />
                                        <span>Chat</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
