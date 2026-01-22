import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';

const EmailModal = ({ isOpen, onClose, onSend, defaultMessage = '' }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(defaultMessage);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSending(true);
        await onSend(email, message);
        setIsSending(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 win7-modal-overlay">
            <div className="win7-window-container w-full max-w-md shadow-2xl relative bg-[#f0f0f0]">
                <div className="win7-window-title flex justify-between items-center">
                    <span>Send for Signature</span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Recipient Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="recipient@example.com"
                            className="win7-input w-full px-3 py-2 rounded text-sm"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Message (Optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="win7-input w-full px-3 py-2 rounded text-sm resize-none"
                            placeholder="Please sign this document..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="win7-button px-4 py-2 rounded text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSending || !email}
                            className="win7-button-primary px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSending ? 'Sending...' : (
                                <>
                                    <Mail size={16} />
                                    Send Email
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailModal;
