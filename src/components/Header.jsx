import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ userEmail, onSignOut, isPro, onGetStarted }) => {
    const navigate = useNavigate();

    return (
        <header className="bg-[rgba(253,252,248,0.95)] backdrop-blur-2xl border-b border-[var(--template-border)] sticky top-0 z-[1000] animate-[slideDown_0.6s_ease-out]">
            <nav className="max-w-[1400px] mx-auto py-6 px-8 flex justify-between items-center">
                <div className="font-['Crimson_Pro'] text-3xl font-semibold text-[var(--template-primary)] flex items-center gap-3">
                    <img src="/esign-icon.png" alt="E-Sign Logo" className="w-10 h-10 animate-[float_3s_ease-in-out_infinite]" />
                    E-Sign
                </div>
                <div className="flex gap-8 items-center max-md:hidden">
                    {isPro ? (
                        <button
                            onClick={() => navigate('/subscription')}
                            className="bg-gradient-to-r from-[var(--template-warning)] to-[#D69520] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-[var(--template-shadow-sm)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                        >
                            PRO
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/pricing')}
                            className="text-[var(--template-primary)] border border-[var(--template-primary)] px-4 py-2 rounded-lg font-semibold hover:bg-[var(--template-primary)] hover:text-white transition-all text-sm"
                        >
                            Upgrade
                        </button>
                    )}
                    <div className="text-[var(--template-text-secondary)] font-medium">{userEmail}</div>

                    <button
                        onClick={onSignOut}
                        className="text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] font-medium transition-colors cursor-pointer"
                    >
                        Sign Out
                    </button>
                    {onGetStarted && (
                        <button
                            onClick={onGetStarted}
                            className="bg-[var(--template-primary)] text-white px-7 py-3 rounded-lg font-semibold shadow-[var(--template-shadow-sm)] hover:bg-[var(--template-primary-dark)] hover:-translate-y-0.5 hover:shadow-[var(--template-shadow-md)] transition-all"
                        >
                            Get Started
                        </button>
                    )}
                </div>
                {/* Mobile menu placeholder */}
                <div className="hidden max-md:block">
                    <button className="text-2xl">☰</button>
                </div>
            </nav>
        </header>
    );
};

export default Header;
