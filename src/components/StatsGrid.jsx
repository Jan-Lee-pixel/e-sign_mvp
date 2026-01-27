import React from 'react';

const StatsGrid = ({ total, pending, signed }) => {
    const stats = [
        { label: 'Total Documents', value: total, change: '+12% from last month', isPositive: true },
        { label: 'Pending Signature', value: pending, change: '3 waiting for action', isPositive: false }, // Logic for change text can be dynamic later
        { label: 'Completed', value: signed, change: '+5 this week', isPositive: true },
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-10">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-[var(--template-shadow-sm)] border border-[var(--template-border)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[var(--template-shadow-md)] transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--template-primary)] to-[var(--template-primary-light)] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                    <div className="text-sm text-[var(--template-text-light)] uppercase tracking-wider font-semibold mb-2">{stat.label}</div>
                    <div className="font-['Crimson_Pro'] text-4xl font-semibold text-[var(--template-primary)] mb-2">{stat.value}</div>
                    <div className="text-sm flex items-center gap-1 text-[var(--template-success)]">
                        {stat.isPositive ? '↑' : '•'} {stat.change}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;
