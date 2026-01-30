import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false); // Assume false initially, though only Pros can reach here ideally
    const [error, setError] = useState(null);

    const [payments, setPayments] = useState([]);

    useEffect(() => {
        checkStatus();
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (data) setPayments(data);
        if (error) console.error("Error fetching payments:", error);
    };

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
            .single();

        if (data?.subscription_status === 'pro') {
            setIsPro(true);
        } else {
            // If they aren't pro, they shouldn't really be here, but we can show upgrade option
            // or redirect. For now, let's just let them see they aren't pro.
            setIsPro(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel your Pro subscription? You will lose access to premium features immediately.")) {
            return;
        }

        setLoading(true);
        setError(null);

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

            alert("Subscription cancelled successfully.");
            navigate('/dashboard');
            window.location.reload(); // Reload to refresh headers/state
        } catch (err) {
            console.error("Error cancelling subscription:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
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
                                onClick={handleCancel}
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

                    {/* Payment History Section */}
                    <div className="mt-12 border-t border-[var(--template-border)] pt-8">
                        <h4 className="text-xl font-['Crimson_Pro'] font-semibold text-[var(--template-text-primary)] mb-6">Payment History</h4>

                        {payments.length === 0 ? (
                            <p className="text-[var(--template-text-light)] text-center italic">No payment history found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[var(--template-border)]">
                                            <th className="pb-3 font-medium text-[var(--template-text-secondary)]">Date</th>
                                            <th className="pb-3 font-medium text-[var(--template-text-secondary)]">Amount</th>
                                            <th className="pb-3 font-medium text-[var(--template-text-secondary)]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="border-b last:border-0 border-[var(--template-border)] hover:bg-slate-50 transition-colors">
                                                <td className="py-4 text-[var(--template-text-primary)]">
                                                    {new Date(payment.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-4 font-medium text-[var(--template-text-primary)]">
                                                    {(payment.amount / 100).toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: payment.currency.toUpperCase()
                                                    })}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${payment.status === 'succeeded'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {payment.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
