import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Type } from 'lucide-react';

const TextInputModal = ({ isOpen, onClose, onSave, label, initialValue }) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue || '');
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                <div className="bg-[var(--template-bg-secondary)] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Type size={18} className="text-[var(--template-primary)]" />
                        {label || 'Enter Text'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                            {label || 'Value'}
                        </label>
                        <Input
                            autoFocus
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full bg-white border-gray-200 focus:border-[var(--template-primary)] text-base py-3"
                            placeholder={`Enter ${label ? label.toLowerCase() : 'text'}...`}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button
                            onClick={() => onSave(value)}
                            className="bg-[var(--template-primary)] text-white hover:bg-[var(--template-primary-dark)]"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextInputModal;
