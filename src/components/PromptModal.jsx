import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Pencil size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                                {message && <p className="text-sm text-gray-500">{message}</p>}
                            </div>
                        </div>

                        <div className="py-2">
                            <Input
                                autoFocus
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="p-6 pt-0 bg-gray-50/50 flex justify-end gap-3 rounded-b-xl border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                        >
                            Confirm
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromptModal;
