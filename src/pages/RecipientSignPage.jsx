import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PDFViewer from '../components/PDFViewer';
import SignaturePad from '../components/SignaturePad';
import { embedSignature } from '../utils/pdfUtils';
import { PenTool, CheckCircle, AlertTriangle, ArrowLeft, Loader2, Info, Pencil } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import { Button } from '../components/ui/Button';

const RecipientSignPage = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [envelopeData, setEnvelopeData] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageDimensions, setPageDimensions] = useState(null);

    // Signing state
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
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

    useEffect(() => {
        fetchEnvelope();
    }, [token]);

    const fetchEnvelope = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_envelope_by_token', { token_input: token });

            if (error) throw error;
            if (!data) throw new Error("Envelope not found");

            let envelope = Array.isArray(data) ? data[0] : data;
            setEnvelopeData(envelope);

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

    const handlePageLoad = (page) => {
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

        setSignedFields(prev => ({
            ...prev,
            [activeField.id]: signatureDataURL
        }));
        setIsSignatureModalOpen(false);
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

                currentPdfBuffer = await embedSignature({
                    pdfBuffer: currentPdfBuffer,
                    signatureImage: signatureData,
                    position: { x, y },
                    pageIndex: field.page_number - 1,
                    visualWidth: 600
                });
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
                    <div className="px-4 py-2 bg-[var(--template-bg-secondary)] rounded-lg text-sm text-[var(--template-text-primary)] border border-[var(--template-border)] font-medium shadow-sm">
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
                                        onClick={() => setPageNumber(field.page_number)}
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
                                                <div className={`text-sm font-semibold mb-0.5 transition-colors ${isSigned ? 'text-green-900' : 'text-[var(--template-text-primary)]'}`}>
                                                    Signature Field
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

                                    if (isSigned) {
                                        return (
                                            <div
                                                key={idx}
                                                className="absolute group pointer-events-auto"
                                                style={{ left, top, width: 120, height: 50, zIndex: 20 }}
                                            >
                                                <div className="w-full h-full border border-primary/50 bg-primary/5 p-1 rounded backdrop-blur-sm flex items-center justify-center">
                                                    <img src={signedFields[field.id]} alt="Signature" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveField(field);
                                                        setIsSignatureModalOpen(true);
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-transform hover:scale-105 z-30"
                                                    title="Edit signature"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        )
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setActiveField(field);
                                                setIsSignatureModalOpen(true);
                                            }}
                                            className="absolute bg-primary/10 border-2 border-primary text-primary font-bold py-2 px-4 rounded hover:scale-105 transition-transform hover:bg-primary/20 group pointer-events-auto"
                                            style={{ left, top, width: 120, height: 50, zIndex: 20 }}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <PenTool size={14} />
                                                <span className="text-xs uppercase tracking-wide">Sign</span>
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
                />
            )}

            {isSaving && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-gray-900 font-medium">Finalizing document...</p>
                    </div>
                </div>
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
