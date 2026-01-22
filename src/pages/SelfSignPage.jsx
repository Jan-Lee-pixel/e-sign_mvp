import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import PDFViewer from '../components/PDFViewer';
import SignaturePad from '../components/SignaturePad';
import DraggableSignature from '../components/DraggableSignature';
import { embedSignature } from '../utils/pdfUtils';
import { supabase } from '../lib/supabase';
import { PenTool, Download, LogOut, User, Settings, Menu, Send } from 'lucide-react';

function SelfSignPage({ session }) {
    const navigate = useNavigate();
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [signatureImage, setSignatureImage] = useState(null);
    const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpload = (buffer) => {
        setPdfFile(buffer);
        setPdfBuffer(buffer.slice(0));
        setSignatureImage(null);
        setSignaturePosition({ x: 0, y: 0 });
        setPageNumber(1);
    };

    const handleSignatureSave = (dataURL) => {
        setSignatureImage(dataURL);
        setSignaturePosition({ x: 50, y: 50 });
        setIsSignatureModalOpen(false);
    };

    const handleDownload = async () => {
        if (!pdfBuffer || !signatureImage) return;

        setIsProcessing(true);
        try {
            const signedPdfBytes = await embedSignature({
                pdfBuffer,
                signatureImage,
                position: signaturePosition,
                pageIndex: pageNumber - 1,
                visualWidth: 600,
            });

            const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
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
        <div className="min-h-screen bg-[#ededed] flex flex-col">
            <header className="win7-taskbar">
                <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                    <h1 className="text-white font-semibold text-lg flex items-center gap-2">
                        <PenTool className="w-5 h-5" />
                        E-Sign
                    </h1>

                    <div className="flex items-center gap-3">
                        {/* Navigation to Compose */}
                        <button
                            onClick={() => navigate('/compose')}
                            className="win7-button px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2"
                        >
                            <Send size={14} />
                            Send for Signature
                        </button>

                        {pdfFile && (
                            <button
                                onClick={() => setIsSignatureModalOpen(true)}
                                className="win7-button-primary px-4 py-1.5 rounded text-sm font-semibold disabled:opacity-50"
                                disabled={!!signatureImage}
                            >
                                {signatureImage ? "Signature Added" : "Add Signature"}
                            </button>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="win7-button px-3 py-1.5 rounded text-sm font-semibold"
                            >
                                <Menu size={16} />
                            </button>

                            {isMenuOpen && (
                                <div className="win7-menu absolute right-0 mt-2 w-48 py-1 z-50">
                                    <div className="px-3 py-2 border-b border-gray-300">
                                        <p className="text-xs text-gray-600">Signed in</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate">{session?.user?.email}</p>
                                    </div>
                                    <div className="border-t border-gray-300 mt-1 pt-1">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleSignOut();
                                            }}
                                            className="win7-menu-item w-full text-left text-sm flex items-center gap-2 text-red-600"
                                        >
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-6 flex justify-center fade-in">
                {!pdfFile ? (
                    <div className="w-full max-w-2xl mt-12">
                        <div className="win7-window-container">
                            <div className="win7-window-title">
                                Upload Document (Self Sign)
                            </div>
                            <div className="p-8">
                                <PDFUploader onUpload={handleUpload} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-5xl">
                        <div className="win7-window-container">
                            <div className="win7-window-title flex justify-between items-center">
                                <span>Document Viewer</span>
                                {signatureImage && (
                                    <button
                                        onClick={handleDownload}
                                        className="win7-button-primary px-4 py-1 rounded text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
                                        disabled={isProcessing}
                                    >
                                        <Download size={14} />
                                        {isProcessing ? "Processing..." : "Download"}
                                    </button>
                                )}
                            </div>
                            <div className="p-4">
                                <PDFViewer
                                    pdfFile={pdfFile}
                                    pageNumber={pageNumber}
                                    onPageChange={setPageNumber}
                                >
                                    {signatureImage && (
                                        <DraggableSignature
                                            imageSrc={signatureImage}
                                            initialPosition={signaturePosition}
                                            onPositionChange={setSignaturePosition}
                                            onDelete={() => {
                                                setSignatureImage(null);
                                                setSignaturePosition({ x: 0, y: 0 });
                                            }}
                                        />
                                    )}
                                </PDFViewer>
                            </div>
                        </div>
                    </div>
                )}
            </main>

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
