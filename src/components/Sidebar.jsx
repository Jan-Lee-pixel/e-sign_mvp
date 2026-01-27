import React from 'react';

const Sidebar = ({ activeTab, onTabChange }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'all', label: 'All Documents', icon: '📄' },
        { id: 'pending', label: 'Pending Signature', icon: '✍️' },
        { id: 'signed', label: 'Completed', icon: '✓' },
    ];

    return (
        <aside className="bg-white rounded-2xl p-8 h-fit shadow-[var(--template-shadow-sm)] border border-[var(--template-border)] animate-[slideRight_0.6s_ease-out_0.3s_backwards] hidden lg:block">
            <div className="mb-8">
                <h3 className="text-xs uppercase tracking-widest text-[var(--template-text-light)] mb-4 font-semibold">Navigation</h3>
                {navItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 font-medium ${activeTab === item.id
                            ? 'bg-gradient-to-br from-[var(--template-primary)] to-[var(--template-primary-light)] text-white shadow-[var(--template-shadow-sm)]'
                            : 'text-[var(--template-text-secondary)] hover:bg-[var(--template-bg-secondary)] hover:text-[var(--template-primary)]'
                            }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="mb-0">
                <h3 className="text-xs uppercase tracking-widest text-[var(--template-text-light)] mb-4 font-semibold">Tools</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 font-medium text-[var(--template-text-secondary)] hover:bg-[var(--template-bg-secondary)] hover:text-[var(--template-primary)]">
                    <span className="text-xl">⚙️</span>
                    <span>Settings</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 font-medium text-[var(--template-text-secondary)] hover:bg-[var(--template-bg-secondary)] hover:text-[var(--template-primary)]">
                    <span className="text-xl">👥</span>
                    <span>Team</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
