import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X } from 'lucide-react';

const SignaturePad = ({ onSave, onCancel }) => {
    const sigCanvas = useRef({});

    const clear = () => sigCanvas.current.clear();

    const save = () => {
        if (sigCanvas.current.isEmpty()) {
            alert("Please provide a signature first.");
            return;
        }
        const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
        onSave(dataURL);
    };

    return (
        <div className="win7-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="aero-glass rounded w-full max-w-lg">
                {/* Title Bar */}
                <div className="win7-window-title flex justify-between items-center">
                    <span>Create Signature</span>
                    <button
                        onClick={onCancel}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="border-2 border-gray-300 rounded bg-white mb-4">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{
                                className: 'w-full h-48',
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={clear}
                            className="win7-button px-4 py-2 rounded text-sm font-semibold"
                        >
                            Clear
                        </button>
                        <button
                            onClick={save}
                            className="win7-button-primary px-4 py-2 rounded text-sm font-semibold"
                        >
                            Use Signature
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
