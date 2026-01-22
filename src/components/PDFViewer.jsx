import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker source - essential for react-pdf
// Using unpkg CDN for simplicity in MVP, version matches installed react-pdf (usually latest)
// Ideally this should match the installed version dynamically, but for now hardcoded to a recent version is safe for MVP
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ pdfFile, children, pageNumber, onPageChange, onPageLoad }) => {
    const [numPages, setNumPages] = useState(null);
    // pageNumber is now controlled by parent
    const [pageWidth, setPageWidth] = useState(600); // Default width

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    return (
        <div className="flex flex-col items-center">
            <div className="border shadow-lg relative">
                <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex justify-center"
                >
                    <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false} // clean look
                        renderAnnotationLayer={false}
                        onLoadSuccess={(page) => {
                            if (onPageLoad) onPageLoad(page);
                        }}
                    />
                </Document>
                {/* Overlay for signature placement */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                    {/* Children (DraggableSignature) will be rendered here with pointer-events-auto */}
                    {children}
                </div>
            </div>

            {numPages && (
                <div className="flex gap-3 items-center justify-center mt-4">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => onPageChange(pageNumber - 1)}
                        className="win7-button px-4 py-1.5 rounded text-sm font-semibold disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                        Page {pageNumber} of {numPages}
                    </span>
                    <button
                        disabled={pageNumber >= numPages}
                        onClick={() => onPageChange(pageNumber + 1)}
                        className="win7-button px-4 py-1.5 rounded text-sm font-semibold disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default PDFViewer;
