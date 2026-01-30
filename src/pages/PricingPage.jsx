import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { supabase } from '../lib/supabase';
import PaymentHistoryTable from '../components/PaymentHistoryTable';
import PaymentDetailsModal from '../components/PaymentDetailsModal';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPro, setIsPro] = useState(false);
    const [payments, setPayments] = useState([]);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);

    useEffect(() => {
        checkStatus();
        fetchPayments();
    }, []);

    const checkStatus = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from('profiles')
                .select('subscription_status')
                .eq('id', session.user.id)
                .maybeSingle();

            if (data?.subscription_status === 'pro') {
                setIsPro(true);
            }
        }
        setCheckingStatus(false);
    };

    const fetchPayments = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (data) setPayments(data);
    };

    const createPaymentIntent = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("You must be logged in to subscribe.");
            }

            const response = await fetch('http://localhost:4242/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    email: session.user.email
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to initialize payment.");
            }

            const data = await response.json();

            if (data && data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                throw new Error("Invalid response from payment server.");
            }

        } catch (err) {
            console.error("Error creating payment intent:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const appearance = {
        theme: 'stripe',
    };
    const options = {
        clientSecret,
        appearance,
    };

    if (checkingStatus) {
        return <div className="min-h-screen bg-[var(--template-bg-main)] flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">

            <PaymentDetailsModal
                payment={selectedPayment}
                onClose={() => setSelectedPayment(null)}
            />

            <div className="max-w-3xl mx-auto text-center mb-12 animate-[fadeIn_0.8s_ease-out]">
                <h2 className="font-['Crimson_Pro'] text-5xl font-semibold text-[var(--template-primary)] mb-4">
                    {isPro ? "Your Subscription" : "Simple, Transparent Pricing"}
                </h2>
                <p className="text-xl text-[var(--template-text-secondary)]">
                    {isPro ? "Manage your plan and view payment history." : "Get full access to all e-sign features with our pro plan."}
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="mt-8 text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] underline underline-offset-4 cursor-pointer transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {isPro ? (
                // PRO VIEW: Show Status + History
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-[var(--template-shadow-lg)] overflow-hidden border border-[var(--template-border)] animate-[scaleIn_0.5s_ease-out] p-8">
                    <div className="text-center mb-12">
                        <div className="inline-block bg-gradient-to-r from-[var(--template-warning)] to-[#D69520] text-white text-sm font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
                            CURRENT PLAN: PRO
                        </div>
                        <p className="text-[var(--template-text-secondary)] mb-8">
                            You have access to all premium features including unlimited documents and audit trails.
                        </p>
                        <button
                            onClick={() => window.location.href = '/subscription'}
                            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 rounded-xl py-3 px-6 font-semibold transition-all shadow-sm"
                        >
                            Manage / Cancel Subscription
                        </button>
                    </div>

                    <div className="mt-12 border-t border-[var(--template-border)] pt-8">
                        <h4 className="text-xl font-['Crimson_Pro'] font-semibold text-[var(--template-text-primary)] mb-6">Payment History</h4>
                        <PaymentHistoryTable
                            payments={payments}
                            onSelectPayment={setSelectedPayment}
                        />
                    </div>
                </div>
            ) : (
                // FREE VIEW: Show Pricing Card
                !clientSecret ? (
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-[var(--template-shadow-lg)] overflow-hidden border border-[var(--template-border)] animate-[scaleIn_0.5s_ease-out]">
                        <div className="px-8 py-10">
                            <h3 className="text-center text-3xl font-['Crimson_Pro'] font-semibold text-[var(--template-text-primary)]">Pro Plan</h3>
                            <p className="text-center mt-2 text-[var(--template-text-light)]">Unlimited documents & signatures</p>

                            <div className="mt-8 flex justify-center items-baseline text-[var(--template-primary)]">
                                <span className="text-6xl font-['Crimson_Pro'] font-bold">$20</span>
                                <span className="ml-2 text-xl font-medium text-[var(--template-text-secondary)]">/mo</span>
                            </div>

                            <ul className="mt-8 space-y-4">
                                {[
                                    "Unlimited Documents",
                                    "Audit Trails",
                                    "Priority Support",
                                    "Custom Branding",
                                    "Team Management"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-[var(--template-success)]/10 flex items-center justify-center mr-3 shrink-0">
                                            <svg className="h-4 w-4 text-[var(--template-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-[var(--template-text-primary)] font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={createPaymentIntent}
                                disabled={loading}
                                className="mt-10 w-full bg-gradient-to-r from-[var(--template-primary)] to-[var(--template-primary-light)] text-white rounded-xl py-4 px-6 text-lg font-semibold shadow-[var(--template-shadow-md)] hover:shadow-[var(--template-shadow-lg)] hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                                        Processing...
                                    </span>
                                ) : "Get Started Now"}
                            </button>

                            {error && (
                                <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-[var(--template-shadow-lg)] overflow-hidden border border-[var(--template-border)] p-8 animate-[scaleIn_0.3s_ease]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-['Crimson_Pro'] font-semibold text-[var(--template-primary)]">Complete Payment</h3>
                            <button
                                onClick={() => setClientSecret(null)}
                                className="text-sm text-[var(--template-text-light)] hover:text-[var(--template-text-primary)] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        <Elements options={options} stripe={stripePromise}>
                            <CheckoutForm />
                        </Elements>
                    </div>
                )
            )}
        </div>
    );
}
