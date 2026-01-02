import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import { authService, cartService, orderService, paymentService } from '../services';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaWallet, FaCheckCircle, FaMoneyBillWave } from 'react-icons/fa';

export default function Checkout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [cart, setCart] = useState(null);

    // Address State
    const [address, setAddress] = useState({
        fullName: '', mobile: '', city: '', street: ''
    });
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState('cod');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load Profile
            const profile = await authService.getProfile();
            if (profile.user && profile.user.deliveryAddress) {
                setAddress(profile.user.deliveryAddress);
                if (!profile.user.deliveryAddress.fullName) setIsEditingAddress(true);
            } else {
                setIsEditingAddress(true);
            }

            if (profile.user && profile.user.payment && profile.user.payment.defaultMethod !== 'none') {
                setPaymentMethod(profile.user.payment.defaultMethod);
            }

            // Load Cart
            const cartData = await cartService.getCart();
            setCart(cartData.cart);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load checkout data");
        }
    };

    const handleAddressChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const saveAddress = async () => {
        // Save to profile for future use
        try {
            await authService.updateAddress(address);
            setIsEditingAddress(false);
            toast.success("Delivery address saved");
        } catch (err) {
            toast.error("Failed to save address");
        }
    };

    const calculateTotal = () => {
        if (!cart?.items) return 0;
        return cart.items.reduce((acc, item) => acc + (item.productId?.price || 0) * item.quantity, 0);
    };

    const handlePlaceOrder = async () => {
        if (!address.fullName || !address.mobile || !address.city || !address.street) {
            toast.error("Please provide a complete delivery address.");
            return;
        }

        setLoading(true);
        try {
            // 1. Create Order
            const orderRes = await orderService.checkout({
                address,
                paymentMethod
            });

            if (orderRes.success && orderRes.order) {
                const order = orderRes.order;

                // 2. Handle Payment
                if (paymentMethod === 'cod') {
                    toast.success("Order placed successfully!");
                    navigate('/dashboard');
                } else {
                    const amount = calculateTotal();

                    try {
                        const initRes = await paymentService.initiatePayment(order._id, paymentMethod, amount);

                        if (initRes.success && initRes.paymentData) {
                            if (paymentMethod === 'esewa') {
                                // Handle eSewa Redirect
                                const { url, params } = initRes.paymentData;
                                const form = document.createElement("form");
                                form.setAttribute("method", "POST");
                                form.setAttribute("action", url);
                                form.setAttribute("target", "_self"); // or _blank

                                for (let key in params) {
                                    const hiddenField = document.createElement("input");
                                    hiddenField.setAttribute("type", "hidden");
                                    hiddenField.setAttribute("name", key);
                                    hiddenField.setAttribute("value", params[key]);
                                    form.appendChild(hiddenField);
                                }

                                document.body.appendChild(form);
                                form.submit();
                            } else if (paymentMethod === 'khalti') {
                                // Khalti Implementation
                                toast.info("Khalti redirection would happen here. (Using test setup)");
                                // In a real setup, we would use Khalti SDK or Redirect URL provided by initRes if backend calls Khalti Init API.
                                // Since our backend simulate/initiate just returns ID, we assume client-side handling.
                                // For now, let's treat it as "Initiated" and go to dashboard.
                                navigate('/dashboard');
                            }
                        } else {
                            toast.error("Failed to initiate payment");
                        }
                    } catch (payErr) {
                        console.error(payErr);
                        toast.error("Payment initiation failed");
                    }
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    if (!cart) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
            <Navbar />
            <div className="container mx-auto pt-28 px-4 pb-20">
                <h1 className="text-3xl font-serif text-[var(--gold)] mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Address & Payment */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Address Section */}
                        <div className="bg-zinc-900/50 p-6 rounded-xl border border-[var(--gold)]/10">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-serif flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-[var(--gold)]" /> Delivery Address
                                </h2>
                                {!isEditingAddress && (
                                    <button onClick={() => setIsEditingAddress(true)} className="text-sm text-[var(--gold)] hover:underline">
                                        Change
                                    </button>
                                )}
                            </div>

                            {isEditingAddress ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input name="fullName" placeholder="Full Name" value={address.fullName} onChange={handleAddressChange} className="bg-black/40 border border-[var(--gold)]/20 rounded px-4 py-3 text-white w-full" />
                                        <input name="mobile" placeholder="Phone Number" value={address.mobile} onChange={handleAddressChange} className="bg-black/40 border border-[var(--gold)]/20 rounded px-4 py-3 text-white w-full" />
                                    </div>
                                    <input name="street" placeholder="Street Address / Area" value={address.street} onChange={handleAddressChange} className="bg-black/40 border border-[var(--gold)]/20 rounded px-4 py-3 text-white w-full" />
                                    <input name="city" placeholder="City" value={address.city} onChange={handleAddressChange} className="bg-black/40 border border-[var(--gold)]/20 rounded px-4 py-3 text-white w-full" />
                                    <button onClick={saveAddress} className="px-4 py-2 bg-[var(--gold)] text-black font-bold rounded">
                                        Save & Use Address
                                    </button>
                                </div>
                            ) : (
                                <div className="text-gray-300">
                                    <p className="font-medium text-white">{address.fullName}</p>
                                    <p>{address.street}, {address.city}</p>
                                    <p>{address.mobile}</p>
                                </div>
                            )}
                        </div>

                        {/* Payment Section */}
                        <div className="bg-zinc-900/50 p-6 rounded-xl border border-[var(--gold)]/10">
                            <h2 className="text-xl font-serif flex items-center gap-2 mb-4">
                                <FaWallet className="text-[var(--gold)]" /> Payment Method
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'esewa' ? 'border-green-500 bg-green-500/10' : 'border-[var(--gold)]/20 hover:border-[var(--gold)]'}`}>
                                    <input type="radio" name="payment" value="esewa" checked={paymentMethod === 'esewa'} onChange={() => setPaymentMethod('esewa')} className="hidden" />
                                    <span className="font-bold text-green-400">eSewa</span>
                                    {paymentMethod === 'esewa' && <FaCheckCircle className="text-green-500" />}
                                </label>
                                <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'khalti' ? 'border-purple-500 bg-purple-500/10' : 'border-[var(--gold)]/20 hover:border-[var(--gold)]'}`}>
                                    <input type="radio" name="payment" value="khalti" checked={paymentMethod === 'khalti'} onChange={() => setPaymentMethod('khalti')} className="hidden" />
                                    <span className="font-bold text-purple-400">Khalti</span>
                                    {paymentMethod === 'khalti' && <FaCheckCircle className="text-purple-500" />}
                                </label>
                                <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--gold)]/20 hover:border-[var(--gold)]'}`}>
                                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                                    <span className="font-bold text-blue-400">Cash On Delivery</span>
                                    {paymentMethod === 'cod' && <FaCheckCircle className="text-blue-500" />}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-xl border border-[var(--gold)]/20 sticky top-32">
                            <h2 className="text-xl font-serif text-white mb-4">Order Summary</h2>
                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                                {cart.items.map((item) => (
                                    <div key={item.productId._id} className="flex justify-between items-start text-sm">
                                        <div>
                                            <p className="text-white font-medium">{item.productId.name}</p>
                                            <p className="text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-gray-300">Rs. {item.productId.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-white/10 my-4"></div>

                            <div className="flex justify-between text-lg font-bold text-[var(--gold)] mb-6">
                                <span>Total</span>
                                <span>Rs. {calculateTotal()}</span>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading || isEditingAddress}
                                className={`w-full py-4 rounded-lg font-bold uppercase tracking-wide transition-all ${loading || isEditingAddress ? 'bg-gray-600 cursor-not-allowed' : 'bg-[var(--gold)] text-black hover:scale-[1.02] shadow-[0_4px_15px_rgba(212,175,55,0.3)]'}`}
                            >
                                {loading ? 'Processing...' : 'Place Order'}
                            </button>
                            {isEditingAddress && <p className="text-xs text-red-400 mt-2 text-center">Please save address to continue</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
