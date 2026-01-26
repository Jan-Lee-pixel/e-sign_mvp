import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check, X } from 'lucide-react';
import { Button } from './ui/Button';

const SignaturePad = ({ onSave, onCancel, onWarning }) => {
    const sigCanvas = useRef({});

    const clear = () => sigCanvas.current.clear();

    const save = () => {
        if (sigCanvas.current.isEmpty()) {
            if (onWarning) {
                onWarning("Please provide a signature first.");
            } else {
                alert("Please provide a signature first.");
            }
            return;
        }
        const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
        onSave(dataURL);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Create Signature</h3>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-gray-500">
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-6">
                    <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden relative group hover:border-blue-400 transition-colors">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            velocityFilterWeight={0.7}
                            canvasProps={{
                                className: 'w-full h-48 cursor-crosshair',
                            }}
                        />
                        <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none select-none group-hover:text-blue-400">
                            Sign here
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={clear}
                        >
                            <Eraser size={16} className="mr-2" />
                            Clear
                        </Button>
                        <Button
                            onClick={save}
                        >
                            <Check size={16} className="mr-2" />
                            Use Signature
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
