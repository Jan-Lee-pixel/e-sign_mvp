import React from 'react';

const PaymentHistoryTable = ({ payments }) => {
    if (payments.length === 0) {
        return <p className="text-[var(--template-text-light)] text-center italic">No payment history found.</p>;
    }

    return (
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
    );
};

export default PaymentHistoryTable;
