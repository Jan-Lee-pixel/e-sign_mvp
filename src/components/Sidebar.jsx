import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ activeTab, onTabChange }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'all', label: 'All Documents', icon: '📄' },
        { id: 'pending', label: 'Pending Signature', icon: '✍️' },
        { id: 'signed', label: 'Completed', icon: '✓' },
    ];

    const toolItems = [
        { id: 'self-sign', label: 'Self Sign', icon: '✒️', path: '/self-sign' },
        { id: 'ai-assistant', label: 'AI Assistant', icon: '✨', path: '/tools/ai-assistant' },
    ];

    const handleClick = (item) => {
        if (item.path) {
            navigate(item.path);
        } else {
            onTabChange(item.id);
        }
    };

    return (
        <aside className="bg-white/60 backdrop-blur-md rounded-2xl p-8 h-fit shadow-[var(--template-shadow-sm)] border border-[var(--template-border)] animate-[slideRight_0.6s_ease-out_0.3s_backwards] hidden lg:block sticky top-28">
            <div className="mb-8">
                <h3 className="text-xs uppercase tracking-widest text-[var(--template-text-light)] mb-4 font-semibold font-['Crimson_Pro']">Navigation</h3>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id || (item.path && location.pathname === item.path);
                    return (
                        <div
                            key={item.id}
                            onClick={() => handleClick(item)}
                            className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-all duration-300 font-medium ${isActive
                                ? 'bg-[var(--template-primary)] text-white shadow-[var(--template-shadow-sm)]'
                                : 'text-[var(--template-text-secondary)] hover:bg-[var(--template-bg-secondary)] hover:text-[var(--template-primary)]'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mb-0">
                <h3 className="text-xs uppercase tracking-widest text-[var(--template-text-light)] mb-4 font-semibold font-['Crimson_Pro']">Tools</h3>
                {toolItems.map((item) => {
                    const isActive = activeTab === item.id || (item.path && location.pathname === item.path);
                    return (
                        <div
                            key={item.id}
                            onClick={() => handleClick(item)}
                            className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-all duration-300 font-medium ${isActive
                                ? 'bg-[var(--template-primary)] text-white shadow-[var(--template-shadow-sm)]'
                                : 'text-[var(--template-text-secondary)] hover:bg-[var(--template-bg-secondary)] hover:text-[var(--template-primary)]'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    );
                })}

                {/* My Signatures - Special Styling */}
                <div
                    onClick={() => handleClick({ id: 'my-signatures', label: 'My Signatures', icon: '✒️', path: '/my-signatures' })}
                    className={`flex items-center gap-3 p-3 rounded-xl mt-6 cursor-pointer transition-all duration-300 font-medium ${location.pathname === '/my-signatures'
                        ? 'bg-[#008f33] text-white shadow-[0_4px_14px_0_rgba(0,166,81,0.39)]' // Custom green from template
                        : 'text-[var(--template-text-secondary)] hover:bg-[#e6f4ea] hover:text-[#008f33]'
                        }`}
                >
                    <span className="text-xl">✒️</span>
                    <span>My Signatures</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
