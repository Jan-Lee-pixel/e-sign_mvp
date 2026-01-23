import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] win7-modal-overlay">
            <div className="win7-window-container w-full max-w-md bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="win7-window-title flex justify-between items-center">
                    <span>{title}</span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="p-6 flex gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 rounded text-white shadow transition-colors font-medium text-sm flex items-center gap-2 ${type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 border border-yellow-700' : 'bg-blue-600 hover:bg-blue-700 border border-blue-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
