import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, title = "Confirm", message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                            <HelpCircle size={24} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 leading-none">{title}</h3>
                            <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed mx-auto">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-0 flex gap-3">
                    <Button variant="secondary" onClick={onCancel} className="w-full">
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} className="w-full">
                        Confirm
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
