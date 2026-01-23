import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import PDFViewer from '../components/PDFViewer';
import SignaturePad from '../components/SignaturePad';
import DraggableSignature from '../components/DraggableSignature';
import { embedSignature } from '../utils/pdfUtils';
import { supabase } from '../lib/supabase';
import { PenTool, Download, LogOut, User, Settings, Menu, Send, CheckCircle } from 'lucide-react';

// ... imports ...

function SelfSignPage({ session }) {
    const navigate = useNavigate();
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageDimensions, setPageDimensions] = useState(null);

    const handlePageLoad = (page) => {
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

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpload = (buffer) => {
        // Clone for separate usage
        setPdfFile(buffer.slice(0));
        setPdfBuffer(buffer.slice(0));
        setSignatures([]);
        setPageNumber(1);
        setPageDimensions(null);
    };

    const handleSignatureSave = (dataURL) => {
        const newSig = {
            id: crypto.randomUUID(),
            image: dataURL,
            x: 50,
            y: 50,
            page: pageNumber
        };
        setSignatures([...signatures, newSig]);
        setIsSignatureModalOpen(false);
    };

    const updateSignaturePosition = (id, newPos) => {
        setSignatures(signatures.map(s => s.id === id ? { ...s, x: newPos.x, y: newPos.y } : s));
    };

    const removeSignature = (id) => {
        setSignatures(signatures.filter(s => s.id !== id));
    };

    const clearSignatures = () => {
        if (window.confirm("Clear all signatures?")) {
            setSignatures([]);
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
                currentPdfBuffer = await embedSignature({
                    pdfBuffer: currentPdfBuffer,
                    signatureImage: sig.image,
                    position: { x: sig.x, y: sig.y },
                    pageIndex: sig.page - 1,
                    visualWidth: 600,
                });
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
            alert("Failed to sign PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#ededed] font-segoe">
            {/* Header */}
            <header className="h-16 bg-[#1853db] text-white flex items-center justify-between px-6 shadow-md z-50 shrink-0 win7-aero-glass">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Back to Dashboard"
                    >
                        <div className="w-6 h-6 flex items-center justify-center font-bold text-xl">←</div>
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2 text-white text-shadow-sm">
                            <PenTool className="w-6 h-6" />
                            <span>E-Sign Self-Sign</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm opacity-80">Welcome, {session?.user?.email}</span>
                    <button
                        onClick={handleSignOut}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 text-sm flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-[#f0f0f0] border-r border-[#999999] flex flex-col shrink-0 relative z-40">
                    <div className="p-4 bg-gradient-to-b from-white to-[#e6e6e6] border-b border-[#b5b5b5]">
                        <h2 className="text-[#1e395b] font-bold text-sm">Review & Sign</h2>
                    </div>

                    <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
                        <div className="win7-window-container bg-white p-4">
                            {!pdfFile ? (
                                <>
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Upload</h3>
                                    <p className="text-xs text-gray-500 mb-3">Select a PDF file from your computer to sign.</p>
                                    <PDFUploader onUpload={handleUpload} />
                                </>
                            ) : (
                                <>
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Sign Tools</h3>
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => setIsSignatureModalOpen(true)}
                                            className="flex-1 py-2 bg-blue-100 border border-blue-300 text-blue-900 rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
                                        >
                                            <PenTool size={14} />
                                            Add Signature
                                        </button>
                                        <button
                                            onClick={clearSignatures}
                                            disabled={signatures.length === 0}
                                            className="px-3 py-2 bg-red-100 border border-red-300 text-red-800 rounded hover:bg-red-200 transition-colors flex items-center justify-center disabled:opacity-50"
                                            title="Clear All"
                                        >
                                            <span className="text-xs font-bold">×</span>
                                        </button>
                                    </div>

                                    {signatures.length > 0 && (
                                        <div className="mb-4 text-xs text-green-600 flex items-center gap-1 bg-green-50 p-2 rounded border border-green-200">
                                            <CheckCircle size={12} />
                                            {signatures.length} signature(s) added
                                        </div>
                                    )}

                                    <div className="border-t pt-4">
                                        <h3 className="text-sm font-bold text-gray-700 mb-2">Actions</h3>
                                        <button
                                            onClick={handleDownload}
                                            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold shadow-lg transition-all flex items-center justify-center gap-2 border border-green-600 disabled:opacity-50"
                                            disabled={isProcessing || signatures.length === 0}
                                        >
                                            <Download size={16} />
                                            {isProcessing ? "Saving..." : "Download PDF"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Canvas */}
                <main className="flex-1 bg-[#8c8c8c] overflow-auto flex justify-center p-8 relative win7-wallpaper-pattern shadow-inner">
                    {pdfFile ? (
                        <div className="relative h-fit my-auto shadow-2xl">
                            <div className="win7-window-container p-0 overflow-hidden border-none ring-1 ring-black/20">
                                <div className="bg-white">
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
                                                    initialPosition={{ x: sig.x, y: sig.y }}
                                                    onPositionChange={(pos) => updateSignaturePosition(sig.id, pos)}
                                                    onDelete={() => removeSignature(sig.id)}
                                                    containerDimensions={pageDimensions}
                                                />
                                            );
                                        })}
                                    </PDFViewer>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/50">
                            <PenTool size={64} className="mb-4 opacity-50" />
                            <p className="text-xl">No document loaded</p>
                        </div>
                    )}
                </main>
            </div>

            {isSignatureModalOpen && (
                <SignaturePad
                    onSave={handleSignatureSave}
                    onCancel={() => setIsSignatureModalOpen(false)}
                />
            )}
        </div>
    );
}

export default SelfSignPage;
