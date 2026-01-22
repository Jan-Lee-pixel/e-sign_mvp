import React, { useState, useEffect } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import SignaturePad from './components/SignaturePad';
import DraggableSignature from './components/DraggableSignature';
import AuthPage from './components/AuthPage';
import { embedSignature } from './utils/pdfUtils';
import { supabase } from './lib/supabase';
import { PenTool, Download, LogOut, User, Settings, Menu } from 'lucide-react';

function App() {
    const [session, setSession] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);

    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null); // Keep original buffer
    const [pageNumber, setPageNumber] = useState(1);
    const [signatureImage, setSignatureImage] = useState(null);
    const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingSession(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpload = (buffer) => {
        setPdfBuffer(buffer);
        setPdfFile(buffer); // react-pdf can take buffer directly
        setPageNumber(1); // Reset to first page
    };

    const handleSignatureSave = (dataURL) => {
        setSignatureImage(dataURL);
        // Reset position to center or top-left initially
        setSignaturePosition({ x: 50, y: 50 });
        setIsSignatureModalOpen(false);
    };

    const handleDownload = async () => {
        if (!pdfBuffer || !signatureImage) return;

        setIsProcessing(true);
        try {
            console.log("Starting download with position:", signaturePosition);
            const signedPdfBytes = await embedSignature({
                pdfBuffer,
                signatureImage,
                position: signaturePosition,
                pageIndex: pageNumber - 1, // Use current page index
                visualWidth: 600, // Matching PDFViewer default width
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

    if (loadingSession) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session) {
        return <AuthPage />;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <header className="bg-white shadow p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <PenTool className="text-blue-600" />
                        E-Sign
                    </h1>

                    <div className="flex items-center gap-4">
                        {pdfFile && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsSignatureModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                    disabled={!!signatureImage} // Disable if already signed (MVP constraint: 1 signature)
                                >
                                    {signatureImage ? "Signature Added" : "Add Signature"}
                                </button>
                                {signatureImage && (
                                    <button
                                        onClick={handleDownload}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
                                        disabled={isProcessing}
                                    >
                                        <Download size={18} />
                                        {isProcessing ? "Processing..." : "Download PDF"}
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                title="User Menu"
                            >
                                <Menu size={24} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm text-gray-500">Signed in as</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.email}</p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            alert("Profile Settings - Coming Soon");
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <User size={16} />
                                        Profile
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            alert("App Settings - Coming Soon");
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <Settings size={16} />
                                        Settings
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            handleSignOut();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-8 flex justify-center">
                {!pdfFile ? (
                    <div className="w-full max-w-2xl mt-10">
                        <div className="bg-white p-10 rounded shadow-md text-center">
                            <h2 className="text-2xl font-semibold mb-6">Upload a document to sign</h2>
                            <PDFUploader onUpload={handleUpload} />
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl flex justify-center">
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

export default App;
