import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PDFUploader from '../components/PDFUploader';
import PDFViewer from '../components/PDFViewer';
import DraggablePlaceholder from '../components/DraggablePlaceholder';
import { PenTool, Send, Link as LinkIcon, AlertCircle, CheckCircle, ArrowLeft, Loader2, Copy, StickyNote, Plus, Trash2, UploadCloud } from 'lucide-react';
import SuccessModal from '../components/SuccessModal';
import EmailModal from '../components/EmailModal';
import ConfirmationModal from '../components/ConfirmationModal';
import AlertModal from '../components/AlertModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import emailjs from '@emailjs/browser';

const ComposePage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Edit Mode State
    const [editingEnvelope, setEditingEnvelope] = useState(null);
    const [pendingFields, setPendingFields] = useState(null);
    const [envelopeName, setEnvelopeName] = useState("Untitled Envelope");

    // ... existing state
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageDimensions, setPageDimensions] = useState(null);

    // Array for multiple fields: { id, x, y, page }
    const [fields, setFields] = useState([]);

    const [isSending, setIsSending] = useState(false);
    const [generatedLink, setGeneratedLink] = useState(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: () => { } });
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "error" });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (location.state?.envelope) {
            initializeEditMode(location.state.envelope);
        }
    }, [location.state]);

    // Hydrate fields when dimensions AND pending fields are ready
    useEffect(() => {
        if (pageDimensions && pendingFields && pendingFields.length > 0) {
            console.log("Hydrating fields:", pendingFields);
            const hydratedFields = pendingFields.map(pf => ({
                id: pf.id || crypto.randomUUID(),
                page: pf.page_number,
                x: (pf.x_pct / 100) * pageDimensions.width,
                y: (pf.y_pct / 100) * pageDimensions.height
            }));

            setFields(hydratedFields);
            setPendingFields(null);
        }
    }, [pageDimensions, pendingFields]);

    const initializeEditMode = async (envelope) => {
        setEditingEnvelope(envelope);
        setEnvelopeName(envelope.name || "Untitled Envelope");
        setGeneratedLink(`${window.location.origin}/sign/${envelope.access_token}`);

        try {
            const { data: fileData, error: fileError } = await supabase.storage
                .from('envelopes')
                .download(envelope.original_pdf_url);

            if (fileError) throw fileError;
            const buffer = await fileData.arrayBuffer();
            setPdfFile(buffer.slice(0));
            setPdfBuffer(buffer.slice(0));

            const { data: fieldsData, error: fieldsError } = await supabase
                .from('fields')
                .select('*')
                .eq('envelope_id', envelope.id);

            if (fieldsError) throw fieldsError;

            setPendingFields(fieldsData);

        } catch (err) {
            console.error("Error initializing edit mode:", err);
            setError("Failed to load envelope for editing.");
        }
    };

    const handleUpload = (buffer, filename) => {
        setPdfFile(buffer.slice(0));
        setPdfBuffer(buffer.slice(0));
        setPageNumber(1);
        setFields([]);
        setGeneratedLink(null);
        setError(null);
        setEditingEnvelope(null);
        const nameWithoutExt = filename ? filename.replace(/\.pdf$/i, "") : "Untitled Envelope";
        setEnvelopeName(nameWithoutExt);
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

        const newDims = { width: 600, height: renderedHeight };
        setPageDimensions(newDims);

        if (pendingFields && pendingFields.length > 0) {
            const hydratedFields = pendingFields.map(pf => ({
                id: pf.id || crypto.randomUUID(),
                page: pf.page_number,
                x: (pf.x_pct / 100) * 600,
                y: (pf.y_pct / 100) * renderedHeight
            }));
            setFields(hydratedFields);
            setPendingFields(null);
        }
    };

    const addField = () => {
        const newField = {
            id: crypto.randomUUID(),
            x: 50,
            y: 50,
            page: pageNumber
        };
        setFields([...fields, newField]);
    };

    const updateFieldPosition = (id, newPos) => {
        setFields(fields.map(f => f.id === id ? { ...f, x: newPos.x, y: newPos.y } : f));
    };

    const removeField = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Field",
            message: "Remove this signature box?",
            onConfirm: () => {
                setFields(prev => prev.filter(f => f.id !== id));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const clearAllFields = () => {
        setConfirmModal({
            isOpen: true,
            title: "Clear All",
            message: "Clear all signature fields?",
            onConfirm: () => {
                setFields([]);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSend = async () => {
        if (!pdfBuffer || fields.length === 0) return;
        setIsSending(true);
        setError(null);

        try {
            if (editingEnvelope) {
                const envelopeId = editingEnvelope.id;

                const { error: deleteError } = await supabase
                    .from('fields')
                    .delete()
                    .eq('envelope_id', envelopeId);

                if (deleteError) throw deleteError;

                if (!pageDimensions) throw new Error("Page dimensions not loaded");

                const fieldsToInsert = fields.map(f => ({
                    envelope_id: envelopeId,
                    page_number: f.page,
                    x_pct: (f.x / pageDimensions.width) * 100,
                    y_pct: (f.y / pageDimensions.height) * 100
                }));

                const { error: insertError } = await supabase
                    .from('fields')
                    .insert(fieldsToInsert);

                if (insertError) throw insertError;

                setIsSuccessModalOpen(true);

            } else {
                const fileName = `${crypto.randomUUID()}.pdf`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('envelopes')
                    .upload(fileName, pdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: false
                    });

                if (uploadError) throw uploadError;
                const pdfPath = uploadData.path;

                const accessToken = crypto.randomUUID();
                const { data: envelopeData, error: envelopeError } = await supabase
                    .from('envelopes')
                    .insert([
                        {
                            original_pdf_url: pdfPath,
                            access_token: accessToken,
                            status: 'pending',
                            sender_id: (await supabase.auth.getUser()).data.user?.id,
                            name: envelopeName
                        }
                    ])
                    .select()
                    .single();

                if (envelopeError) throw envelopeError;

                if (!pageDimensions) throw new Error("Page dimensions not loaded");

                const fieldsToInsert = fields.map(f => ({
                    envelope_id: envelopeData.id,
                    page_number: f.page,
                    x_pct: (f.x / pageDimensions.width) * 100,
                    y_pct: (f.y / pageDimensions.height) * 100
                }));

                const { error: fieldsError } = await supabase
                    .from('fields')
                    .insert(fieldsToInsert);

                if (fieldsError) throw fieldsError;

                setGeneratedLink(`${window.location.origin}/sign/${accessToken}`);
            }

        } catch (err) {
            console.error(err);
            console.error(err);
            setAlertModal({ isOpen: true, title: "Error", message: err.message || "Failed to save envelope", type: "error" });
            setError(err.message || "Failed to save envelope");
        } finally {
            setIsSending(false);
        }
    };

    const handleSendEmail = async (recipientEmail, customMessage) => {
        try {
            if (!generatedLink) {
                setAlertModal({ isOpen: true, title: "Error", message: "No link generated yet.", type: "error" });
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            const senderEmail = user?.email || 'someone';

            const templateParams = {
                to_email: recipientEmail,
                from_email: senderEmail,
                link: generatedLink,
                message: customMessage
            };

            await emailjs.send(
                'service_3l72yzv',
                'template_dupsafc',
                templateParams,
                'YAzn6fbluRSwQnvsG'
            );

            setIsEmailModalOpen(false);
            setIsSuccessModalOpen(true);
        } catch (err) {
            console.error("Error sending email:", err);
            setAlertModal({ isOpen: true, title: "Email Failed", message: "Failed to send email.", type: "error" });
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)]">
            {/* Header */}
            <header className="h-20 bg-[rgba(253,252,248,0.95)] backdrop-blur-xl border-b border-[var(--template-border)] flex items-center justify-between px-8 shadow-sm z-50 shrink-0 animate-[slideDown_0.5s_ease-out]">
                <div className="flex items-center gap-6 flex-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.history.back()}
                        title="Back to Dashboard"
                        className="text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] hover:bg-transparent transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="h-8 w-[1px] bg-[var(--template-border)]"></div>

                    <div className="flex items-center gap-3" title="E-Sign">
                        <img src="/esign-icon.png" alt="E-Sign" className="w-8 h-8" />
                        <span className="font-['Crimson_Pro'] text-xl font-bold text-[var(--template-primary)] hidden sm:block">E-Sign</span>
                    </div>

                    <div className="flex-1 max-w-lg ml-6">
                        <div className="flex items-center gap-2 group">
                            <StickyNote className="w-5 h-5 text-[var(--template-primary)] opacity-50 group-hover:opacity-100 transition-opacity" />
                            <input
                                value={envelopeName}
                                onChange={(e) => setEnvelopeName(e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-[var(--template-border)] focus:border-[var(--template-primary)] focus:outline-none text-lg font-semibold text-[var(--template-text-primary)] placeholder-[var(--template-text-light)] w-full px-2 py-1 transition-all"
                                placeholder="Name your document..."
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 bg-white/60 backdrop-blur-md border-r border-[var(--template-border)] flex flex-col shrink-0 relative z-40 shadow-[var(--template-shadow-sm)]">
                    <div className="p-6 border-b border-[var(--template-border)]">
                        <h2 className="text-xs font-bold text-[var(--template-primary)] uppercase tracking-widest font-['Crimson_Pro']">Preparation Tools</h2>
                        <p className="text-xs text-[var(--template-text-light)] mt-2">Setup your document for signing.</p>
                    </div>

                    <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
                        {!pdfFile ? (
                            <div className="text-center animate-[fadeIn_0.5s_ease-out]">
                                <div className="p-8 border-2 border-dashed border-[var(--template-border)] rounded-2xl bg-[var(--template-bg-secondary)] mb-6 hover:border-[var(--template-primary)] transition-colors group">
                                    <div className="w-14 h-14 bg-[var(--template-primary)]/10 text-[var(--template-primary)] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={28} />
                                    </div>
                                    <h3 className="text-base font-semibold text-[var(--template-text-primary)] mb-1">Upload PDF</h3>
                                    <p className="text-sm text-[var(--template-text-light)] mb-6">Upload a document to prepare.</p>
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
                                        <PenTool size={14} /> Signature Fields
                                    </h3>

                                    <div className="flex gap-3 mb-3">
                                        <Button
                                            onClick={addField}
                                            className="w-full justify-center bg-white border border-[var(--template-border)] text-[var(--template-text-primary)] hover:border-[var(--template-primary)] hover:text-[var(--template-primary)] hover:bg-[var(--template-bg-secondary)] shadow-sm transition-all py-5"
                                        >
                                            <Plus size={18} className="mr-2" />
                                            Add Box
                                        </Button>
                                        <Button
                                            onClick={clearAllFields}
                                            variant="ghost"
                                            size="icon"
                                            disabled={fields.length === 0}
                                            title="Clear All"
                                            className="h-auto w-12 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 size={20} />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-[var(--template-text-light)] italic flex items-center gap-1.5 px-1">
                                        <AlertCircle size={12} />
                                        Double-click a box to remove it.
                                    </p>
                                </div>

                                <div className="pt-8 border-t border-[var(--template-border)]">
                                    <h3 className="text-xs font-bold text-[var(--template-text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Send size={14} /> Actions
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        {(!generatedLink || editingEnvelope) ? (
                                            <Button
                                                onClick={handleSend}
                                                disabled={fields.length === 0 || isSending}
                                                isLoading={isSending}
                                                className="w-full bg-[var(--template-primary)] text-white hover:bg-[var(--template-primary-dark)] shadow-[var(--template-shadow-md)] hover:shadow-[var(--template-shadow-lg)] hover:-translate-y-0.5 transition-all py-6 rounded-xl text-base font-semibold"
                                            >
                                                {isSending ? (editingEnvelope ? 'Saving...' : 'Sending...') : (
                                                    <>
                                                        {editingEnvelope ? <CheckCircle size={18} className="mr-2" /> : <LinkIcon size={18} className="mr-2" />}
                                                        {editingEnvelope ? 'Save Changes' : 'Generate Link'}
                                                    </>
                                                )}
                                            </Button>
                                        ) : null}

                                        {generatedLink && (
                                            <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                                                {!editingEnvelope && (
                                                    <div className="bg-green-50 px-4 py-3 rounded-xl border border-green-100 text-green-700 text-sm flex items-center gap-2 shadow-sm">
                                                        <CheckCircle size={18} className="shrink-0" />
                                                        <span className="font-medium">Link Ready!</span>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <Input
                                                        readOnly
                                                        value={generatedLink}
                                                        className="text-xs h-10 bg-white border-[var(--template-border)] focus:border-[var(--template-primary)] text-[var(--template-text-secondary)]"
                                                    />
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={() => navigator.clipboard.writeText(generatedLink)}
                                                        title="Copy Link"
                                                        className="h-10 w-10 shrink-0 bg-white border border-[var(--template-border)] hover:border-[var(--template-primary)] hover:text-[var(--template-primary)]"
                                                    >
                                                        <Copy size={16} />
                                                    </Button>
                                                </div>
                                                <Button
                                                    onClick={() => setIsEmailModalOpen(true)}
                                                    className="w-full bg-[var(--template-primary)] text-white hover:bg-[var(--template-primary-dark)] shadow-[var(--template-shadow-sm)] py-5 rounded-xl font-medium"
                                                >
                                                    <Send size={16} className="mr-2" />
                                                    Send via Email
                                                </Button>
                                            </div>
                                        )}
                                    </div>
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
                                {fields.map(field => {
                                    if (field.page !== pageNumber) return null;
                                    return (
                                        <div key={field.id} onDoubleClick={() => removeField(field.id)}>
                                            <DraggablePlaceholder
                                                initialPosition={{ x: field.x, y: field.y }}
                                                onPositionChange={(pos) => updateFieldPosition(field.id, pos)}
                                                containerDimensions={pageDimensions}
                                            />
                                        </div>
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

            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSend={handleSendEmail}
                defaultMessage="Please review and sign this document."
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title={editingEnvelope ? "Changes Saved" : "Email Sent"}
                message={editingEnvelope
                    ? "Your changes have been saved. The existing link matches the new version."
                    : "The document link has been sent to the recipient successfully."}
            />

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
        </div>
    );
};

export default ComposePage;