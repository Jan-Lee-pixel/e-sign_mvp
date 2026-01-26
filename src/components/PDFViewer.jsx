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
