import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PaymentHistoryTable from '../components/PaymentHistoryTable';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import { useNavigate } from 'react-router-dom';

export default function PaymentHistoryPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/login');
            return;
        }

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (data) setPayments(data);
        if (error) console.error("Error fetching payments:", error);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)] py-12 px-4 sm:px-6 lg:px-8">
            <PaymentDetailsModal
                payment={selectedPayment}
                onClose={() => setSelectedPayment(null)}
            />

            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mb-6 text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] underline underline-offset-4 cursor-pointer transition-colors flex items-center gap-2"
                        >
                            <span>←</span> Back to Dashboard
                        </button>
                        <h2 className="font-['Crimson_Pro'] text-3xl font-semibold text-[var(--template-primary)]">
                            Payment History
                        </h2>
                        <p className="text-[var(--template-text-secondary)] mt-2">
                            View all your past transactions and subscription payments.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-[var(--template-shadow-lg)] overflow-hidden border border-[var(--template-border)] p-8 animate-[fadeIn_0.5s_ease-out]">
                    {loading ? (
                        <div className="text-center py-8">Loading history...</div>
                    ) : (
                        <PaymentHistoryTable
                            payments={payments}
                            onSelectPayment={setSelectedPayment}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
