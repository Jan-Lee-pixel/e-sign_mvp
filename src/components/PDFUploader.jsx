import React from 'react';
import { Upload } from 'lucide-react';

const PDFUploader = ({ onUpload }) => {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpload(event.target.result);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    return (
        <div className="win7-upload text-center py-12 px-6">
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                <span className="text-lg font-semibold text-gray-700 mb-1">Upload PDF Document</span>
                <span className="text-sm text-gray-500">Click to browse for a file</span>
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
