import React, { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';

const PromptModal = ({ isOpen, onClose, onConfirm, title = "Input", message, defaultValue = "", placeholder = "" }) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(value);
    };

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

                <form onSubmit={handleSubmit}>
                    {/* Content */}
                    <div className="p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <Pencil size={24} className="text-[#1853db] mt-1" />
                            <p className="text-sm text-gray-700 mt-1">{message}</p>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded shadow-inner focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
                        />
                    </div>

                    {/* Footer / Buttons */}
                    <div className="px-4 py-3 bg-[#f0f0f0] border-t border-[#d9d9d9] flex justify-end gap-2">
                        <button
                            type="submit"
                            className="win7-button min-w-[80px] px-4 py-1.5 rounded text-sm font-inherit"
                        >
                            OK
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="win7-button min-w-[80px] px-4 py-1.5 rounded text-sm font-inherit"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromptModal;
