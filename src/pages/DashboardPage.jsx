import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, PenTool, LayoutDashboard, LogOut, Download, Plus, MoreVertical, Edit, Pencil } from 'lucide-react';

const DashboardPage = ({ session }) => {
    const navigate = useNavigate();
    const [envelopes, setEnvelopes] = useState([]);
    const [loading, setLoading] = useState(true);

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
            alert("No document path available.");
            return;
        }

        if (!path && originalPath) {
            // Optional: Confirm if they want the original since signed is missing
            // For now, just download it but maybe warn? 
            // Better behavior: Just download what we have, maybe log it.
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
            alert(`Failed to download PDF. ${error.message || ''}`);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#ededed] font-segoe">
            {/* Header */}
            <header className="h-16 bg-[#1853db] text-white flex items-center justify-between px-6 shadow-md z-50 shrink-0 win7-aero-glass">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2 text-white text-shadow-sm">
                            <PenTool className="w-6 h-6" />
                            <span>E-Sign Dashboard</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm opacity-80">Welcome, {session?.user?.email}</span>
                    <button
                        onClick={handleSignOut}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 text-sm flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden p-8">
                <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">

                    {/* Action Bar */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-light text-gray-600 flex items-center gap-2">
                            <LayoutDashboard size={24} />
                            Your Documents
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/self-sign')}
                                className="win7-button px-6 py-2 rounded font-semibold flex items-center gap-2 shadow-sm"
                            >
                                <PenTool size={18} />
                                Self Sign
                            </button>
                            <button
                                onClick={() => navigate('/compose')}
                                className="win7-button-primary px-6 py-2 rounded font-semibold flex items-center gap-2 shadow-lg"
                            >
                                <Plus size={18} />
                                New Envelope
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="win7-window-container bg-white flex-1 overflow-hidden flex flex-col shadow-xl">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-5">Document / ID</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-3">Date Sent</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="overflow-y-auto flex-1 p-2">
                            {loading ? (
                                <div className="flex justify-center items-center h-full text-gray-400">Loading...</div>
                            ) : envelopes.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-2">
                                    <FileText size={48} className="opacity-20" />
                                    <p>No documents found.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {envelopes.map(env => (
                                        <div
                                            key={env.id}
                                            onClick={() => handleRowClick(env)}
                                            className={`grid grid-cols-12 gap-4 p-4 rounded transition-colors items-center border border-transparent group cursor-pointer ${env.status === 'signed' ? 'hover:bg-green-50/50 hover:border-green-100' : 'hover:bg-blue-50/50 hover:border-blue-100'
                                                }`}
                                        >
                                            <div className="col-span-5 flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded flex items-center justify-center ${env.status === 'signed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-gray-800 truncate" title={env.name || env.id}>
                                                        {env.name || `Envelope #${env.id.slice(0, 8)}`}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate" title={env.id}>
                                                        Ref: {env.id.slice(0, 8)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-3">
                                                {['signed', 'completed'].includes(env.status) ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        <CheckCircle size={12} />
                                                        Signed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                                                        <Clock size={12} />
                                                        Pending
                                                    </span>
                                                )}
                                            </div>

                                            <div className="col-span-3 text-sm text-gray-600">
                                                {new Date(env.created_at).toLocaleDateString()}
                                                <span className="text-xs text-gray-400 ml-2">{new Date(env.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            <div className="col-span-1 flex justify-end gap-2 relative" onClick={e => e.stopPropagation()}>
                                                {/* Actions Menu */}
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {['signed', 'completed'].includes(env.status) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadSignedPdf(env.signed_pdf_url || env.pdf_url, env.original_pdf_url);
                                                            }}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Download"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newName = prompt("Rename document:", env.name || "");
                                                            if (newName && newName !== env.name) {
                                                                // Simple inline rename for MVP
                                                                supabase.from('envelopes').update({ name: newName }).eq('id', env.id).then(() => fetchEnvelopes());
                                                            }
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                                                        title="Rename"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>


                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
