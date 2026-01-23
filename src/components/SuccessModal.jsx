import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, title = "Success", message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 win7-modal-overlay">
            <div className="win7-window-container w-full max-w-sm shadow-2xl relative bg-[#f0f0f0]">
                {/* Window Title Bar */}
                <div className="win7-window-title flex justify-between items-center">
                    <span>{title}</span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors focus:outline-none"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-green-600 shadow-inner">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1e395b] mb-1">{title}</h3>
                        <p className="text-sm text-gray-600">{message}</p>
                    </div>
                </div>

                {/* Footer / Buttons */}
                <div className="px-4 py-3 bg-[#f0f0f0] border-t border-[#d9d9d9] flex justify-center">
                    <button
                        onClick={onClose}
                        className="win7-button min-w-[80px] px-4 py-1.5 rounded text-sm font-inherit"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
