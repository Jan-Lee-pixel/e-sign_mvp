import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import PDFUploader from '../components/PDFUploader';
import PDFViewer from '../components/PDFViewer';
import DraggablePlaceholder from '../components/DraggablePlaceholder';
import { PenTool, Send, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import EmailModal from '../components/EmailModal';
import emailjs from '@emailjs/browser';

const ComposePage = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageDimensions, setPageDimensions] = useState(null);
    const [fieldPosition, setFieldPosition] = useState(null); // { x, y } in pixels
    const [isSending, setIsSending] = useState(false);
    const [generatedLink, setGeneratedLink] = useState(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [error, setError] = useState(null);

    const handleUpload = (buffer) => {
        setPdfFile(buffer);
        setPdfBuffer(buffer.slice(0));
        setPageNumber(1);
        setFieldPosition(null);
        setGeneratedLink(null);
        setError(null);
    };

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

    const handleSend = async () => {
        if (!pdfBuffer || !fieldPosition) return;
        setIsSending(true);
        setError(null);

        try {
            // 1. Upload PDF to Supabase Storage
            const fileName = `${crypto.randomUUID()}.pdf`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('envelopes')
                .upload(fileName, pdfBuffer, {
                    contentType: 'application/pdf',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const pdfPath = uploadData.path;

            // 2. Insert into envelopes
            const accessToken = crypto.randomUUID();
            const { data: envelopeData, error: envelopeError } = await supabase
                .from('envelopes')
                .insert([
                    {
                        original_pdf_url: pdfPath,
                        access_token: accessToken,
                        status: 'sent',
                        sender_id: (await supabase.auth.getUser()).data.user?.id
                    }
                ])
                .select()
                .single();

            if (envelopeError) throw envelopeError;

            // 3. Insert into fields
            if (!pageDimensions) throw new Error("Page dimensions not loaded");

            const xPct = (fieldPosition.x / pageDimensions.width) * 100;
            const yPct = (fieldPosition.y / pageDimensions.height) * 100;

            const { error: fieldsError } = await supabase
                .from('fields')
                .insert([
                    {
                        envelope_id: envelopeData.id,
                        page_number: pageNumber,
                        x_pct: xPct,
                        y_pct: yPct
                    }
                ]);

            if (fieldsError) throw fieldsError;

            setGeneratedLink(`${window.location.origin}/sign/${accessToken}`);

        } catch (err) {
            console.error(err); y
            setError(err.message || "Failed to send envelope");
        } finally {
            setIsSending(false);
        }
    };

    // --- REPLACED: NEW EMAILJS LOGIC ---
    const handleSendEmail = async (recipientEmail, customMessage) => {
        try {
            if (!generatedLink) {
                alert("Error: No link generated yet. Please click 'Generate Link' first.");
                return;
            }

            // Maps to the variables in your EmailJS Template
            const templateParams = {
                to_email: recipientEmail,  // Make sure template uses {{to_email}}
                link: generatedLink,       // Make sure template uses {{link}}
                message: customMessage     // Make sure template uses {{message}}
            };

            await emailjs.send(
                'service_3l72yzv',   // <--- PASTE SERVICE ID HERE (e.g. service_xyz)
                'template_dupsafc',  // <--- PASTE TEMPLATE ID HERE (e.g. template_abc)
                templateParams,
                'YAzn6fbluRSwQnvsG'    // <--- PASTE PUBLIC KEY HERE (e.g. user_123)
            );

            alert("Email sent successfully!");
            setIsEmailModalOpen(false); // Close the modal
        } catch (err) {
            console.error("Error sending email:", err);
            alert("Failed to send email. Check console for details.");
        }
    };

    return (
        <div className="min-h-screen bg-[#ededed] flex flex-col fade-in">
            <header className="win7-taskbar">
                <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                    <h1 className="text-white font-semibold text-lg flex items-center gap-2">
                        <PenTool className="w-5 h-5" />
                        QuickSign - Compose
                    </h1>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-6 flex justify-center">
                {!pdfFile ? (
                    <div className="w-full max-w-2xl mt-12">
                        <div className="win7-window-container">
                            <div className="win7-window-title">New Envelope</div>
                            <div className="p-8">
                                <PDFUploader onUpload={handleUpload} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-6 w-full max-w-6xl items-start">
                        {/* Left: PDF Viewer */}
                        <div className="flex-grow">
                            <div className="win7-window-container">
                                <div className="win7-window-title">Document Preview</div>
                                <div className="p-4 bg-gray-100 min-h-[600px] flex justify-center">
                                    <PDFViewer
                                        pdfFile={pdfFile}
                                        pageNumber={pageNumber}
                                        onPageChange={setPageNumber}
                                        onPageLoad={handlePageLoad}
                                    >
                                        {fieldPosition && (
                                            <DraggablePlaceholder
                                                initialPosition={fieldPosition}
                                                onPositionChange={(pos) => setFieldPosition(pos)}
                                            />
                                        )}
                                    </PDFViewer>
                                </div>
                            </div>
                        </div>

                        {/* Right: Tools & Actions */}
                        <div className="w-80 flex flex-col gap-4">
                            <div className="win7-window-container">
                                <div className="win7-window-title">Tools</div>
                                <div className="p-4 flex flex-col gap-3">
                                    <p className="text-sm text-gray-600 mb-2">Drag fields onto the document.</p>

                                    <button
                                        onClick={() => setFieldPosition({ x: 50, y: 50 })}
                                        disabled={!!fieldPosition}
                                        className="win7-button px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 justify-center w-full disabled:opacity-50"
                                    >
                                        <PenTool size={16} />
                                        Add Signature Box
                                    </button>

                                    {fieldPosition && (
                                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800 flex items-start gap-2">
                                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                            <span>Position the box where you want the recipient to sign.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="win7-window-container">
                                <div className="win7-window-title">Actions</div>
                                <div className="p-4 flex flex-col gap-3">
                                    {!generatedLink ? (
                                        <button
                                            onClick={handleSend}
                                            disabled={!fieldPosition || isSending}
                                            className="win7-button-primary px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 justify-center w-full disabled:opacity-50"
                                        >
                                            {isSending ? (
                                                <span>Sending...</span>
                                            ) : (
                                                <>
                                                    <LinkIcon size={16} />
                                                    Generate Link
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="bg-green-50 border border-green-200 p-3 rounded text-green-800 flex items-center gap-2">
                                                <CheckCircle size={16} />
                                                <span className="font-semibold text-sm">Ready to send!</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-semibold text-gray-500">Signing Link</label>
                                                <div className="flex gap-1">
                                                    <input
                                                        readOnly
                                                        value={generatedLink}
                                                        className="flex-grow border rounded px-2 py-1 text-sm bg-gray-50 text-gray-600"
                                                    />
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(generatedLink)}
                                                        className="win7-button px-2 py-1 rounded"
                                                        title="Copy"
                                                    >
                                                        <LinkIcon size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsEmailModalOpen(true)}
                                                className="win7-button-primary px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 justify-center w-full shadow-md"
                                            >
                                                <Send size={16} />
                                                Send for Signature
                                            </button>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-800">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSend={handleSendEmail}
                defaultMessage="Please review and sign this document."
            />
        </div>
    );
};

export default ComposePage;