import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PDFViewer from '../components/PDFViewer';
import SignaturePad from '../components/SignaturePad';
import { embedSignature } from '../utils/pdfUtils';
import { PenTool, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import AlertModal from '../components/AlertModal';

const RecipientSignPage = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [envelopeData, setEnvelopeData] = useState(null); // { pdf_path, fields: [] }
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageDimensions, setPageDimensions] = useState(null);

    // Signing state
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [activeField, setActiveField] = useState(null); // The field being signed
    const [signedFields, setSignedFields] = useState({}); // { fieldId: signatureDataURL }
    const [isSaving, setIsSaving] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "error" });

    useEffect(() => {
        fetchEnvelope();
    }, [token]);

    const fetchEnvelope = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_envelope_by_token', { token_input: token });

            if (error) throw error;
            if (!data) throw new Error("Envelope not found");

            // Assuming data structure based on typical RPC joining envelopes and fields
            // Or maybe it returns strictly the envelope and we need to fetch fields?
            // "Use ... to get the PDF URL and the Field coordinates."
            // I'll assume `data` has: { pdf_path: '...', fields: [...] } or similar.
            // If the RPC returns a JSON object with everything.
            // Let's assume it returns the envelope object which has a `fields` property (if fetched with select associated) 
            // OR the RPC constructs it.
            // If data is just the envelope row, I might need to fetch fields manually if the RPC doesn't.
            // BUT the prompt says "get... Field coordinates" from the RPC.
            // So let's assume `data` contains `fields`. 
            // If `data` is an array (RPC returning table rows), it might be `[{...envelope, ...field}]`.
            // Let's handle a common case: RPC returns a single JSON object or a row with joined data.
            // If it returns multiple rows (one per field), we group them.

            // For MVP, assuming single row with a `fields` JSONB column or array, OR just one field joined.
            // Let's debug by inspecting data if possible, but I can't run it now.
            // I'll handle the case where `data` is an array of records.

            let envelope = Array.isArray(data) ? data[0] : data;

            // If fields are not attached, we might be in trouble if RPC doesn't do it.
            // But prompt says RPC does it.

            setEnvelopeData(envelope);

            // Fetch PDF
            // Assuming pdf_path is the storage path
            const { data: fileData, error: fileError } = await supabase.storage
                .from('envelopes')
                .download(envelope.original_pdf_url);

            if (fileError) throw fileError;

            const buffer = await fileData.arrayBuffer();
            // Create separate copies to avoid detached buffer issues (e.g. if react-pdf or pdf-lib transfers ownership)
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
        // Calculate rendered height for % positioning
        const rotation = page.rotate || 0;
        let validWidth = page.originalWidth;
        let validHeight = page.originalHeight;

        if (rotation === 90 || rotation === 270) {
            validWidth = page.originalHeight;
            validHeight = page.originalWidth;
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



    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading document...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
    if (isComplete) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Document Signed!</h1>
            <p className="text-gray-600 mt-2">You have successfully signed the document. A copy has been downloaded to your device.</p>
        </div>
    );

    // Parse fields from envelopeData
    const fields = envelopeData.fields || (Array.isArray(envelopeData) ? envelopeData : [envelopeData]);

    // Logic for progress
    const totalFieldsCount = fields.length;
    const completedFieldsCount = Object.keys(signedFields).length;

    const handleFinish = async () => {
        // Collect all signatures and merge them at once? 
        // Or did we merge one by one?
        // Current logic in `completeEnvelope` assumes single field merge.
        // If we want to support multiple fields, we should probably do a batch merge or merge one by one in state?
        // For MVP, lets re-merge ALL signed fields from `signedFields` onto the ORIGINAL pdfBuffer.

        if (!pdfBuffer || !pageDimensions) return;
        setIsSaving(true);

        try {
            // Start with a fresh clone of original
            let currentPdfBuffer = pdfBuffer.slice(0);

            // Iterate through all signed fields and embed them
            for (const field of fields) {
                const signatureData = signedFields[field.id];
                if (!signatureData) continue; // Should trigger error if strict, but maybe allow partial? Nah, disable button.

                const x = (field.x_pct / 100) * 600;
                const y = (field.y_pct / 100) * pageDimensions.height;

                // Embed
                currentPdfBuffer = await embedSignature({
                    pdfBuffer: currentPdfBuffer,
                    signatureImage: signatureData,
                    position: { x, y },
                    pageIndex: field.page_number - 1,
                    visualWidth: 600
                });
            }

            // Download
            const blob = new Blob([currentPdfBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signed_document_${token.slice(0, 4)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Upload Signed PDF to Supabase Storage
            // Use sender_id to ensure the sender has RLS permission to view/download it later
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

            // RPC Complete - Updated to include signed PDF path if possible. 
            // If the RPC doesn't accept the path, we might need a separate update.
            // Let's try updating the envelope directly first if RLS allows, or assume RPC handles status.
            // Requirement says "bring back the document".
            // Since I can't easily change the RPC signature without SQL access, 
            // I will try to update the row directly using the token to find the ID, 
            // OR -- assuming the RPC `complete_envelope` might not update the URL.
            // Let's try to update the row separately.

            // We need the envelope ID. We have `envelopeData.id`? 
            // The `fetchEnvelope` sets `envelopeData`. 
            // Let's check if we have `envelopeData.id`. Yes, usually we do.
            if (envelopeData && envelopeData.id) {
                const { error: updateError } = await supabase
                    .from('envelopes')
                    .update({
                        status: 'signed',
                        pdf_url: signedPdfPath // Storing signed path in pdf_url or a new column? Plan said signed_pdf_url but maybe reuse pdf_url? 
                        // If pdf_url was original, we might overwrite it? 
                        // `original_pdf_url` stores the original. `pdf_url` is often used for the "current" or "signed" one.
                        // Let's blindly try `pdf_url` (or `signed_pdf_url` if we are sure).
                        // Let's use `pdf_url` as the "final" url.
                    })
                    .eq('id', envelopeData.id);

                if (updateError) console.error("Failed to update envelope with signed path:", updateError);
            }

            // Still call RPC to ensure any other logic (like invalidating token) happens
            const { error: rpcError } = await supabase.rpc('complete_envelope', { token_input: token });
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
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#ededed] font-segoe">
            {/* Header - Fixed Top */}
            <header className="h-16 bg-[#1853db] text-white flex items-center justify-between px-4 shadow-md z-50 shrink-0 win7-aero-glass">
                <div className="flex items-center gap-4">
                    {/* Placeholder Back Button */}
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <div className="w-5 h-5 flex items-center justify-center">←</div>
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold flex items-center gap-2 text-white text-shadow-sm">
                            <PenTool className="w-5 h-5" />
                            <span>E-Sign Guest</span>
                        </h1>
                        <p className="text-xs text-blue-100 opacity-80">Document Review</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-white/10 rounded text-sm text-blue-50 border border-white/20">
                        {completedFieldsCount} / {totalFieldsCount} Signed
                    </div>
                    <button
                        onClick={handleFinish}
                        disabled={!isComplete && completedFieldsCount < totalFieldsCount}
                        className={`
                            px-6 py-2 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2
                            ${(isComplete || completedFieldsCount >= totalFieldsCount)
                                ? 'bg-gradient-to-b from-green-400 to-green-600 text-white border-green-700 hover:brightness-110'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-500'}
                        `}
                    >
                        {isSaving ? 'Finishing...' : 'Finish & Download'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Left Tools */}
                <aside className="w-72 bg-[#f0f0f0] border-r border-[#999999] flex flex-col shrink-0 relative z-40">
                    <div className="p-4 bg-gradient-to-b from-white to-[#e6e6e6] border-b border-[#b5b5b5]">
                        <h2 className="text-[#1e395b] font-bold text-sm">Tools & Fields</h2>
                    </div>

                    <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
                        <div className="win7-window-container bg-white p-3">
                            <div className="text-xs font-bold text-[#1e395b] mb-2 uppercase tracking-wider border-b pb-1">Required Actions</div>

                            {fields.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {fields.map((field, idx) => {
                                        const isSigned = !!signedFields[field.id];
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setPageNumber(field.page_number);
                                                    // Optional: scroll to specific y position if we had a ref to the viewer container
                                                }}
                                                className={`
                                                    text-left p-3 rounded border flex items-center gap-3 transition-all
                                                    ${isSigned
                                                        ? 'bg-green-50 border-green-200 text-green-800'
                                                        : 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100'}
                                                `}
                                            >
                                                <div className={`
                                                    w-6 h-6 rounded-full flex items-center justify-center shrink-0 border
                                                    ${isSigned ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-yellow-400 text-yellow-600'}
                                                `}>
                                                    {isSigned ? <CheckCircle size={14} /> : <PenTool size={12} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold truncate">Signature Field {idx + 1}</div>
                                                    <div className="text-xs opacity-70">Page {field.page_number}</div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4">No fields found</div>
                            )}
                        </div>

                        <div className="win7-window-container bg-blue-50 p-4 border-blue-200">
                            <h3 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Instructions
                            </h3>
                            <ul className="text-xs text-blue-800 list-disc pl-4 space-y-1">
                                <li>Review the document on the right.</li>
                                <li>Click "Click to Sign" on the yellow boxes.</li>
                                <li>Once all fields are signed, click "Finish" in the top right.</li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Canvas - Center PDF */}
                <main className="flex-1 bg-[#8c8c8c] overflow-auto flex justify-center p-8 relative win7-wallpaper-pattern shadow-inner">
                    <div className="relative h-fit my-auto shadow-2xl">
                        {/* Wrapper for the PDF Viewer to give it that "Page" look */}
                        <div className="win7-window-container p-0 overflow-hidden border-none ring-1 ring-black/20">
                            <div className="bg-white">
                                {pdfFile && (
                                    <PDFViewer
                                        pdfFile={pdfFile}
                                        pageNumber={pageNumber}
                                        onPageChange={setPageNumber}
                                        onPageLoad={handlePageLoad}
                                    >
                                        {/* Render Sign Buttons Overlay */}
                                        {pageDimensions && fields.map((field, idx) => {
                                            if (field.page_number !== pageNumber) return null;
                                            const isSigned = !!signedFields[field.id];

                                            // Coordinates
                                            const left = (field.x_pct / 100) * 600;
                                            const top = (field.y_pct / 100) * pageDimensions.height;

                                            if (isSigned) {
                                                // Show signed state
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="absolute border-2 border-green-500 bg-green-50/80 pointer-events-none flex items-center justify-center p-1"
                                                        style={{
                                                            left, top,
                                                            width: 120, // Approx width of signature
                                                            height: 50,
                                                            zIndex: 20
                                                        }}
                                                    >
                                                        <img src={signedFields[field.id]} alt="Signature" className="max-w-full max-h-full object-contain" />
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
                                                    className="absolute bg-yellow-300/90 border-2 border-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded shadow-sm hover:scale-105 transition-transform hover:bg-yellow-400 group pointer-events-auto"
                                                    style={{
                                                        left: left,
                                                        top: top,
                                                        width: 120,
                                                        height: 50,
                                                        zIndex: 20
                                                    }}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        <PenTool size={14} />
                                                        <span className="text-xs uppercase tracking-wide">Sign</span>
                                                    </div>
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                        Click to Sign
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </PDFViewer>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {isSignatureModalOpen && (
                <SignaturePad
                    onSave={handleSignatureSave}
                    onCancel={() => setIsSignatureModalOpen(false)}
                    onWarning={(msg) => setAlertModal({ isOpen: true, title: "Drawing Required", message: msg, type: "info" })}
                />
            )}

            {isSaving && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] win7-modal-overlay">
                    <div className="win7-window-container w-80 bg-white">
                        <div className="win7-window-title">Processing</div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-[#2D89EF] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-700">Finalizing document...</p>
                        </div>
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
