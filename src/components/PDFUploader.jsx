import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from './ui/Button';

const PDFUploader = ({ onUpload, onError }) => {
    const fileInputRef = useRef(null);

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

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <Button
                type="button"
                variant="outline"
                onClick={handleButtonClick}
                className="w-full h-12 border-dashed border-2 hover:border-primary hover:text-primary hover:bg-primary/5"
            >
                <UploadCloud size={20} className="mr-2" />
                Choose PDF
            </Button>
            <input
                ref={fileInputRef}
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
};

export default PDFUploader;
