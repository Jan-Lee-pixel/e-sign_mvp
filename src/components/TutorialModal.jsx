import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, FileText, PenTool, CheckCircle, BarChart2 } from 'lucide-react';

const TutorialModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    if (!isOpen) return null;

    const steps = [
        {
            title: "Welcome to E-Sign",
            description: "The secure and simple way to manage your documents and signatures digitally.",
            icon: <div className="w-16 h-16 bg-[var(--template-primary)] text-white rounded-2xl flex items-center justify-center text-3xl shadow-[var(--template-shadow-lg)]">✍</div>
        },
        {
            title: "Upload & Prepare",
            description: "Easily upload PDF documents and prepare them for signature anytime, anywhere.",
            icon: <FileText size={64} className="text-[var(--template-primary)]" />
        },
        {
            title: "Sign & Send",
            description: "Add your secure signature or request signatures from others in just a few clicks.",
            icon: <PenTool size={64} className="text-[var(--template-primary)]" />
        },
        {
            title: "Track Status",
            description: "Monitor document status in real-time. See what's pending and what's completed.",
            icon: <BarChart2 size={64} className="text-[var(--template-primary)]" />
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
            navigate('/compose');
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-[var(--template-shadow-xl)] overflow-hidden border border-[var(--template-border)] animate-[scaleIn_0.4s_ease-out_forwards]">
                <div className="p-8 flex flex-col items-center text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-[var(--template-text-light)] hover:text-[var(--template-text-primary)] transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="mt-4 mb-8 transform transition-all duration-500 ease-in-out hover:scale-110">
                        {steps[step].icon}
                    </div>

                    <h3 className="font-['Crimson_Pro'] text-3xl font-semibold text-[var(--template-text-primary)] mb-4 animate-[slideDown_0.3s_ease-out]">
                        {steps[step].title}
                    </h3>

                    <p className="text-[var(--template-text-secondary)] text-lg leading-relaxed mb-8 min-h-[80px] animate-[fadeIn_0.5s_ease-out]">
                        {steps[step].description}
                    </p>

                    <div className="flex justify-center gap-2 mb-8">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[var(--template-primary)]' : 'w-2 bg-gray-200'}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full">
                        {step > 0 && (
                            <button
                                onClick={handlePrev}
                                className="flex-1 py-3 px-6 rounded-xl font-semibold text-[var(--template-text-secondary)] hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-[var(--template-primary)] text-white shadow-[var(--template-shadow-md)] hover:bg-[var(--template-primary-dark)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            {step === steps.length - 1 ? (
                                <><span>Start Signing</span> <CheckCircle size={18} /></>
                            ) : (
                                <><span>Next</span> <ChevronRight size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
