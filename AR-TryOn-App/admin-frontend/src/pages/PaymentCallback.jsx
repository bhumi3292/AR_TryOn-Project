import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../services';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, failed

    useEffect(() => {
        const data = searchParams.get('data');
        if (data) {
            verifyEsewa(data);
        } else {
            // Check for Khalti callback params if any or generic failure
            setStatus('failed');
            // setTimeout(() => navigate('/dashboard'), 3000);
        }
    }, [searchParams]);

    const verifyEsewa = async (data) => {
        try {
            const res = await paymentService.verifyEsewa(data);
            if (res.success) {
                setStatus('success');
                toast.success("Payment Verified Successfully!");
                setTimeout(() => navigate('/dashboard'), 3000);
            } else {
                setStatus('failed');
                toast.error(res.message || "Payment verification failed");
            }
        } catch (err) {
            console.error(err);
            setStatus('failed');
            toast.error("Payment verification error");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center pt-20">
                <div className="bg-zinc-900/50 p-10 rounded-2xl border border-[var(--gold)]/20 text-center max-w-md w-full">
                    {status === 'verifying' && (
                        <>
                            <div className="w-16 h-16 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <h2 className="text-2xl font-serif text-[var(--gold)] mb-2">Verifying Payment</h2>
                            <p className="text-gray-400">Please wait while we confirm your transaction...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-6" />
                            <h2 className="text-2xl font-serif text-white mb-2">Payment Successful!</h2>
                            <p className="text-gray-400 mb-6">Your order has been placed and confirmed.</p>
                            <button onClick={() => navigate('/dashboard')} className="bg-[var(--gold)] text-black px-6 py-2 rounded-full font-bold hover:bg-[#e5c560] transition">
                                Go to Dashboard
                            </button>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-6" />
                            <h2 className="text-2xl font-serif text-white mb-2">Payment Failed</h2>
                            <p className="text-gray-400 mb-6">There was an issue processing your payment.</p>
                            <button onClick={() => navigate('/checkout')} className="bg-zinc-800 text-white px-6 py-2 rounded-full font-bold hover:bg-zinc-700 transition">
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
