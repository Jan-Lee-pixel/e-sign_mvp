import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';

const SuccessModal = ({ isOpen, onClose, title = "Success", message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600">
                            <CheckCircle size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 leading-none">{title}</h3>
                            <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed mx-auto">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-0">
                    <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 ring-green-600">
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
