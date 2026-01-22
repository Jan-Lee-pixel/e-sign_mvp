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
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-lg font-medium text-gray-700">Click to upload PDF</span>
                <span className="text-sm text-gray-500">or drag and drop</span>
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
