import React from 'react';

const PaymentDetailsModal = ({ payment, onClose }) => {
    if (!payment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-[var(--template-border)] animate-[scaleIn_0.2s_ease-out] relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h4 className="text-2xl font-['Crimson_Pro'] font-bold text-[var(--template-primary)] mb-6 border-b pb-4">
                    Payment Details
                </h4>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-[var(--template-text-light)] font-semibold">Amount</label>
                        <p className="text-2xl font-medium text-[var(--template-text-primary)]">
                            {(payment.amount / 100).toLocaleString('en-US', {
                                style: 'currency',
                                currency: payment.currency.toUpperCase()
                            })}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase tracking-wider text-[var(--template-text-light)] font-semibold">Date</label>
                            <p className="text-[var(--template-text-secondary)]">
                                {new Date(payment.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-xs text-[var(--template-text-light)]">
                                {new Date(payment.created_at).toLocaleTimeString()}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wider text-[var(--template-text-light)] font-semibold">Status</label>
                            <div className="mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${payment.status === 'succeeded'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {payment.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-[var(--template-text-light)] font-semibold">Transaction ID</label>
                        <p className="text-sm font-mono text-[var(--template-text-secondary)] bg-gray-50 p-2 rounded border border-gray-100 break-all">
                            {payment.stripe_payment_id || payment.id}
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--template-border)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsModal;
