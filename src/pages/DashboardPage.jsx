import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import PromptModal from '../components/PromptModal';
import AlertModal from '../components/AlertModal';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatsGrid from '../components/StatsGrid';
import DocumentList from '../components/DocumentList';
import TutorialModal from '../components/TutorialModal';

const DashboardPage = ({ session }) => {
    const navigate = useNavigate();
    const [envelopes, setEnvelopes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    // Modals
    const [promptModal, setPromptModal] = useState({ isOpen: false, title: "", message: "", defaultValue: "", onConfirm: () => { } });
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "error" });

    useEffect(() => {
        if (!session) return;

        fetchProfile();

        // Check for payment success in URL
        const query = new URLSearchParams(window.location.search);
        const paymentSuccess = query.get('payment_success');
        const paymentIntent = query.get('payment_intent');

        if (paymentSuccess && paymentIntent) {
            verifyPayment(paymentIntent);
        }

        fetchEnvelopes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('subscription_status')
                .eq('id', session.user.id)
                .single();

            if (data && data.subscription_status === 'pro') {
                setIsPro(true);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    };

    const verifyPayment = async (paymentIntentId) => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:4242/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentIntentId }),
            });
            const data = await response.json();

            if (data.success) {
                setAlertModal({ isOpen: true, title: "Success!", message: "Your subscription has been activated.", type: "success" });
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error("Payment verification failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEnvelopes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('envelopes')
                .select('*')
                .eq('sender_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEnvelopes(data);
        } catch (error) {
            console.error("Error fetching envelopes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (envelope) => {
        if (envelope.status === 'pending') {
            navigate('/compose', { state: { envelope } });
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const downloadSignedPdf = async (path, originalPath) => {
        const targetPath = path || originalPath;
        if (!targetPath) {
            setAlertModal({ isOpen: true, title: "Download Error", message: "No document path available.", type: "error" });
            return;
        }

        if (!path && originalPath) {
            console.warn("Signed path missing, falling back to original.");
        }

        try {
            const { data, error } = await supabase.storage
                .from('envelopes')
                .download(targetPath);

            if (error) {
                console.error("Supabase download error:", error);
                throw error;
            }

            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = targetPath.split('/').pop() || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            setAlertModal({ isOpen: true, title: "Download Failed", message: error.message || "Failed to download PDF.", type: "error" });
        }
    };

    const handleRenameClick = (env) => {
        setPromptModal({
            isOpen: true,
            title: "Rename Document",
            message: "Enter new name:",
            defaultValue: env.name || "",
            onConfirm: (newName) => {
                if (newName && newName !== env.name) {
                    supabase.from('envelopes')
                        .update({ name: newName })
                        .eq('id', env.id)
                        .then(() => {
                            fetchEnvelopes();
                            setPromptModal(prev => ({ ...prev, isOpen: false }));
                        });
                } else {
                    setPromptModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const [activeTab, setActiveTab] = useState('all');

    const filteredEnvelopes = envelopes.filter(env => {
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return env.status === 'pending';
        if (activeTab === 'signed') return ['signed', 'completed'].includes(env.status);
        return true; // dashboard shows all for now, or could limit
    });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
        total: envelopes.length,
        pending: envelopes.filter(e => e.status === 'pending').length,
        signed: envelopes.filter(e => ['signed', 'completed'].includes(e.status)).length,
        recent: envelopes.filter(e => new Date(e.created_at) > oneWeekAgo).length
    };

    return (
        <div className="min-h-screen bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)] leading-relaxed overflow-x-hidden">
            <Header userEmail={session?.user?.email} onSignOut={handleSignOut} isPro={isPro} onGetStarted={() => setIsTutorialOpen(true)} />

            <div className="max-w-[1400px] mx-auto py-12 px-8 animate-[fadeIn_0.8s_ease-out_0.2s_backwards]">
                <div className="grid grid-cols-[280px_1fr] gap-8 mt-8 max-lg:grid-cols-1">
                    <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

                    <main className="animate-[slideLeft_0.6s_ease-out_0.4s_backwards]">
                        <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:items-start max-md:gap-4">
                            <div>
                                <h1 className="font-['Crimson_Pro'] text-4xl font-semibold text-[var(--template-text-primary)]">Dashboard</h1>
                            </div>
                            <button
                                onClick={() => navigate('/compose')}
                                className="bg-gradient-to-br from-[var(--template-accent)] to-[#D69520] text-white px-8 py-4 border-none rounded-xl font-semibold cursor-pointer text-base shadow-[var(--template-shadow-md)] transition-all flex items-center gap-2 hover:-translate-y-1 hover:shadow-[var(--template-shadow-lg)]"
                            >
                                <span className="text-xl">+</span> Upload Document
                            </button>
                        </div>

                        <StatsGrid stats={stats} />

                        <DocumentList
                            envelopes={filteredEnvelopes}
                            loading={loading}
                            onRowClick={handleRowClick}
                            onDownload={downloadSignedPdf}
                            onRename={handleRenameClick}
                        />
                    </main>
                </div>
            </div>

            <TutorialModal
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />

            <PromptModal
                isOpen={promptModal.isOpen}
                onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={promptModal.onConfirm}
                title={promptModal.title}
                message={promptModal.message}
                defaultValue={promptModal.defaultValue}
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div>
    );
};

export default DashboardPage;
