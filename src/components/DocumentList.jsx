import React from 'react';
import { Download, Pencil, Trash2 } from 'lucide-react';

const DocumentList = ({ envelopes, loading, onRowClick, onDownload, onRename }) => {
    return (
        <div className="bg-white rounded-2xl p-8 shadow-[var(--template-shadow-sm)] border border-[var(--template-border)]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-[var(--template-bg-secondary)]">
                <h2 className="font-['Calistoga'] text-3xl font-bold tracking-wide">Recent Documents</h2>
                <div className="flex gap-2">
                    {/* Filter tabs could go here, or handled by parent */}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--template-primary)]"></div>
                    </div>
                ) : envelopes.length === 0 ? (
                    <div className="text-center py-10 text-[var(--template-text-light)]">
                        No documents found.
                    </div>
                ) : (
                    envelopes.map((env) => (
                        <div
                            key={env.id}
                            onClick={() => onRowClick && onRowClick(env)}
                            className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 items-center p-6 rounded-xl transition-all duration-300 cursor-pointer border border-transparent hover:bg-[var(--template-bg-secondary)] hover:border-[var(--template-border)] hover:translate-x-1 max-md:grid-cols-1 max-md:gap-4"
                        >
                            <div className="w-[50px] h-[50px] bg-gradient-to-br from-[var(--template-primary-light)] to-[var(--template-primary)] rounded-xl flex items-center justify-center text-white text-2xl shadow-[var(--template-shadow-sm)]">
                                📄
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-base text-[var(--template-text-primary)]">{env.name || `Envelope #${env.id.slice(0, 8)}`}</span>
                                <span className="text-sm text-[var(--template-text-light)]">ID: {env.id.slice(0, 8)}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-[20px] text-xs font-bold uppercase tracking-wider
                                ${['signed', 'completed'].includes(env.status)
                                    ? 'bg-[#E8F5E9] text-[#4A8F4D]'
                                    : 'bg-[#FFF4E6] text-[#E8A838]'
                                }`}>
                                {env.status}
                            </div>
                            <div className="text-[var(--template-text-light)] text-sm">
                                {new Date(env.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {['signed', 'completed'].includes(env.status) && (
                                    <button
                                        onClick={() => onDownload(env.signed_pdf_url || env.pdf_url, env.original_pdf_url)}
                                        className="w-9 h-9 border border-[var(--template-border)] bg-white rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 text-[var(--template-text-secondary)] hover:bg-[var(--template-primary)] hover:text-white hover:border-[var(--template-primary)] hover:scale-110"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => onRename(env)}
                                    className="w-9 h-9 border border-[var(--template-border)] bg-white rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 text-[var(--template-text-secondary)] hover:bg-[var(--template-primary)] hover:text-white hover:border-[var(--template-primary)] hover:scale-110"
                                    title="Rename"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DocumentList;
