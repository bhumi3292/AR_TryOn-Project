import React, { useState, useEffect } from "react";
import { authService } from "../services";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function LocationSettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        mobile: "",
        city: "",
        street: ""
    });

    useEffect(() => {
        const user = authService.getUser();
        if (user && user.deliveryAddress) {
            setFormData(user.deliveryAddress);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update address specifically
            await authService.updateAddress(formData);
            toast.success("Location updated successfully");
            // Optional: Refresh local user data
        } catch (error) {
            toast.error("Failed to update location");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] text-white font-sans">
            <Navbar />
            <div className="container mx-auto px-6 pt-32 max-w-2xl">
                <h1 className="text-3xl font-serif text-[var(--gold)] mb-8 border-b border-[var(--gold)]/20 pb-4">
                    Delivery Location
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-[var(--text-muted)] mb-2">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName || ""}
                                onChange={handleChange}
                                className="w-full bg-zinc-900 border border-[var(--gold)]/20 rounded-lg p-3 focus:outline-none focus:border-[var(--gold)]"
                                placeholder="Receiver Name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-muted)] mb-2">Mobile Number</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile || ""}
                                onChange={handleChange}
                                className="w-full bg-zinc-900 border border-[var(--gold)]/20 rounded-lg p-3 focus:outline-none focus:border-[var(--gold)]"
                                placeholder="Contact Number"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-2">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city || ""}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-[var(--gold)]/20 rounded-lg p-3 focus:outline-none focus:border-[var(--gold)]"
                            placeholder="e.g. Kathmandu"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-2">Street Address / Landmark</label>
                        <textarea
                            name="street"
                            value={formData.street || ""}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-[var(--gold)]/20 rounded-lg p-3 focus:outline-none focus:border-[var(--gold)] h-32"
                            placeholder="Specific location details..."
                            required
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            className="golden-button px-8 py-3 rounded-lg font-medium"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Location"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-8 py-3 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
