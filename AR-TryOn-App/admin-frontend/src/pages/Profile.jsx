import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { authService } from "../services/authService";
import { toast } from "react-toastify";
import {
    User, Camera, Edit, LayoutDashboard, Mail, Phone, MapPin, Globe, CreditCard
} from "lucide-react";

export default function Profile() {
    const [user, setUser] = useState(authService.getUser());
    const [activeTab, setActiveTab] = useState("overview");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await authService.getProfile();
            if (data && data.user) {
                setUser(data.user);
                setFormData({
                    fullName: data.user.fullName || "",
                    email: data.user.email || "",
                    phone: data.user.phone || "",
                    address: data.user.address || "",
                    city: data.user.city || "",
                    country: data.user.country || "",
                });
            }
        } catch (error) {
            console.error("Failed to load profile", error);
            toast.error("Failed to load profile data.");
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Only image files are allowed.");
            return;
        }

        const data = new FormData();
        data.append("profileImage", file);

        try {
            setIsUploading(true);
            const res = await authService.updateProfile(data);
            if (res.success) {
                toast.success("Profile image updated!");
                setUser(res.user); // Update local user state
            }
        } catch (error) {
            console.error("Image upload failed", error);
            toast.error("Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await authService.updateProfile(formData);
            if (res.success) {
                toast.success("Profile updated successfully!");
                setUser(res.user);
            }
        } catch (error) {
            console.error("Update failed", error);
            toast.error(error.message || "Failed to update profile.");
        }
    };

    const getSidebarButtonClasses = (tabName) => {
        const baseClasses = "w-full flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200";
        if (activeTab === tabName) {
            return `${baseClasses} bg-[var(--gold)] text-black shadow-md`;
        }
        return `${baseClasses} text-gray-300 hover:bg-white/10 hover:text-[var(--gold)]`;
    };

    // Helper to handle image src (if using local backend uploads)
    const getProfileImageSrc = (path) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith("http")) return path;
        // Assuming backend runs on explicit port or proxy handles it. 
        // Since specific interactions are simplified, we'll try relative path if proxy is set up or assume specific URL.
        // Ideally, pass full URL from backend. For now, assuming standard relative.
        return `http://localhost:3001${path}`; // Adjust if BASE_URL is dynamic
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
            <Navbar />

            <div className="container mx-auto px-4 py-8 pt-28">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1 bg-zinc-900/50 backdrop-blur-md border border-[var(--gold)]/20 rounded-xl p-6 h-fit sticky top-24">
                        <div className="flex flex-col items-center text-center pb-6 border-b border-[var(--gold)]/10 mb-6">
                            <div className="relative group cursor-pointer" onClick={handleImageClick}>
                                <img
                                    src={getProfileImageSrc(user?.profileImage)}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-[var(--gold)] shadow-lg transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-[var(--gold)]" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                                        <span className="animate-spin h-6 w-6 border-2 border-t-transparent border-[var(--gold)] rounded-full"></span>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-serif text-[var(--gold)] mt-4">{user?.fullName || "Admin User"}</h2>
                            <p className="text-gray-400 text-sm">{user?.email}</p>
                        </div>

                        <nav className="space-y-2">
                            <button onClick={() => setActiveTab("overview")} className={getSidebarButtonClasses("overview")}>
                                <LayoutDashboard className="h-5 w-5 mr-3" />
                                Overview
                            </button>
                            <button onClick={() => setActiveTab("personal")} className={getSidebarButtonClasses("personal")}>
                                <Edit className="h-5 w-5 mr-3" />
                                Personal Info
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3 bg-zinc-900/50 backdrop-blur-md border border-[var(--gold)]/20 rounded-xl p-8">
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-serif text-[var(--gold)] mb-6">Profile Overview</h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-black/40 p-6 rounded-lg border border-[var(--gold)]/10 flex items-center gap-4">
                                        <div className="p-3 bg-[var(--gold)]/10 rounded-full">
                                            <Mail className="h-6 w-6 text-[var(--gold)]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Email</p>
                                            <p className="font-medium text-white">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-lg border border-[var(--gold)]/10 flex items-center gap-4">
                                        <div className="p-3 bg-[var(--gold)]/10 rounded-full">
                                            <Phone className="h-6 w-6 text-[var(--gold)]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Phone</p>
                                            <p className="font-medium text-white">{user?.phone || "Not set"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-lg border border-[var(--gold)]/10 flex items-center gap-4">
                                        <div className="p-3 bg-[var(--gold)]/10 rounded-full">
                                            <MapPin className="h-6 w-6 text-[var(--gold)]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Location</p>
                                            <p className="font-medium text-white">{user?.city ? `${user.city}, ${user.country}` : "Not set"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-lg border border-[var(--gold)]/10 flex items-center gap-4">
                                        <div className="p-3 bg-[var(--gold)]/10 rounded-full">
                                            <User className="h-6 w-6 text-[var(--gold)]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Role</p>
                                            <p className="font-medium text-white capitalize">{user?.role || "Admin"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "personal" && (
                            <div className="max-w-2xl">
                                <h1 className="text-3xl font-serif text-[var(--gold)] mb-6">Edit Personal Info</h1>
                                <form onSubmit={handleFormSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleFormChange}
                                                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleFormChange}
                                                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Phone</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleFormChange}
                                                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleFormChange}
                                                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleFormChange}
                                            className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleFormChange}
                                                className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white focus:border-[var(--gold)] focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-[var(--gold)] text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors shadow-lg shadow-[var(--gold)]/20"
                                    >
                                        Save Changes
                                    </button>
                                </form>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
