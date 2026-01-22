import React, { useState } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import SignaturePad from './components/SignaturePad';
import DraggableSignature from './components/DraggableSignature';
import { embedSignature } from './utils/pdfUtils';
import { PenTool, Download } from 'lucide-react';

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBuffer, setPdfBuffer] = useState(null); // Keep original buffer
  const [signatureImage, setSignatureImage] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = (buffer) => {
    setPdfBuffer(buffer);
    setPdfFile(buffer); // react-pdf can take buffer directly
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
      const signedPdfBytes = await embedSignature({
        pdfBuffer,
        signatureImage,
        position: signaturePosition,
        pageIndex: 0, // MVP: Only sign first page for now
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PenTool className="text-blue-600" />
            QuickSign
          </h1>
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
            <PDFViewer pdfFile={pdfFile}>
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
