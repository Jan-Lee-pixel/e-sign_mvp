import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import PDFViewer from '../components/PDFViewer';
import SignaturePad from '../components/SignaturePad';
import DraggableSignature from '../components/DraggableSignature';
import { embedSignature, embedText } from '../utils/pdfUtils';
import { supabase } from '../lib/supabase';
import { PenTool, Download, LogOut, CheckCircle, Trash2, ArrowLeft, Loader2, UploadCloud, Stamp, Type, Calendar, CheckSquare } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import AlertModal from '../components/AlertModal';
import TextInputModal from '../components/TextInputModal';
import { Button } from '../components/ui/Button';

// ... imports ...

function SelfSignPage({ session }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageDimensions, setPageDimensions] = useState(null);

    // ... (useEffect for location.state)

    const handlePageLoad = (page) => {
        // ... (handlePageLoad logic)
        const originalWidth = page.originalWidth;
        const originalHeight = page.originalHeight;
        const rotation = page.rotate || 0;
        let validWidth = originalWidth;
        let validHeight = originalHeight;

        if (rotation === 90 || rotation === 270) {
            validWidth = originalHeight;
            validHeight = originalWidth;
        }

        const aspectRatio = validWidth / validHeight;
        const renderedHeight = 600 / aspectRatio;

        setPageDimensions({ width: 600, height: renderedHeight });
    };

    // Array for signatures: { id, image, x, y, page }
    const [signatures, setSignatures] = useState([]);
    const [editingSignatureId, setEditingSignatureId] = useState(null);

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [activeInputId, setActiveInputId] = useState(null); // For editing text
    const [modalMode, setModalMode] = useState('Signature'); // 'Signature', 'Initial', 'Stamp'

    const handleAddDate = () => {
        const today = new Date().toLocaleDateString();
        const newSig = {
            id: crypto.randomUUID(),
            type: 'date',
            text: today,
            x: 50,
            y: 50,
            page: pageNumber
        };
        setSignatures([...signatures, newSig]);
    };

    const handleAddText = () => {
        const newSig = {
            id: crypto.randomUUID(),
            type: 'text',
            text: 'Text',
            x: 50,
            y: 50,
            page: pageNumber
        };
        setSignatures([...signatures, newSig]);
        // Immediately open edit modal for convenience
        setActiveInputId(newSig.id);
        setIsInputModalOpen(true);
    };

    const handleAddCheckbox = () => {
        const newSig = {
            id: crypto.randomUUID(),
            type: 'checkbox',
            text: '', // 'X' or ''
            x: 50,
            y: 50,
            page: pageNumber
        };
        setSignatures([...signatures, newSig]);
    };

    const handleInputSave = (val) => {
        if (activeInputId) {
            setSignatures(signatures.map(s => s.id === activeInputId ? { ...s, text: val } : s));
            setActiveInputId(null);
            setIsInputModalOpen(false);
        }
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: () => { } });
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "error" });

    const handleUpload = (buffer) => {
        // Clone for separate usage
        setPdfFile(buffer.slice(0));
        setPdfBuffer(buffer.slice(0));
        setSignatures([]);
        setPageNumber(1);
        setPageDimensions(null);
    };

    const handleSignatureSave = (dataURL) => {
        if (editingSignatureId) {
            // Update existing signature
            setSignatures(signatures.map(s => s.id === editingSignatureId ? { ...s, image: dataURL } : s));
            setEditingSignatureId(null);
        } else {
            // Add new signature
            const newSig = {
                id: crypto.randomUUID(),
                type: modalMode.toLowerCase(), // 'signature', 'initial', 'stamp'
                image: dataURL,
                x: 50,
                y: 50,
                page: pageNumber
            };
            setSignatures([...signatures, newSig]);
        }
        setIsSignatureModalOpen(false);
    };

    const handleEditSignature = (id) => {
        const sig = signatures.find(s => s.id === id);
        if (!sig) return;

        if (sig.type === 'text') {
            setActiveInputId(id);
            setIsInputModalOpen(true);
        } else if (sig.type === 'checkbox') {
            // Toggle checkbox
            setSignatures(signatures.map(s => s.id === id ? { ...s, text: s.text === 'X' ? '' : 'X' } : s));
        } else if (sig.type === 'date') {
            // Maybe allow editing date text? For now just re-set to today or leave as is.
            // Let's allow editing text for flexibility
            setActiveInputId(id);
            setIsInputModalOpen(true);
        } else {
            // Image types
            setEditingSignatureId(id);
            setIsSignatureModalOpen(true);
        }
    };

    const updateSignaturePosition = (id, newPos) => {
        setSignatures(signatures.map(s => s.id === id ? { ...s, x: newPos.x, y: newPos.y } : s));
    };

    const updateSignatureSize = (id, newSize) => {
        setSignatures(signatures.map(s => s.id === id ? { ...s, width: newSize.width, height: newSize.height } : s));
    };

    const removeSignature = (id) => {
        setSignatures(signatures.filter(s => s.id !== id));
    };

    const clearSignatures = () => {
        setConfirmModal({
            isOpen: true,
            title: "Clear All",
            message: "Clear all signatures?",
            onConfirm: () => {
                setSignatures([]);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleChangeFile = () => {
        const resetFile = () => {
            setPdfFile(null);
            setPdfBuffer(null);
            setSignatures([]);
            setPageNumber(1);
            setPageDimensions(null);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        };

        if (signatures.length > 0) {
            setConfirmModal({
                isOpen: true,
                title: "Change File",
                message: "Changing the file will remove all current signatures. Are you sure?",
                onConfirm: resetFile
            });
        } else {
            resetFile();
        }
    };

    const handleDownload = async () => {
        if (!pdfBuffer || signatures.length === 0) return;

        setIsProcessing(true);
        try {
            // Clone buffer
            let currentPdfBuffer = pdfBuffer.slice(0);

            // Embed ALL signatures
            for (const sig of signatures) {
                if (sig.type === 'signature' || sig.type === 'initial' || sig.type === 'stamp' || !sig.type) {
                    currentPdfBuffer = await embedSignature({
                        pdfBuffer: currentPdfBuffer,
                        signatureImage: sig.image,
                        position: { x: sig.x, y: sig.y },
                        width: sig.width,
                        height: sig.height,
                        pageIndex: sig.page - 1,
                        visualWidth: 600,
                    });
                } else {
                    // Text, Date, Checkbox
                    currentPdfBuffer = await embedText({
                        pdfBuffer: currentPdfBuffer,
                        text: sig.text || '',
                        position: { x: sig.x, y: sig.y },
                        width: sig.width, // Pass width/height if needed for multiline or scaling
                        height: sig.height,
                        pageIndex: sig.page - 1,
                        visualWidth: 600,
                        fontSize: sig.height ? Math.max(10, sig.height * 0.5) : 12 // Approximate font size from height
                    });
                }
            }

            const blob = new Blob([currentPdfBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'signed_document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error signing PDF:", error);
            console.error("Error signing PDF:", error);
            setAlertModal({ isOpen: true, title: "Error", message: "Failed to sign PDF.", type: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)]">
            {/* Header */}
            <header className="h-20 bg-[rgba(253,252,248,0.95)] backdrop-blur-xl border-b border-[var(--template-border)] flex items-center justify-between px-8 shadow-sm z-50 shrink-0 animate-[slideDown_0.5s_ease-out]">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/dashboard')}
                        title="Back to Dashboard"
                        className="text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] hover:bg-transparent transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="h-8 w-[1px] bg-[var(--template-border)]"></div>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2 font-['Crimson_Pro'] text-[var(--template-primary)]">
                            <PenTool className="w-5 h-5" />
                            <span>Self-Sign Mode</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {session?.user?.email && (
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[var(--template-bg-secondary)] rounded-xl border border-[var(--template-border)] shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-[var(--template-primary)]/10 flex items-center justify-center text-[var(--template-primary)] text-xs font-bold">
                                {session.user.email[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[var(--template-text-secondary)]">{session.user.email}</span>
                        </div>
                    )}
                    <Button
                        variant="secondary"
                        onClick={handleSignOut}
                        className="text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] bg-white border border-[var(--template-border)] hover:bg-[var(--template-bg-secondary)]"
                    >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 bg-white/60 backdrop-blur-md border-r border-[var(--template-border)] flex flex-col shrink-0 relative z-40 shadow-[var(--template-shadow-sm)]">
                    <div className="p-6 border-b border-[var(--template-border)]">
                        <h2 className="text-xs font-bold text-[var(--template-primary)] uppercase tracking-widest font-['Crimson_Pro']">Document Tools</h2>
                        <p className="text-xs text-[var(--template-text-light)] mt-2">Manage your document and signatures.</p>
                    </div>

                    <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
                        {!pdfFile ? (
                            <div className="text-center animate-[fadeIn_0.5s_ease-out]">
                                <div className="p-8 border-2 border-dashed border-[var(--template-border)] rounded-2xl bg-[var(--template-bg-secondary)] mb-6 hover:border-[var(--template-primary)] transition-colors group">
                                    <div className="w-14 h-14 bg-[var(--template-primary)]/10 text-[var(--template-primary)] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={28} />
                                    </div>
                                    <h3 className="text-base font-semibold text-[var(--template-text-primary)] mb-1">Upload Document</h3>
                                    <p className="text-sm text-[var(--template-text-light)] mb-6">Select a PDF file to begin signing.</p>
                                    <PDFUploader
                                        onUpload={handleUpload}
                                        onError={(msg) => setAlertModal({ isOpen: true, title: "Upload Error", message: msg, type: "error" })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-[slideRight_0.5s_ease-out]">
                                <div>
                                    <h3 className="text-xs font-bold text-[var(--template-text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <PenTool size={14} /> Signatures
                                    </h3>
                                    <div className="flex gap-2 mb-4">
                                        <Button
                                            onClick={handleChangeFile}
                                            className="w-full justify-center bg-white border border-[var(--template-border)] text-red-500 hover:border-red-500 hover:bg-red-50 shadow-sm transition-all py-5 mb-3"
                                        >
                                            <UploadCloud size={18} className="mr-2" />
                                            Change File
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 mb-4">
                                        <Button
                                            onClick={() => {
                                                setModalMode('Signature');
                                                setIsSignatureModalOpen(true);
                                            }}
                                            className="w-full justify-start bg-white border border-[var(--template-border)] text-[var(--template-text-primary)] hover:border-[var(--template-primary)] hover:text-[var(--template-primary)] hover:bg-[var(--template-bg-secondary)] shadow-sm transition-all py-4 px-4"
                                        >
                                            <PenTool size={18} className="mr-3" />
                                            Add Signature
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setModalMode('Initial');
                                                setIsSignatureModalOpen(true);
                                            }}
                                            className="w-full justify-start bg-white border border-[var(--template-border)] text-[var(--template-text-primary)] hover:border-[var(--template-primary)] hover:text-[var(--template-primary)] hover:bg-[var(--template-bg-secondary)] shadow-sm transition-all py-4 px-4"
                                        >
                                            <Type size={18} className="mr-3" />
                                            Add Initial
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setModalMode('Stamp');
                                                setIsSignatureModalOpen(true);
                                            }}
                                            className="w-full justify-start bg-white border border-[var(--template-border)] text-[var(--template-text-primary)] hover:border-[var(--template-primary)] hover:text-[var(--template-primary)] hover:bg-[var(--template-bg-secondary)] shadow-sm transition-all py-4 px-4"
                                        >
                                            <Stamp size={18} className="mr-3" />
                                            Add Stamp
                                        </Button>
                                        <Button
                                            onClick={handleAddText}
                                            className="w-full justify-start bg-white border border-[var(--template-border)] text-[var(--template-text-primary)] hover:border-[var(--template-primary)] hover:text-[var(--template-primary)] hover:bg-[var(--template-bg-secondary)] shadow-sm transition-all py-4 px-3 text-sm"
                                        >
                                            <Type size={16} className="mr-2" />
                                            Text
                                        </Button>
                                    </div>

                                    {signatures.length > 0 && (
                                        <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl flex items-center justify-between group shadow-sm transition-all hover:shadow-md">
                                            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                                <CheckCircle size={18} />
                                                <span>{signatures.length} signature{signatures.length !== 1 ? 's' : ''} added</span>
                                            </div>
                                            <button
                                                onClick={clearSignatures}
                                                className="text-green-600 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                title="Clear all signatures"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-[var(--template-border)]">
                                    <h3 className="text-xs font-bold text-[var(--template-text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Download size={14} /> Actions
                                    </h3>
                                    <Button
                                        onClick={handleDownload}
                                        disabled={isProcessing || signatures.length === 0}
                                        isLoading={isProcessing}
                                        className="w-full bg-[var(--template-success)] hover:bg-[#27ae60] text-white shadow-[var(--template-shadow-md)] hover:shadow-[var(--template-shadow-lg)] hover:-translate-y-0.5 transition-all py-6 rounded-xl text-base font-semibold"
                                    >
                                        {isProcessing ? "Saving..." : "Download Signed PDF"}
                                        {!isProcessing && <Download size={18} className="ml-2" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Canvas */}
                <main className="flex-1 bg-gray-100/50 overflow-auto flex justify-center p-8 relative">
                    {pdfFile ? (
                        <div className="relative h-fit my-auto shadow-xl ring-1 ring-black/5 bg-white">
                            <PDFViewer
                                pdfFile={pdfFile}
                                pageNumber={pageNumber}
                                onPageChange={setPageNumber}
                                onPageLoad={handlePageLoad}
                            >
                                {signatures.map(sig => {
                                    if (sig.page !== pageNumber) return null;
                                    return (
                                        <DraggableSignature
                                            key={sig.id}
                                            imageSrc={sig.image}
                                            text={sig.text}
                                            type={sig.type}
                                            initialPosition={{ x: sig.x, y: sig.y }}
                                            initialSize={sig.width ? { width: sig.width, height: sig.height } : null}
                                            onPositionChange={(pos) => updateSignaturePosition(sig.id, pos)}
                                            onResize={(size) => updateSignatureSize(sig.id, size)}
                                            onDelete={() => removeSignature(sig.id)}
                                            onEdit={() => handleEditSignature(sig.id)}
                                            containerDimensions={pageDimensions}
                                        />
                                    );
                                })}
                            </PDFViewer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <PenTool size={40} className="opacity-20 text-gray-500" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">No document loaded</p>
                            <p className="text-sm text-gray-400 mt-1">Upload a PDF from the sidebar to get started</p>
                        </div>
                    )}
                </main>
            </div>

            {isSignatureModalOpen && (
                <SignaturePad
                    onSave={handleSignatureSave}
                    onCancel={() => {
                        setIsSignatureModalOpen(false);
                        setEditingSignatureId(null);
                    }}
                    onWarning={(msg) => setAlertModal({ isOpen: true, title: "Drawing Required", message: msg, type: "info" })}
                    userId={session?.user?.id}
                    initialCategory={modalMode}
                />
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
            <TextInputModal
                isOpen={isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                onSave={handleInputSave}
                label="Enter Text"
                initialValue={activeInputId ? signatures.find(s => s.id === activeInputId)?.text : ''}
            />
        </div>
    );
}

export default SelfSignPage;
