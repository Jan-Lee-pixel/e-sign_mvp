import React, { useState } from 'react';
import { X, Copy, Check, Send, Link } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const ShareModal = ({ isOpen, onClose, link, onEmail }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                {/* Header */}
                <div className="bg-[var(--template-bg-secondary)] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Link size={18} className="text-[var(--template-primary)]" />
                        Document Ready
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-500 text-sm mb-4">
                        Your document has been prepared. Share this link with the recipient to collect signatures.
                    </p>

                    <div className="relative mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Share Link</label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={link}
                                className="bg-gray-50 text-gray-700 border-gray-200 focus:border-[var(--template-primary)] font-mono text-xs h-11"
                            />
                            <Button
                                onClick={handleCopy}
                                className={`shrink-0 h-11 w-11 p-0 flex items-center justify-center transition-all ${copied ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--template-primary)] hover:text-[var(--template-primary)]'}`}
                                title="Copy Link"
                                variant="outline"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </Button>
                        </div>
                        {copied && <span className="absolute -bottom-5 right-0 text-xs text-green-600 font-medium">Copied to clipboard!</span>}
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <Button
                            onClick={onEmail}
                            className="w-full bg-[var(--template-primary)] text-white hover:bg-[var(--template-primary-dark)] shadow-md py-6 rounded-xl text-base font-semibold"
                        >
                            <Send size={18} className="mr-2" />
                            Send via Email
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
