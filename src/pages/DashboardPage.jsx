import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, PenTool, LogOut, Download, Plus, Pencil, MoreVertical } from 'lucide-react';
import PromptModal from '../components/PromptModal';
import AlertModal from '../components/AlertModal';
import { Button } from '../components/ui/Button';

const DashboardPage = ({ session }) => {
    const navigate = useNavigate();
    const [envelopes, setEnvelopes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [promptModal, setPromptModal] = useState({ isOpen: false, title: "", message: "", defaultValue: "", onConfirm: () => { } });
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "error" });

    useEffect(() => {
        if (!session) return;
        fetchEnvelopes();
    }, [session]);

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

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Navbar */}
            <nav className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                                <PenTool size={20} />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-900">E-Sign</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 hidden sm:block">{session?.user?.email}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                                <LogOut size={16} className="mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                        <p className="text-gray-500 mt-1">Manage and track your signature requests.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/self-sign')}
                        >
                            <PenTool size={16} className="mr-2" />
                            Sign Yourself
                        </Button>
                        <Button
                            onClick={() => navigate('/compose')}
                            className="shadow-lg shadow-primary/20"
                        >
                            <Plus size={16} className="mr-2" />
                            New Envelope
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-12 sm:col-span-5">Document Name</div>
                        <div className="col-span-6 sm:col-span-3">Status</div>
                        <div className="col-span-6 sm:col-span-3">Date Sent</div>
                        <div className="col-span-12 sm:col-span-1 text-right hidden sm:block">Actions</div>
                    </div>

                    {/* List */}
                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="flex justify-center items-center py-20 text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : envelopes.length === 0 ? (
                            <div className="flex flex-col justify-center items-center py-20 text-gray-400 gap-3">
                                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <FileText size={32} className="opacity-20" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium text-gray-900">No documents yet</p>
                                    <p className="text-sm">Create your first envelope to get started.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/compose')}
                                    className="mt-2"
                                >
                                    Create Envelope
                                </Button>
                            </div>
                        ) : (
                            envelopes.map(env => (
                                <div
                                    key={env.id}
                                    onClick={() => handleRowClick(env)}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group"
                                >
                                    <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${env.status === 'signed' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                                            }`}>
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate" title={env.name}>
                                                {env.name || `Envelope #${env.id.slice(0, 8)}`}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate font-mono mt-0.5">
                                                ID: {env.id.slice(0, 8)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-6 sm:col-span-3 flex items-center">
                                        {['signed', 'completed'].includes(env.status) ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                <CheckCircle size={12} />
                                                Signed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                <Clock size={12} />
                                                Pending
                                            </span>
                                        )}
                                    </div>

                                    <div className="col-span-6 sm:col-span-3 text-sm text-gray-500">
                                        {new Date(env.created_at).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                        <div className="text-xs text-gray-400">
                                            {new Date(env.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <div className="col-span-12 sm:col-span-1 flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            {['signed', 'completed'].includes(env.status) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadSignedPdf(env.signed_pdf_url || env.pdf_url, env.original_pdf_url);
                                                    }}
                                                    title="Download"
                                                    className="h-8 w-8 text-gray-500 hover:text-primary"
                                                >
                                                    <Download size={16} />
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRenameClick(env);
                                                }}
                                                title="Rename"
                                                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                            >
                                                <Pencil size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

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
