import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Mail size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Send for Signature</h3>
                                <p className="text-sm text-gray-500">Email this document to a recipient.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Recipient Email <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="recipient@example.com"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Message (Optional)
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Please sign this document..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 pt-0 flex justify-end gap-3 bg-gray-50/50 rounded-b-xl border-t border-gray-100 py-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSending}
                            disabled={!email}
                        >
                            Send Email
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailModal;
