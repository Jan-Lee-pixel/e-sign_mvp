import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check, X, Save, Trash2, PenTool, LayoutGrid, Type } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';

// Inject Google Fonts
const fontStyles = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Sacramento&family=Allura&display=swap');
`;

const SignaturePad = ({ onSave, onCancel, onWarning, userId, initialCategory = 'General', categories = [] }) => {
    // Shared State
    const [loading, setLoading] = useState(false);

    // Check mode
    const isInitialMode = initialCategory === 'Initial';

    if (isInitialMode) {
        return <InitialAdoptionMode
            onSave={onSave}
            onCancel={onCancel}
            onWarning={onWarning}
            userId={userId}
        />;
    }

    return <StandardSignatureMode
        onSave={onSave}
        onCancel={onCancel}
        onWarning={onWarning}
        userId={userId}
        initialCategory={initialCategory}
        categories={categories}
    />;
};

// --- INITIAL ADOPTION MODE (DocuSign Style) ---
const InitialAdoptionMode = ({ onSave, onCancel, onWarning, userId }) => {
    const sigCanvas = useRef({});
    const [activeTab, setActiveTab] = useState('style'); // Default to style for adoption
    const [fullName, setFullName] = useState('');
    const [initials, setInitials] = useState('');
    const [selectedFont, setSelectedFont] = useState('Dancing Script');
    const availableFonts = ['Dancing Script', 'Great Vibes', 'Sacramento', 'Allura'];

    const handleNameChange = (val) => {
        setFullName(val);

        // Auto-generate initials if not manually overridden (logic can be refined)
        // For simple UX, we just always update if they are typing the name
        // extracting first letter of first word and first letter of last word
        const parts = val.trim().split(/\s+/);
        if (parts.length > 0 && parts[0]) {
            let init = parts[0][0].toUpperCase();
            if (parts.length > 1) {
                init += parts[parts.length - 1][0].toUpperCase();
            }
            setInitials(init);
        } else {
            setInitials('');
        }
    };

    const generateImageFromText = (text, font) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `60px "${font}"`;
        const textMetrics = ctx.measureText(text);
        const width = Math.max(textMetrics.width + 40, 200);
        const height = 100;

        canvas.width = width;
        canvas.height = height;

        ctx.font = `60px "${font}"`;
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(text, width / 2, height / 2);

        return canvas.toDataURL('image/png');
    };

    const handleAdopt = () => {
        if (activeTab === 'draw') {
            if (sigCanvas.current.isEmpty()) {
                if (onWarning) onWarning("Please draw your initials first.");
                return;
            }
            onSave(sigCanvas.current.getCanvas().toDataURL('image/png'));
        } else {
            if (!fullName) {
                if (onWarning) onWarning("Please enter your name.");
                return;
            }
            // For initials field, we just return the Initials image
            // If initials empty but name present, fallback to parsed
            let init = initials;
            if (!init && fullName) {
                const parts = fullName.trim().split(/\s+/);
                if (parts.length > 0) init = parts[0][0].toUpperCase();
                if (parts.length > 1) init += parts[parts.length - 1][0].toUpperCase();
            }

            onSave(generateImageFromText(init, selectedFont));
        }
    };

    const clear = () => sigCanvas.current.clear();

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200 font-['DM_Sans']">
            <style>{fontStyles}</style>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="text-xl font-bold text-gray-900">Adopt Your Initials</h3>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-gray-500">
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">Confirm your name and initials.</p>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Initials <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={initials}
                                    onChange={(e) => setInitials(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium uppercase"
                                    placeholder="Initials"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setActiveTab('style')}
                            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'style' ? 'border-[var(--template-primary)] text-[var(--template-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            SELECT STYLE
                        </button>
                        <button
                            onClick={() => setActiveTab('draw')}
                            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'draw' ? 'border-[var(--template-primary)] text-[var(--template-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            DRAW
                        </button>
                    </div>

                    <div className="min-h-[200px]">
                        {activeTab === 'style' && (
                            <div className="space-y-4">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preview</div>
                                <div className="border border-gray-200 rounded-lg p-6 max-h-[300px] overflow-y-auto grid gap-4">
                                    {availableFonts.map((font) => (
                                        <div
                                            key={font}
                                            onClick={() => setSelectedFont(font)}
                                            className={`
                                                cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-all hover:shadow-md
                                                ${selectedFont === font ? 'ring-2 ring-[var(--template-primary)] border-transparent bg-blue-50/30' : 'border-gray-200 bg-white'}
                                            `}
                                        >
                                            <div className="flex items-center gap-8 w-full">
                                                <div className="flex-1">
                                                    <div className="text-xs text-gray-400 mb-1">Signed by:</div>
                                                    <div style={{ fontFamily: font, fontSize: '24px' }} className="text-gray-900">
                                                        {fullName || 'E Sign'}
                                                    </div>
                                                </div>
                                                <div className="border-l border-gray-200 pl-8">
                                                    <div className="text-xs text-gray-400 mb-1 font-bold">DS</div>
                                                    <div style={{ fontFamily: font, fontSize: '28px' }} className="text-gray-900">
                                                        {initials || 'ES'}
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedFont === font && (
                                                <div className="h-6 w-6 bg-[var(--template-primary)] rounded-full flex items-center justify-center text-white shrink-0 ml-4">
                                                    <Check size={14} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'draw' && (
                            <div className="border border-gray-300 rounded-lg bg-gray-50 relative group">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    velocityFilterWeight={0.7}
                                    canvasProps={{
                                        className: 'w-full h-64 cursor-crosshair rounded-lg',
                                    }}
                                />
                                <div className="absolute top-4 left-4 text-sm text-gray-400 pointer-events-none select-none">
                                    Draw your initials here
                                </div>
                                <button onClick={clear} className="absolute bottom-4 right-4 text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-600 font-medium z-10">
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-[11px] text-gray-500 leading-relaxed mb-6">
                            By selecting Adopt and Initial, I agree that the initials will be the electronic representation of my initials for all purposes.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                            <Button onClick={handleAdopt} className="px-8 bg-[var(--template-primary)] text-white">Adopt and Initial</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STANDARD SIGNATURE MODE (Existing Logic) ---
const StandardSignatureMode = ({ onSave, onCancel, onWarning, userId, initialCategory, categories }) => {
    const sigCanvas = useRef({});
    const [activeTab, setActiveTab] = useState('draw');
    const [savedSignatures, setSavedSignatures] = useState([]);
    const [saveToProfile, setSaveToProfile] = useState(!!userId);
    const [loading, setLoading] = useState(false);

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
        const { data, error } = await supabase.from('signatures').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (data) setSavedSignatures(data);
        setLoading(false);
    };

    const clear = () => sigCanvas.current.clear();

    const save = async () => {
        if (sigCanvas.current.isEmpty()) {
            if (onWarning) onWarning("Please valid signature.");
            return;
        }

        let dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');

        if (includePrintedName && (firstName || lastName)) {
            const canvas = document.createElement('canvas');
            const signatureCanvas = sigCanvas.current.getCanvas();
            const ctx = canvas.getContext('2d');
            const width = signatureCanvas.width;
            const scale = Math.max(1, width / 500);
            const padding = 20 * scale;
            const fontSize = 48 * scale;
            const textHeight = fontSize * 1.5;
            const height = signatureCanvas.height + textHeight + padding;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(signatureCanvas, 0, 0);
            ctx.font = `bold ${fontSize}px 'DM Sans', sans-serif`;
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const fullName = `${firstName} ${lastName}`.trim();
            const textY = signatureCanvas.height + (padding / 2) + (textHeight / 2);
            ctx.fillText(fullName, width / 2, textY);
            dataURL = canvas.toDataURL('image/png');
        }

        if (userId && saveToProfile) {
            await supabase.from('signatures').insert([{
                user_id: userId,
                signature_url: dataURL,
                first_name: firstName,
                last_name: lastName,
                category: category
            }]);
        }

        onSave(dataURL);
    };

    const handleSelectSaved = (url) => onSave(url);

    const handleDeleteSaved = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete?")) return;
        const { error } = await supabase.from('signatures').delete().eq('id', id);
        if (!error) setSavedSignatures(prev => prev.filter(s => s.id !== id));
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
                        <button onClick={() => setActiveTab('draw')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'draw' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                            <PenTool size={16} /> Draw New
                        </button>
                        <button onClick={() => setActiveTab('saved')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'saved' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                            <LayoutGrid size={16} /> Saved Signatures
                        </button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'draw' ? (
                        <>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden relative group hover:border-primary transition-colors">
                                <SignatureCanvas ref={sigCanvas} penColor="black" velocityFilterWeight={0.7} canvasProps={{ className: 'w-full h-48 cursor-crosshair' }} />
                                <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none select-none group-hover:text-primary">Sign here</div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full text-sm border-gray-200 rounded-lg focus:border-primary" placeholder="John" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full text-sm border-gray-200 rounded-lg focus:border-primary" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={includePrintedName} onChange={(e) => setIncludePrintedName(e.target.checked)} disabled={!firstName && !lastName} className="rounded border-gray-300 text-primary" />
                                    <label className="text-sm text-gray-600 cursor-pointer">Include printed name</label>
                                </div>
                                {userId && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                        <input type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} className="rounded border-gray-300 text-primary" />
                                        <label className="text-sm text-gray-600 cursor-pointer">Save to profile</label>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="secondary" onClick={clear}><Eraser size={16} className="mr-2" /> Clear</Button>
                                <Button onClick={save}><Check size={16} className="mr-2" /> Use Signature</Button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {loading ? <div className="text-center text-gray-400">Loading...</div> : savedSignatures.length === 0 ? <div className="text-center text-gray-400">No saved signatures</div> : (
                                <div className="grid grid-cols-1 gap-3">
                                    {savedSignatures.map((sig) => (
                                        <div key={sig.id} className="relative border border-gray-200 rounded-lg p-2 hover:border-primary cursor-pointer bg-white" onClick={() => handleSelectSaved(sig.signature_url)}>
                                            <img src={sig.signature_url} alt="Sig" className="h-16 w-full object-contain" />
                                            <button onClick={(e) => handleDeleteSaved(sig.id, e)} className="absolute top-2 right-2 text-red-500"><Trash2 size={14} /></button>
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
