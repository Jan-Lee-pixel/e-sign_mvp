import React from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from './ui/Button';

const PDFUploader = ({ onUpload, onError }) => {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpload(event.target.result, file.name);
            };
            reader.readAsArrayBuffer(file);
        } else {
            if (onError) {
                onError("Please upload a valid PDF file.");
            } else {
                alert("Please upload a valid PDF file.");
            }
        }
    };

    return (
        <div className="w-full">
            <label htmlFor="pdf-upload" className="cursor-pointer w-full">
                <Button
                    variant="outline"
                    className="w-full h-12 border-dashed border-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    asChild
                >
                    <div className="flex items-center justify-center gap-2">
                        <UploadCloud size={20} />
                        Choose PDF
                    </div>
                </Button>
                <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
        </div>
    );
};

export default PDFUploader;
