import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
            <div className="border border-gray-200 shadow-md relative bg-white">
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

                {/* Vertical Action Toolbar */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 pointer-events-auto">
                    <button
                        onClick={() => setPageWidth(prev => Math.min(prev + 50, 1000))}
                        className="w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[var(--template-primary)] hover:border-[var(--template-primary)] transition-colors"
                        title="Zoom In"
                    >
                        <span className="text-xl font-bold">+</span>
                    </button>
                    <button
                        onClick={() => setPageWidth(prev => Math.max(prev - 50, 400))}
                        className="w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[var(--template-primary)] hover:border-[var(--template-primary)] transition-colors"
                        title="Zoom Out"
                    >
                        <span className="text-xl font-bold">-</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[var(--template-primary)] hover:border-[var(--template-primary)] transition-colors"
                        title="Print"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
                    </button>
                </div>
            </div>

            {numPages && (
                <div className="flex gap-4 items-center justify-center mt-6 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pageNumber <= 1}
                        onClick={() => onPageChange(pageNumber - 1)}
                    >
                        <ChevronLeft size={16} className="mr-1" />
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-gray-700 font-mono">
                        Page {pageNumber} of {numPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pageNumber >= numPages}
                        onClick={() => onPageChange(pageNumber + 1)}
                    >
                        Next
                        <ChevronRight size={16} className="ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PDFViewer;
