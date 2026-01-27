
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { supabase } from '../lib/supabase';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                    amount: 2000,
                    currency: 'usd',
                    userId: session.user.id
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

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Simple, Transparent Pricing
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                    Get full access to all e-sign features with our pro plan.
                </p>
            </div>

            {!clientSecret ? (
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                    <div className="px-6 py-8">
                        <h3 className="text-center text-2xl font-bold text-gray-900">Pro Plan</h3>
                        <p className="text-center mt-2 text-gray-500">Unlimited documents & signatures</p>
                        <div className="mt-6 flex justify-center items-baseline">
                            <span className="text-5xl font-extrabold text-gray-900">$20</span>
                            <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
                        </div>
                        <ul className="mt-6 space-y-4">
                            <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-3 text-base text-gray-700">Unlimited Documents</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-3 text-base text-gray-700">Audit Trails</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-3 text-base text-gray-700">Priority Support</span>
                            </li>
                        </ul>
                        <button
                            onClick={createPaymentIntent}
                            disabled={loading}
                            className="mt-8 w-full bg-blue-600 border border-transparent rounded-md py-3 px-5 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "Loading..." : "Get Started"}
                        </button>
                        {error && (
                            <div className="mt-4 text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Complete your payment</h3>
                    <Elements options={options} stripe={stripePromise}>
                        <CheckoutForm />
                    </Elements>
                    <button
                        onClick={() => setClientSecret(null)}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Back to plans
                    </button>
                </div>
            )}
        </div>
    );
}
