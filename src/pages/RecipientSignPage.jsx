import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PDFViewer from '../components/PDFViewer';
import SignaturePad from '../components/SignaturePad';
import { embedSignature, embedText } from '../utils/pdfUtils';
import { PenTool, CheckCircle, AlertTriangle, ArrowLeft, Loader2, Info, Pencil, CheckSquare, Sparkles, X } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import TextInputModal from '../components/TextInputModal';
import { Button } from '../components/ui/Button';
import { secureAiService } from '../services/secureAiService';
import { auditService } from '../services/auditService';
import ReactMarkdown from 'react-markdown';
import Draggable from 'react-draggable';


const RecipientSignPage = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [envelopeData, setEnvelopeData] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageDimensions, setPageDimensions] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const draggableRef = React.useRef(null);

    // Signing state
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const [signedFields, setSignedFields] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "error" });

    // Check for active session even in guest view
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setUserId(session.user.id);
        });
    }, []);

    // Track if we've already logged the view for this session
    const hasLoggedViewRef = React.useRef(false);

    useEffect(() => {
        fetchEnvelope();
        // Reset log ref if token changes (though usually token change means new page load)
        return () => { hasLoggedViewRef.current = false; };
    }, [token]);

    const fetchEnvelope = async () => {
        try {
            setLoading(true);
            // Fetch via backend to ensure we get the full ID and bypass potentially limited/broken RPC
            const apiRes = await fetch(`http://${window.location.hostname}:4242/envelope/${token}`);
            if (!apiRes.ok) throw new Error('Failed to load envelope details');

            const envelope = await apiRes.json();

            setEnvelopeData(envelope);

            // LOG VIEWED - Only if not already logged
            if (envelope && envelope.id && !hasLoggedViewRef.current) {
                console.log("Logging VIEWED event...");
                hasLoggedViewRef.current = true; // Mark as logged immediately
                auditService.logEvent(envelope.id, 'VIEWED', {
                    name: 'Guest Recipient',
                    email: envelope.recipient_email || null
                });
            }

            const { data: fileData, error: fileError } = await supabase.storage
                .from('envelopes')
                .download(envelope.original_pdf_url);

            if (fileError) throw fileError;

            const buffer = await fileData.arrayBuffer();
            setPdfFile(buffer.slice(0));
            setPdfBuffer(buffer.slice(0));

        } catch (err) {
            console.error("Error loading envelope:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (!pdfBuffer) return;

        // If we already have a summary, just show it
        if (aiSummary) {
            setShowSummary(true);
            return;
        }

        setIsSummarizing(true);
        setShowSummary(true); // Open the window so they see the loading state

        try {
            const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
            const summary = await secureAiService.analyzeDocument(blob);
            setAiSummary(summary);
        } catch (err) {
            console.error("AI Summary Error:", err);
            setAlertModal({ isOpen: true, title: "AI Error", message: "Failed to generate summary.", type: "error" });
            setShowSummary(false); // Close on error
        } finally {
            setIsSummarizing(false);
        }
    };

    const handlePageLoad = (page) => {
        // ... same logic ...
        const rotation = page.rotate || page.rotation || 0;
        let validWidth = page.originalWidth || page.width;
        let validHeight = page.originalHeight || page.height;

        if (!validWidth || !validHeight) {
            validWidth = 595;
            validHeight = 842;
        }

        if (rotation === 90 || rotation === 270) {
            const temp = validWidth;
            validWidth = validHeight;
            validHeight = temp;
        }

        const aspectRatio = validWidth / validHeight;
        const renderedHeight = 600 / aspectRatio;
        setPageDimensions({ width: 600, height: renderedHeight });
    };

    const handleSignatureSave = async (signatureDataURL) => {
        if (!activeField) return;
        setSignedFields(prev => ({ ...prev, [activeField.id]: signatureDataURL }));
        setIsSignatureModalOpen(false);
    };

    const handleInputSave = (value) => {
        if (!activeField) return;
        setSignedFields(prev => ({ ...prev, [activeField.id]: value }));
        setIsInputModalOpen(false);
    };

    const handleFieldInteraction = (field) => {
        setActiveField(field);

        switch (field.type) {
            case 'signature':
            case 'initial':
            case 'stamp':
                setIsSignatureModalOpen(true);
                break;
            case 'date':
                // Auto-fill today's date
                const today = new Date().toLocaleDateString();
                setSignedFields(prev => ({ ...prev, [field.id]: today }));
                break;
            case 'checkbox':
                // Toggle 'X' or empty
                setSignedFields(prev => {
                    const current = prev[field.id];
                    return { ...prev, [field.id]: current === 'X' ? '' : 'X' };
                });
                break;
            case 'text':
            case 'name':
            case 'email':
            case 'company':
            case 'title':
            default:
                setIsInputModalOpen(true);
                break;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading document...</span>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">
            <AlertTriangle className="mr-2" /> Error: {error}
        </div>
    );

    if (isComplete) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Signed!</h1>
            <p className="text-gray-600 max-w-md">
                You have successfully signed the document. A copy has been downloaded to your device automatically.
            </p>
        </div>
    );

    const fields = envelopeData.fields || (Array.isArray(envelopeData) ? envelopeData : [envelopeData]);
    const totalFieldsCount = fields.length;
    const completedFieldsCount = Object.keys(signedFields).length;

    const handleFinish = async () => {
        if (!pdfBuffer || !pageDimensions) return;
        setIsSaving(true);

        try {
            let currentPdfBuffer = pdfBuffer.slice(0);

            for (const field of fields) {
                const signatureData = signedFields[field.id];
                if (!signatureData) continue;

                const x = (field.x_pct / 100) * 600;
                const y = (field.y_pct / 100) * pageDimensions.height;
                const width = field.width ? (field.width / 100) * 600 : null;
                const height = field.height ? (field.height / 100) * pageDimensions.height : null;

                if (field.type === 'signature' || field.type === 'initial' || field.type === 'stamp') {
                    currentPdfBuffer = await embedSignature({
                        pdfBuffer: currentPdfBuffer,
                        signatureImage: signatureData,
                        position: { x, y },
                        width,
                        height,
                        pageIndex: field.page_number - 1,
                        visualWidth: 600
                    });
                } else {
                    // Embed Text (Date, Name, etc.)
                    currentPdfBuffer = await embedText({
                        pdfBuffer: currentPdfBuffer,
                        text: signatureData,
                        position: { x, y },
                        width,
                        height,
                        pageIndex: field.page_number - 1,
                        visualWidth: 600,
                        fontSize: height ? Math.max(10, height * 0.5) : 12
                    });
                }
            }

            const blob = new Blob([currentPdfBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signed_document_${token.slice(0, 4)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            const signedFileName = envelopeData.sender_id
                ? `${envelopeData.sender_id}/signed_${token.slice(0, 8)}_${Date.now()}.pdf`
                : `signed_docs/${crypto.randomUUID()}.pdf`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('envelopes')
                .upload(signedFileName, blob, {
                    contentType: 'application/pdf',
                    upsert: false
                });

            if (uploadError) throw new Error("Failed to upload signed document: " + uploadError.message);
            const signedPdfPath = uploadData.path;

            const { error: rpcError } = await supabase.rpc('save_signed_document', {
                token_input: token,
                path: signedPdfPath
            });

            if (rpcError) throw rpcError;

            // LOG COMPLETED
            // Find name/email fields to identify the signer
            const nameField = fields.find(f => f.type === 'name' || (f.type === 'text' && f.label?.toLowerCase().includes('name')));
            const emailField = fields.find(f => f.type === 'email' || (f.type === 'text' && f.label?.toLowerCase().includes('email')));

            const actorName = (nameField && signedFields[nameField.id]) ? signedFields[nameField.id] : 'Guest Recipient';
            const actorEmail = (emailField && signedFields[emailField.id]) ? signedFields[emailField.id] : envelopeData.recipient_email;

            await auditService.logEvent(envelopeData.id, 'COMPLETED', {
                name: actorName,
                email: actorEmail
            });

            setIsComplete(true);
        } catch (err) {
            console.error("Error finishing envelope:", err);
            setAlertModal({ isOpen: true, title: "Error", message: "Failed to finish. " + err.message, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)]">
            {/* Header */}
            <header className="h-20 bg-[rgba(253,252,248,0.95)] backdrop-blur-xl border-b border-[var(--template-border)] flex items-center justify-between px-8 shadow-sm z-30 shrink-0 animate-[slideDown_0.5s_ease-out]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3" title="E-Sign">
                        <img src="/esign-icon.png" alt="E-Sign" className="w-8 h-8" />
                        <span className="font-['Crimson_Pro'] text-xl font-bold text-[var(--template-primary)] max-sm:hidden">E-Sign Guest</span>
                    </div>
                    <div className="h-6 w-[1px] bg-[var(--template-border)] max-sm:hidden"></div>
                    <p className="text-sm text-[var(--template-text-secondary)] font-medium">Document Review</p>
                </div>

                <div className="flex items-center gap-4">

                    <div className="bg-[var(--template-bg-secondary)] rounded-lg text-sm text-[var(--template-text-primary)] border border-[var(--template-border)] font-medium shadow-sm px-4 py-2">
                        {completedFieldsCount} / {totalFieldsCount} Signed
                    </div>
                    <Button
                        onClick={handleFinish}
                        disabled={!isComplete && completedFieldsCount < totalFieldsCount}
                        className={`
                            py-3 px-6 rounded-lg font-semibold shadow-[var(--template-shadow-md)] transition-all
                            ${isComplete || completedFieldsCount >= totalFieldsCount
                                ? 'bg-[var(--template-success)] hover:bg-[#27ae60] text-white hover:shadow-[var(--template-shadow-lg)] hover:-translate-y-0.5'
                                : 'bg-[var(--template-primary)] text-white hover:bg-[var(--template-primary-dark)] opacity-70'}
                        `}
                        isLoading={isSaving}
                    >
                        {isSaving ? 'Finishing...' : 'Finish & Download'}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 bg-white/60 backdrop-blur-md border-r border-[var(--template-border)] flex flex-col shrink-0 overflow-y-auto shadow-[var(--template-shadow-sm)] relative z-20">
                    <div className="p-6 border-b border-[var(--template-border)] bg-[var(--template-bg-secondary)]/30">
                        <h2 className="text-xs font-bold text-[var(--template-primary)] uppercase tracking-widest font-['Crimson_Pro'] mb-3">Document Summary</h2>

                        <div className="space-y-4">
                            {/* AI Summary Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] uppercase tracking-wider text-[var(--template-text-light)] font-bold">Content Summary</label>
                                    <button
                                        onClick={handleSummarize}
                                        className="text-[10px] flex items-center gap-1 text-[var(--template-primary)] hover:underline font-bold bg-[var(--template-primary)]/5 hover:bg-[var(--template-primary)]/10 px-2 py-1 rounded-full transition-colors"
                                    >
                                        <Sparkles size={10} /> {aiSummary ? 'Show Summary' : 'AI Summarize'}
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--template-text-light)] italic">
                                    Click to view a concise summary of this document.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-b border-[var(--template-border)]">
                        <h2 className="text-xs font-bold text-[var(--template-primary)] uppercase tracking-widest font-['Crimson_Pro']">Required Fields</h2>
                        <p className="text-xs text-[var(--template-text-light)] mt-2">Click a field below to jump to it.</p>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                        {fields.length > 0 ? (
                            fields.map((field, idx) => {
                                const isSigned = !!signedFields[field.id];
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setPageNumber(field.page_number);
                                            // Optional: highlight field or scroll to it
                                        }}
                                        className={`
                                            group w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden
                                            ${isSigned
                                                ? 'bg-green-50/50 border-green-200 hover:border-green-300'
                                                : 'bg-white border-[var(--template-border)] hover:border-[var(--template-primary)] hover:shadow-md hover:-translate-y-0.5'}
                                        `}
                                    >
                                        <div className="flex items-start gap-4 z-10 relative">
                                            <div className={`
                                                mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors
                                                ${isSigned
                                                    ? 'bg-[var(--template-success)] border-[var(--template-success)] text-white'
                                                    : 'bg-[var(--template-bg-secondary)] border-[var(--template-border)] text-[var(--template-text-light)] group-hover:border-[var(--template-primary)] group-hover:text-[var(--template-primary)]'}
                                            `}>
                                                {isSigned ? <CheckCircle size={14} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-semibold mb-0.5 transition-colors ${isSigned ? 'text-green-900' : 'text-[var(--template-text-primary)]'} truncate`}>
                                                    {field.label || field.type || 'Field'}
                                                </div>
                                                <div className="text-xs text-[var(--template-text-light)]">Page {field.page_number}</div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        ) : (
                            <div className="p-8 text-center text-[var(--template-text-light)] bg-[var(--template-bg-secondary)] rounded-xl border border-dashed border-[var(--template-border)]">
                                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No fields found</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Canvas */}
                <main className="flex-1 bg-gray-100 overflow-auto flex justify-center p-8 relative">
                    <div className="relative h-fit my-auto shadow-xl ring-1 ring-black/5 bg-white">
                        {pdfFile && (
                            <PDFViewer
                                pdfFile={pdfFile}
                                pageNumber={pageNumber}
                                onPageChange={setPageNumber}
                                onPageLoad={handlePageLoad}
                            >
                                {pageDimensions && fields.map((field, idx) => {
                                    if (field.page_number !== pageNumber) return null;
                                    const isSigned = !!signedFields[field.id];
                                    const left = (field.x_pct / 100) * 600;
                                    const top = (field.y_pct / 100) * pageDimensions.height;

                                    // Determine styles based on type
                                    const getStyle = () => {
                                        switch (field.type) {
                                            case 'signature':
                                            case 'initial':
                                            case 'stamp':
                                                return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400', label: field.type === 'initial' ? 'Initial' : 'Sign' };
                                            case 'date':
                                                return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: 'Date' };
                                            case 'checkbox':
                                                return { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-400', label: '' };
                                            case 'text':
                                                return { bg: 'bg-white', text: 'text-blue-800', border: 'border-blue-300', label: 'Text' };
                                            default: // User info
                                                return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: field.label || field.type };
                                        }
                                    };

                                    const style = getStyle();
                                    const boxWidth = field.width ? (field.width / 100) * 600 : (field.type === 'checkbox' ? 40 : 120);
                                    const boxHeight = field.height ? (field.height / 100) * pageDimensions.height : (field.type === 'checkbox' ? 40 : 50);

                                    if (isSigned) {
                                        return (
                                            <div
                                                key={idx}
                                                className="absolute group pointer-events-auto"
                                                style={{ left, top, width: boxWidth, height: boxHeight, zIndex: 20 }}
                                            >
                                                <div className={`w-full h-full border ${style.border} ${style.bg} p-1 rounded backdrop-blur-sm flex items-center justify-center`}>
                                                    {/* For now, we assume everything saves as an image or text. If image, render img. If text, render text. */}
                                                    {field.type === 'signature' || field.type === 'initial' || field.type === 'stamp' ? (
                                                        <img src={signedFields[field.id]} alt="Signature" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                                    ) : (
                                                        <span className={`font-medium ${style.text}`}>{signedFields[field.id]}</span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFieldInteraction(field);
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-transform hover:scale-105 z-30"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        )
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleFieldInteraction(field)}
                                            className={`absolute ${style.bg} border-2 ${style.border} ${style.text} font-bold py-2 px-2 rounded hover:scale-105 transition-transform group pointer-events-auto flex items-center justify-center`}
                                            style={{ left, top, width: boxWidth, height: boxHeight, zIndex: 20 }}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                {field.type !== 'checkbox' && <PenTool size={14} />}
                                                <span className="text-xs uppercase tracking-wide truncate">{field.label || style.label}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </PDFViewer>
                        )}
                    </div>
                </main>
            </div>

            {isSignatureModalOpen && (
                <SignaturePad
                    onSave={handleSignatureSave}
                    onCancel={() => setIsSignatureModalOpen(false)}
                    onWarning={(msg) => setAlertModal({ isOpen: true, title: "Drawing Required", message: msg, type: "info" })}
                    userId={userId}
                    initialCategory={
                        activeField?.type === 'initial' ? 'Initial' :
                            activeField?.type === 'stamp' ? 'Stamp' :
                                'Signature'
                    }
                />
            )}

            <TextInputModal
                isOpen={isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                onSave={handleInputSave}
                label={activeField?.label || activeField?.type}
                initialValue={activeField ? signedFields[activeField.id] : ''}
            />

            {isSaving && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-gray-900 font-medium">Finalizing document...</p>
                    </div>
                </div>
            )}
            {/* Floating AI Summary Window */}
            {showSummary && (
                <Draggable bounds="parent" handle=".handle" nodeRef={draggableRef}>
                    <div ref={draggableRef} className="absolute top-20 right-20 z-50 w-80 bg-white/90 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5 animate-[scaleIn_0.2s_ease-out]">
                        {/* Window Header */}
                        <div className="handle flex items-center justify-between p-4 border-b border-black/5 cursor-move active:cursor-grabbing">
                            <div className="flex items-center gap-2 text-[var(--template-primary)] font-bold font-['Crimson_Pro'] uppercase tracking-widest text-xs">
                                <Sparkles size={14} />
                                <span>AI Summary</span>
                            </div>
                            <button
                                onClick={() => setShowSummary(false)}
                                className="text-[var(--template-text-light)] hover:text-[var(--template-text-primary)] hover:bg-black/5 rounded-full p-1 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Window Content */}
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {isSummarizing ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3 text-[var(--template-text-light)] animate-pulse">
                                    <Sparkles size={24} className="text-[var(--template-primary)]" />
                                    <span className="text-xs">Analyzing document...</span>
                                </div>
                            ) : (
                                <div className="text-sm text-[var(--template-text-secondary)] leading-relaxed prose prose-sm prose-p:my-2 prose-headings:my-2 prose-strong:text-[var(--template-primary-dark)]">
                                    <ReactMarkdown>
                                        {aiSummary}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Window Footer */}
                        {!isSummarizing && aiSummary && (
                            <div className="p-3 bg-[var(--template-bg-secondary)]/50 border-t border-black/5 rounded-b-xl flex justify-end">
                                <button
                                    onClick={handleSummarize}
                                    className="text-[10px] text-[var(--template-text-light)] hover:text-[var(--template-primary)] flex items-center gap-1 transition-colors"
                                >
                                    <Sparkles size={10} /> Regenerate
                                </button>
                            </div>
                        )}
                    </div>
                </Draggable>
            )}

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div>
    );
};

export default RecipientSignPage;
