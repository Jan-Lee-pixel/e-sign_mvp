import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check, X, Save, Trash2, PenTool, LayoutGrid } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';

const SignaturePad = ({ onSave, onCancel, onWarning, userId, initialCategory = 'General', categories = [] }) => {
    const sigCanvas = useRef({});
    const [activeTab, setActiveTab] = useState('draw'); // 'draw' or 'saved'
    const [savedSignatures, setSavedSignatures] = useState([]);
    const [saveToProfile, setSaveToProfile] = useState(!!initialCategory && !!userId);
    const [loading, setLoading] = useState(false);

    // New state for signature details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [includePrintedName, setIncludePrintedName] = useState(false);
    const [category, setCategory] = useState(initialCategory || 'Personal');

    useEffect(() => {
        if (userId && activeTab === 'saved') {
            fetchSignatures();
        }
    }, [userId, activeTab]);

    const fetchSignatures = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('signatures')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (data) setSavedSignatures(data);
        if (error) console.error("Error fetching signatures:", error);
        setLoading(false);
    };

    const clear = () => sigCanvas.current.clear();

    const save = async () => {
        if (sigCanvas.current.isEmpty()) {
            if (onWarning) onWarning("Please provide a signature first.");
            else alert("Please provide a signature first.");
            return;
        }

        let dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');

        // Composite Printed Name if requested
        if (includePrintedName && (firstName || lastName)) {
            const canvas = document.createElement('canvas');
            const signatureCanvas = sigCanvas.current.getCanvas();
            const ctx = canvas.getContext('2d');

            // Dimensions
            const padding = 20;
            const textHeight = 40;
            const width = signatureCanvas.width;
            const height = signatureCanvas.height + textHeight + padding;

            canvas.width = width;
            canvas.height = height;

            // Draw Signature
            ctx.drawImage(signatureCanvas, 0, 0);

            // Draw Text
            ctx.font = "bold 24px 'DM Sans', sans-serif";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const fullName = `${firstName} ${lastName}`.trim();
            ctx.fillText(fullName, width / 2, signatureCanvas.height + (padding / 2) + (textHeight / 2));

            dataURL = canvas.toDataURL('image/png');
        }

        if (userId && saveToProfile) {
            // Save to database with new fields
            const { error } = await supabase
                .from('signatures')
                .insert([{
                    user_id: userId,
                    signature_url: dataURL,
                    first_name: firstName,
                    last_name: lastName,
                    category: category
                }]);

            if (error) {
                console.error("Error saving signature:", error);
                if (onWarning) onWarning("Failed to save to profile, but continuing locally.");
            }
        }

        onSave(dataURL);
    };

    const handleSelectSaved = (url) => {
        onSave(url);
    };

    const handleDeleteSaved = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete this saved signature?")) return;

        const { error } = await supabase.from('signatures').delete().eq('id', id);
        if (!error) {
            setSavedSignatures(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Sign Document</h3>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-gray-500">
                        <X size={20} />
                    </Button>
                </div>

                {userId && (
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('draw')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'draw' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <PenTool size={16} />
                            Draw New
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'saved' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <LayoutGrid size={16} />
                            Saved Signatures
                        </button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'draw' ? (
                        <>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden relative group hover:border-primary transition-colors">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    velocityFilterWeight={0.7}
                                    canvasProps={{
                                        className: 'w-full h-48 cursor-crosshair',
                                    }}
                                />
                                <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none select-none group-hover:text-primary">
                                    Sign here
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full text-sm border-gray-200 rounded-lg focus:border-primary focus:ring-primary"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full text-sm border-gray-200 rounded-lg focus:border-primary focus:ring-primary"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="include-printed-name"
                                        checked={includePrintedName}
                                        onChange={(e) => setIncludePrintedName(e.target.checked)}
                                        disabled={!firstName && !lastName}
                                        className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                                    />
                                    <label htmlFor="include-printed-name" className={`text-sm select-none cursor-pointer ${!firstName && !lastName ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Include printed name below signature
                                    </label>
                                </div>

                                {userId && (
                                    <>
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                            <input
                                                type="checkbox"
                                                id="save-sig"
                                                checked={saveToProfile}
                                                onChange={(e) => setSaveToProfile(e.target.checked)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="save-sig" className="text-sm text-gray-600 cursor-pointer select-none">
                                                Save this signature to my profile
                                            </label>
                                        </div>

                                        {saveToProfile && (
                                            <div className="mt-2 text-sm text-gray-500">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    className="w-full text-sm border-gray-200 rounded-lg focus:border-primary focus:ring-primary"
                                                >
                                                    {categories && categories.length > 0 ? (
                                                        categories.map((cat) => {
                                                            // Handle simple name extraction if it's a complex label
                                                            const val = cat.name.split(' / ')[0];
                                                            return <option key={cat.id || val} value={val}>{cat.name}</option>;
                                                        })
                                                    ) : (
                                                        <>
                                                            <option value="General">General</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
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
                        </>
                    ) : (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="py-10 text-center text-gray-400">Loading saved signatures...</div>
                            ) : savedSignatures.length === 0 ? (
                                <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                    <PenTool size={32} className="mx-auto mb-2 opacity-20" />
                                    <p>No saved signatures found.</p>
                                    <Button variant="link" onClick={() => setActiveTab('draw')} className="mt-2 text-primary">
                                        Draw one now
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(
                                        savedSignatures.reduce((acc, sig) => {
                                            const cat = sig.category || 'General';
                                            if (!acc[cat]) acc[cat] = [];
                                            acc[cat].push(sig);
                                            return acc;
                                        }, {})
                                    ).map(([category, signatures]) => (
                                        <div key={category}>
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-1">
                                                {category}
                                            </h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {signatures.map((sig) => (
                                                    <div key={sig.id} className="group relative border border-gray-200 rounded-lg p-2 hover:border-primary hover:shadow-sm transition-all cursor-pointer bg-white" onClick={() => handleSelectSaved(sig.signature_url)}>
                                                        <img src={sig.signature_url} alt="Saved Signature" className="h-16 w-full object-contain" />
                                                        <button
                                                            onClick={(e) => handleDeleteSaved(sig.id, e)}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
