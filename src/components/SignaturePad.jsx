import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check } from 'lucide-react';

const SignaturePad = ({ onSave, onCancel }) => {
    const sigCanvas = useRef({});

    const clear = () => sigCanvas.current.clear();

    const save = () => {
        if (sigCanvas.current.isEmpty()) {
            alert("Please provide a signature first.");
            return;
        }
        const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        onSave(dataURL);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Sign Here</h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="border border-gray-300 rounded mb-4">
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{
                            className: 'sigCanvas w-full h-48',
                        }}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={clear}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Clear
                    </button>
                    <button
                        onClick={save}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Check size={18} />
                        Use Signature
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
