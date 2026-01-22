import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            let error;
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                error = signUpError;
                if (!error) {
                    setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
                }
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                error = signInError;
            }

            if (error) throw error;

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#ededed] flex items-center justify-center p-4">
            <div className="aero-glass rounded-lg p-8 w-full max-w-md fade-in">
                {/* Title */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>
                    <p className="text-sm text-[#5a5a5a]">
                        E-Sign Application
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-[#1a1a1a] mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="win7-input w-full px-3 py-2 rounded"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-[#1a1a1a] mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="win7-input w-full px-3 py-2 rounded"
                        />
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`p-3 rounded text-sm ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="win7-button-primary w-full py-2 px-4 rounded font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                {/* Toggle */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                    <p className="text-center text-sm text-[#5a5a5a]">
                        {isSignUp ? 'Have an account?' : 'Need an account?'}
                        {' '}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setMessage(null);
                            }}
                            className="text-[#4591d6] font-semibold hover:underline"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
