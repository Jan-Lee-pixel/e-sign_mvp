import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false); // Assume false initially, though only Pros can reach here ideally
    const [error, setError] = useState(null);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/login');
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', session.user.id)
            .maybeSingle();

        if (data?.subscription_status === 'pro') {
            setIsPro(true);
        } else {
            // If they aren't pro, they shouldn't really be here, but we can show upgrade option
            // or redirect. For now, let's just let them see they aren't pro.
            setIsPro(false);
        }
    };

    const confirmCancel = async () => {
        setLoading(true);
        setError(null);
        setShowCancelModal(false);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:4242/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: session.user.id
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to cancel subscription.");
            }

            // Show success modal instead of auto-redirecting
            setShowSuccessModal(true);
        } catch (err) {
            console.error("Error cancelling subscription:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate('/dashboard');
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative">
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-[var(--template-border)] animate-[scaleIn_0.2s_ease-out]">
                        <h4 className="text-xl font-['Crimson_Pro'] font-bold text-gray-900 mb-4">
                            Cancel Subscription?
                        </h4>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to cancel your Pro subscription? You will lose access to premium features immediately.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Keep Subscription
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-[var(--template-border)] animate-[scaleIn_0.2s_ease-out] text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-['Crimson_Pro'] font-bold text-gray-900 mb-2">
                            Subscription Cancelled
                        </h4>
                        <p className="text-gray-600 mb-6">
                            Your subscription has been successfully cancelled.
                        </p>
                        <button
                            onClick={handleSuccessClose}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--template-primary)] text-white font-semibold hover:bg-[var(--template-primary-dark)] transition-colors shadow-sm"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-[var(--template-shadow-lg)] overflow-hidden border border-[var(--template-border)] animate-[scaleIn_0.5s_ease-out]">
                <div className="px-8 py-10">
                    <h3 className="text-center text-3xl font-['Crimson_Pro'] font-semibold text-[var(--template-text-primary)] mb-6">Subscription Management</h3>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-8 text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] underline underline-offset-4 cursor-pointer transition-colors block mx-auto"
                    >
                        ← Back to Dashboard
                    </button>

                    {isPro ? (
                        <div className="text-center mb-12">
                            <div className="inline-block bg-gradient-to-r from-[var(--template-warning)] to-[#D69520] text-white text-sm font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
                                CURRENT PLAN: PRO
                            </div>
                            <p className="text-[var(--template-text-secondary)] mb-8">
                                You have access to all premium features including unlimited documents and audit trails.
                            </p>

                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={loading}
                                className="w-full max-w-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 rounded-xl py-3 px-6 font-semibold transition-all shadow-sm"
                            >
                                {loading ? "Processing..." : "Cancel Subscription"}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center mb-12">
                            <p className="text-[var(--template-text-secondary)] mb-8">
                                You are currently on the Free plan.
                            </p>
                            <button
                                onClick={() => navigate('/pricing')}
                                className="w-full max-w-sm bg-[var(--template-primary)] text-white rounded-xl py-3 px-6 font-semibold shadow-md hover:bg-[var(--template-primary-dark)] transition-all"
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Payment History Link */}
                    <div className="mt-12 border-t border-[var(--template-border)] pt-8 text-center">
                        <button
                            onClick={() => navigate('/history')}
                            className="text-[var(--template-primary)] font-semibold hover:text-[var(--template-primary-dark)] underline underline-offset-4 transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <span>💳</span> View Payment History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
