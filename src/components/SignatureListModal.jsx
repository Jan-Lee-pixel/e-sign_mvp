import React from 'react';
import { X, Trash2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SignatureListModal = ({ isOpen, onClose, categoryName, signatures, onDelete, onUpdate }) => {
    if (!isOpen) return null;

    const handleDownload = (url, index) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `signature-${categoryName}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{categoryName} Signatures</h3>
                        <p className="text-xs text-gray-500">{signatures.length} signature{signatures.length !== 1 ? 's' : ''} found</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {signatures.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-400 italic">
                            No signatures in this category.
                        </div>
                    ) : (
                        signatures.map((sig, idx) => (
                            <div key={sig.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white group relative">
                                <div className="h-24 flex items-center justify-center mb-3 bg-gray-50/50 rounded-lg">
                                    <img src={sig.signature_url} alt="Signature" className="max-h-20 max-w-full object-contain" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{sig.first_name} {sig.last_name}</p>
                                        <p className="text-xs text-gray-400">{new Date(sig.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleDownload(sig.signature_url, idx)}
                                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download size={14} />
                                        </button>
                                        {/* Future: Add Edit Name button here */}
                                        <button
                                            onClick={() => onDelete(sig.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignatureListModal;
