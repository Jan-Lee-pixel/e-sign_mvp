import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PenTool } from 'lucide-react';

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
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#ededed] relative overflow-hidden font-segoe">

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 h-16 bg-[#1853db] text-white flex items-center px-6 shadow-md z-50 win7-aero-glass">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold flex items-center gap-2 text-white text-shadow-sm">
                        <PenTool className="w-6 h-6" />
                        <span>E-Sign</span>
                    </h1>
                </div>
            </header>

            <div className="w-full max-w-md win7-window-container shadow-2xl relative z-20">
                <div className="win7-window-title flex justify-between items-center">
                    <span>{isSignUp ? 'Create User Account' : 'User Login - E-Sign'}</span>
                    <div className="flex gap-1">
                        <button className="w-5 h-5 bg-[#d7504b] hover:bg-[#ff6b6b] rounded-sm flex items-center justify-center text-white text-xs border border-white/30">×</button>
                    </div>
                </div>

                <div className="p-8 bg-[#f0f0f0]">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-blue-100/50 rounded-full flex items-center justify-center mb-3 border-2 border-blue-200 shadow-inner">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h2 className="text-xl font-semibold text-[#1e395b]">
                            {isSignUp ? 'Create an Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-sm text-[#5a5a5a] text-center mt-1">
                            {isSignUp ? 'Enter your details to get started.' : 'Please sign in to continue.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-[#1a1a1a] mb-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="win7-input w-full px-3 py-2 rounded focus:ring-1 focus:ring-blue-400"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-[#1a1a1a] mb-1">Password</label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="win7-input w-full px-3 py-2 rounded focus:ring-1 focus:ring-blue-400"
                                placeholder="••••••••"
                            />
                        </div>

                        {message && (
                            <div className={`p-3 rounded text-sm flex items-center gap-2 border ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="win7-button-primary w-full py-2.5 px-4 rounded font-semibold text-sm disabled:opacity-50 mt-2 shadow-md hover:shadow-lg transition-all"
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-[#d9d9d9] flex justify-center">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setMessage(null);
                            }}
                            className="text-[#1e395b] hover:text-[#4591d6] text-sm font-medium hover:underline transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                        </button>
                    </div>
                </div>

                {/* Footer Status Bar */}
                <div className="bg-[#f0f0f0] border-t border-[#d9d9d9] py-1 px-3 text-xs text-gray-500 flex justify-between">
                    <span>E-Sign v1.0</span>
                    <span>Secure Connection</span>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;

