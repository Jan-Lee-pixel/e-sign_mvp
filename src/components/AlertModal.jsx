import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title = "Alert", message, type = "error" }) => {
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
                <div className="p-6 flex items-start gap-4">
                    <div className="shrink-0">
                        {type === 'error' ? (
                            <AlertTriangle size={32} className="text-yellow-500" />
                        ) : (
                            <Info size={32} className="text-blue-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-700 mt-1.5">{message}</p>
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

export default AlertModal;
