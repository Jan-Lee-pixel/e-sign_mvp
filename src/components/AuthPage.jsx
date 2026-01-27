import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PenTool, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--template-bg-main)] px-4 font-['DM_Sans'] text-[var(--template-text-primary)] transition-colors duration-300">
            <div className="w-full max-w-md space-y-8 animate-[fadeIn_0.5s_ease-out]">
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-[var(--template-primary)]/10 flex items-center justify-center mb-6 animate-[float_3s_ease-in-out_infinite]">
                        <img src="/esign-icon.png" alt="E-Sign Logo" className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-[var(--template-text-primary)] font-['Crimson_Pro']">
                        {isSignUp ? 'Create an account' : 'Welcome back'}
                    </h2>
                    <p className="mt-3 text-sm text-[var(--template-text-secondary)]">
                        {isSignUp ? 'Enter your email below to create your account' : 'Enter your email to sign in to your account'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-[var(--template-shadow-lg)] border border-[var(--template-border)]">
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-[var(--template-text-primary)] block">
                                Email address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                className="bg-[var(--template-bg-main)] border-[var(--template-border)] focus:border-[var(--template-primary)] focus:ring-[var(--template-primary)] text-[var(--template-text-primary)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-[var(--template-text-primary)] block">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-[var(--template-bg-main)] border-[var(--template-border)] focus:border-[var(--template-primary)] focus:ring-[var(--template-primary)] text-[var(--template-text-primary)]"
                            />
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm border ${message.type === 'success'
                                ? 'bg-green-50/50 text-green-700 border-green-200'
                                : 'bg-red-50/50 text-red-700 border-red-200'
                                }`}>
                                {message.type === 'success' ? (
                                    <CheckCircle className="h-5 w-5 shrink-0" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                )}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-[var(--template-primary)] hover:bg-[var(--template-primary-dark)] text-white shadow-[var(--template-shadow-md)] hover:shadow-[var(--template-shadow-lg)] transition-all py-6 text-base"
                            size="lg"
                            isLoading={loading}
                        >
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-[var(--template-border)] text-center">
                        <p className="text-sm text-[var(--template-text-secondary)]">
                            {isSignUp ? 'Already have an account? ' : 'Don\'t have an account? '}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setMessage(null);
                                }}
                                className="font-semibold text-[var(--template-primary)] hover:text-[var(--template-primary-dark)] hover:underline transition-colors"
                            >
                                {isSignUp ? 'Sign in' : 'Sign up'}
                            </button>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-[var(--template-text-light)]">
                    By clicking continue, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};

export default AuthPage;

