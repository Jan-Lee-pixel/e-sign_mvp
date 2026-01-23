import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PDFUploader from '../components/PDFUploader';
import PDFViewer from '../components/PDFViewer';
import DraggablePlaceholder from '../components/DraggablePlaceholder';
import { PenTool, Send, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import SuccessModal from '../components/SuccessModal';
import EmailModal from '../components/EmailModal';
import ConfirmationModal from '../components/ConfirmationModal';
import AlertModal from '../components/AlertModal';
import emailjs from '@emailjs/browser';

const ComposePage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Edit Mode State
    const [editingEnvelope, setEditingEnvelope] = useState(null);
    const [pendingFields, setPendingFields] = useState(null); // Fields waiting for PDF dimensions
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
            setPendingFields(null); // Clear to prevent re-hydration
        }
    }, [pageDimensions, pendingFields]);

    const initializeEditMode = async (envelope) => {
        setEditingEnvelope(envelope);
        setEnvelopeName(envelope.name || "Untitled Envelope");
        setGeneratedLink(`${window.location.origin}/sign/${envelope.access_token}`); // Pre-fill link

        try {
            // 1. Fetch original PDF
            const { data: fileData, error: fileError } = await supabase.storage
                .from('envelopes')
                .download(envelope.original_pdf_url);

            if (fileError) throw fileError;
            const buffer = await fileData.arrayBuffer();
            setPdfFile(buffer.slice(0));
            setPdfBuffer(buffer.slice(0));

            // 2. Fetch Fields
            const { data: fieldsData, error: fieldsError } = await supabase
                .from('fields')
                .select('*')
                .eq('envelope_id', envelope.id);

            if (fieldsError) throw fieldsError;

            // Store fields to be hydrated when page dimensions are known
            setPendingFields(fieldsData);

        } catch (err) {
            console.error("Error initializing edit mode:", err);
            setError("Failed to load envelope for editing.");
        }
    };

    const handleUpload = (buffer, filename) => {
        // Clone for separate usage
        setPdfFile(buffer.slice(0));
        setPdfBuffer(buffer.slice(0));
        setPageNumber(1);
        setFields([]);
        setGeneratedLink(null);
        setError(null);
        setEditingEnvelope(null); // Reset edit mode on new upload
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

        // Hydrate fields if pending
        if (pendingFields && pendingFields.length > 0) {
            const hydratedFields = pendingFields.map(pf => ({
                id: pf.id || crypto.randomUUID(), // Ensure ID
                page: pf.page_number,
                x: (pf.x_pct / 100) * 600,
                y: (pf.y_pct / 100) * renderedHeight
            }));

            // Only add fields that haven't been added yet (simple check) or just replace?
            // Since we load PDF once, just setting fields is fine.
            // But we need to handle pagination if multi-page. 
            // Currently pendingFields has ALL fields. We should set them all.
            setFields(hydratedFields);
            setPendingFields(null); // clear
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
                // UPDATE EXISTING ENVELOPE
                const envelopeId = editingEnvelope.id;

                // 1. Delete old fields
                const { error: deleteError } = await supabase
                    .from('fields')
                    .delete()
                    .eq('envelope_id', envelopeId);

                if (deleteError) throw deleteError;

                // 2. Insert new fields
                if (!pageDimensions) throw new Error("Page dimensions not loaded");

                const fieldsToInsert = fields.map(f => ({
                    envelope_id: envelopeId,
                    page_number: f.page,
                    x_pct: (f.x / pageDimensions.width) * 100,
                    y_pct: (f.y / pageDimensions.height) * 100
                    // created_at will be now
                }));

                const { error: insertError } = await supabase
                    .from('fields')
                    .insert(fieldsToInsert);

                if (insertError) throw insertError;

                setIsSuccessModalOpen(true); // Re-use success modal? Or just toast?
                // Maybe change SuccessModal title to "Changes Saved"

            } else {
                // CREATE NEW ENVELOPE (Existing logic)
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
                            status: 'pending', // Default to pending
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

            const templateParams = {
                to_email: recipientEmail,
                link: generatedLink,
                message: customMessage
            };

            await emailjs.send(
                'service_3l72yzv',
                'template_dupsafc',
                templateParams,
                'YAzn6fbluRSwQnvsG'
            );

            // alert("Email sent successfully!");
            setIsEmailModalOpen(false);
            setIsSuccessModalOpen(true); // Show success modal
        } catch (err) {
            console.error("Error sending email:", err);
            setAlertModal({ isOpen: true, title: "Email Failed", message: "Failed to send email.", type: "error" });
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#ededed] font-segoe">
            {/* Header */}
            <header className="h-16 bg-[#1853db] text-white flex items-center justify-between px-4 shadow-md z-50 shrink-0 win7-aero-glass">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={() => window.history.back()}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Back to Dashboard"
                    >
                        <div className="w-6 h-6 flex items-center justify-center font-bold text-xl">←</div>
                    </button>
                    <div className="flex-1 max-w-lg">
                        <div className="flex items-center gap-2">
                            <PenTool className="w-5 h-5 opacity-80" />
                            <input
                                value={envelopeName}
                                onChange={(e) => setEnvelopeName(e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-blue-300 focus:border-white focus:outline-none text-lg font-semibold text-white placeholder-blue-200 w-full"
                                placeholder="Name your document..."
                            />
                        </div>
                        <p className="text-xs text-blue-100 opacity-80 pl-7">Prepare Envelope</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 bg-[#f0f0f0] border-r border-[#999999] flex flex-col shrink-0 relative z-40">
                    <div className="p-4 bg-gradient-to-b from-white to-[#e6e6e6] border-b border-[#b5b5b5]">
                        <h2 className="text-[#1e395b] font-bold text-sm">Tools</h2>
                    </div>

                    <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
                        {!pdfFile ? (
                            <div className="win7-window-container bg-white p-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-2">Step 1: Upload</h3>
                                <div className="p-2 border border-dashed border-gray-400 bg-gray-50 rounded">
                                    <PDFUploader
                                        onUpload={handleUpload}
                                        onError={(msg) => setAlertModal({ isOpen: true, title: "Upload Error", message: msg, type: "error" })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="win7-window-container bg-white p-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Signature Fields</h3>
                                    <p className="text-xs text-gray-500 mb-3">Add boxes where the recipient should sign.</p>

                                    <div className="flex gap-2 mb-2">
                                        <button
                                            onClick={addField}
                                            className="flex-1 py-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
                                        >
                                            <PenTool size={14} />
                                            Add Box
                                        </button>
                                        <button
                                            onClick={clearAllFields}
                                            disabled={fields.length === 0}
                                            className="px-3 py-2 bg-red-100 border border-red-300 text-red-800 rounded hover:bg-red-200 transition-colors flex items-center justify-center disabled:opacity-50"
                                            title="Clear All"
                                        >
                                            <span className="text-xs font-bold">×</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 italic">Double-click a box on canvas to remove it.</p>
                                </div>

                                <div className="win7-window-container bg-white p-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Actions</h3>
                                    <div className="flex flex-col gap-3">
                                        {(!generatedLink || editingEnvelope) ? (
                                            <button
                                                onClick={handleSend}
                                                disabled={fields.length === 0 || isSending}
                                                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-green-600"
                                            >
                                                {isSending ? (editingEnvelope ? 'Saving...' : 'Sending...') : (
                                                    <>
                                                        {editingEnvelope ? <CheckCircle size={16} /> : <LinkIcon size={16} />}
                                                        {editingEnvelope ? 'Save Changes' : 'Generate Link'}
                                                    </>
                                                )}
                                            </button>
                                        ) : null}

                                        {generatedLink && (
                                            <>
                                                {!editingEnvelope && (
                                                    <div className="bg-green-500/20 px-3 py-2 rounded text-sm border border-green-400/30 text-green-800 flex items-center gap-2">
                                                        <CheckCircle size={14} />
                                                        Link Ready!
                                                    </div>
                                                )}
                                                <div className="flex gap-1">
                                                    <input
                                                        readOnly
                                                        value={generatedLink}
                                                        className="flex-grow border rounded px-2 py-1 text-xs bg-gray-50 text-gray-600"
                                                    />
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(generatedLink)}
                                                        className="bg-gray-200 hover:bg-gray-300 border border-gray-400 px-2 py-1 rounded"
                                                        title="Copy"
                                                    >
                                                        <LinkIcon size={12} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => setIsEmailModalOpen(true)}
                                                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold shadow transition-all flex items-center justify-center gap-2 border border-blue-600"
                                                >
                                                    <Send size={16} />
                                                    Send Email
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
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
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/50">
                            <div className="text-6xl font-light mb-4">↑</div>
                            <p className="text-xl">Upload a PDF to get started</p>
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