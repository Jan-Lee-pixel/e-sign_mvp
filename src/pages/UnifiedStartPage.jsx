import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import { Button } from '../components/ui/Button';
import { ArrowLeft, PenTool, Send, FileText, UploadCloud } from 'lucide-react';

const UnifiedStartPage = () => {
    const navigate = useNavigate();
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [fileName, setFileName] = useState("");

    const handleUpload = (buffer, name) => {
        setPdfFile(buffer);
        setPdfBuffer(buffer);
        setFileName(name || "document.pdf");
    };

    const handleBack = () => {
        if (pdfFile) {
            setPdfFile(null);
            setPdfBuffer(null);
            setFileName("");
        } else {
            navigate('/dashboard');
        }
    };

    const handleChoice = (path) => {
        if (!pdfBuffer) return;
        navigate(path, {
            state: {
                fileBuffer: pdfBuffer,
                fileName: fileName
            }
        });
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)]">
            {/* Header */}
            <header className="h-20 bg-[rgba(253,252,248,0.95)] backdrop-blur-xl border-b border-[var(--template-border)] flex items-center px-8 shadow-sm z-50 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="mr-6 text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] hover:bg-transparent transition-colors"
                >
                    <ArrowLeft size={24} />
                </Button>
                <div className="flex items-center gap-3">
                    <img src="/esign-icon.png" alt="E-Sign" className="w-8 h-8" />
                    <span className="font-['Crimson_Pro'] text-xl font-bold text-[var(--template-primary)]">E-Sign</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6 bg-gray-50/50">
                <div className="max-w-4xl w-full">
                    {!pdfFile ? (
                        <div className="bg-white rounded-3xl shadow-xl border border-[var(--template-border)] p-12 text-center animate-[fadeIn_0.5s_ease-out]">
                            <div className="w-20 h-20 bg-[var(--template-primary)]/5 text-[var(--template-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                                <UploadCloud size={40} />
                            </div>
                            <h1 className="text-3xl font-bold font-['Crimson_Pro'] text-[var(--template-text-primary)] mb-4">
                                Upload a Document to Start
                            </h1>
                            <p className="text-lg text-[var(--template-text-secondary)] mb-10 max-w-md mx-auto">
                                Select a PDF file from your computer. You can choose to sign it yourself or send it to others afterwards.
                            </p>

                            <div className="max-w-xl mx-auto">
                                <PDFUploader
                                    onUpload={handleUpload}
                                    className="border-2 border-dashed border-gray-200 hover:border-[var(--template-primary)] hover:bg-[var(--template-bg-secondary)] transition-all rounded-2xl p-10 cursor-pointer bg-gray-50"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="animate-[slideUp_0.5s_ease-out]">
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-bold font-['Crimson_Pro'] text-[var(--template-text-primary)] mb-2">
                                    What would you like to do?
                                </h1>
                                <div className="flex items-center justify-center gap-2 text-[var(--template-text-secondary)] bg-white py-2 px-4 rounded-full w-fit mx-auto shadow-sm border border-[var(--template-border)]">
                                    <FileText size={16} />
                                    <span className="font-medium">{fileName}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                                {/* Option 1: Sign Yourself */}
                                <button
                                    onClick={() => handleChoice('/self-sign')}
                                    className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-green-50 p-8 rounded-3xl shadow-[var(--template-shadow-sm)] hover:shadow-[var(--template-shadow-lg)] border border-[var(--template-border)] hover:border-[var(--template-primary)] transition-all duration-300 text-left flex flex-col items-start gap-4 hover:-translate-y-1"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <PenTool size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--template-text-primary)] mb-2">Sign Yourself</h3>
                                        <p className="text-[var(--template-text-secondary)] text-sm leading-relaxed">
                                            You are the only signer. Add your signature and download the completed document.
                                        </p>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center text-[var(--template-primary)] font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                                        Get Started <ArrowLeft className="rotate-180 ml-2 w-4 h-4" />
                                    </div>
                                </button>

                                {/* Option 2: Send for Signature */}
                                <button
                                    onClick={() => handleChoice('/compose')}
                                    className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50 p-8 rounded-3xl shadow-[var(--template-shadow-sm)] hover:shadow-[var(--template-shadow-lg)] border border-[var(--template-border)] hover:border-blue-400 transition-all duration-300 text-left flex flex-col items-start gap-4 hover:-translate-y-1"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <Send size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--template-text-primary)] mb-2">Send to Others</h3>
                                        <p className="text-[var(--template-text-secondary)] text-sm leading-relaxed">
                                            Prepare the document with signature fields and email it to recipients.
                                        </p>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                                        Get Started <ArrowLeft className="rotate-180 ml-2 w-4 h-4" />
                                    </div>
                                </button>
                            </div>

                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => setPdfFile(null)}
                                    className="text-[var(--template-text-light)] hover:text-[var(--template-text-primary)] text-sm font-medium underline-offset-4 hover:underline transition-colors"
                                >
                                    Upload a different document
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UnifiedStartPage;
