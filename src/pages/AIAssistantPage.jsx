import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FileText, Brain, Sparkles, AlertCircle, CheckCircle, UploadCloud, X, ArrowRight } from 'lucide-react';
import { secureAiService } from '../services/secureAiService';
import PDFUploader from '../components/PDFUploader';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AlertModal from '../components/AlertModal';

export default function AIAssistantPage({ session }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'quiz'
    const [sidebarTab, setSidebarTab] = useState('ai-assistant');
    const [fileBlob, setFileBlob] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [summary, setSummary] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "error" });

    // Quiz state
    const [userAnswers, setUserAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleUpload = (buffer, file) => {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        setFileBlob(blob);
        setFileName("Uploaded Document");

        // Reset state
        setSummary(null);
        setQuiz(null);
        setUserAnswers({});
        setQuizSubmitted(false);
        setScore(0);
        setError(null);
    };

    const handleGenerateSummary = async () => {
        if (!fileBlob) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await secureAiService.analyzeDocument(fileBlob);
            setSummary(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!fileBlob) return;
        setIsLoading(true);
        setError(null);
        setQuiz(null);
        setQuizSubmitted(false);
        setUserAnswers({});
        setScore(0);

        try {
            const result = await secureAiService.generateQuiz(fileBlob);
            setQuiz(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuizOptionSelect = (questionIndex, optionIndex) => {
        if (quizSubmitted) return;
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: optionIndex
        }));
    };

    const handleSubmitQuiz = () => {
        let correctCount = 0;
        quiz.forEach((q, idx) => {
            if (userAnswers[idx] === q.answer) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setQuizSubmitted(true);
    };

    const handleSignOut = async () => {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut();
    };

    // Helper for profile fetching if needed, effectively placeholder as we pass session
    const isPro = false; // logic placeholder, ideally passed or fetched

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#1A1A1A] leading-relaxed overflow-x-hidden">
            <Header userEmail={session?.user?.email} onSignOut={handleSignOut} isPro={isPro} />

            <div className="max-w-[1400px] mx-auto py-12 px-8 animate-[fadeIn_0.8s_ease-out_0.2s_backwards]">
                <div className="grid grid-cols-[280px_1fr] gap-8 mt-8 max-lg:grid-cols-1">
                    <Sidebar activeTab={sidebarTab} onTabChange={(id) => {
                        if (id !== 'ai-assistant') navigate('/dashboard');
                        setSidebarTab(id);
                    }}
                    />

                    <main className="animate-[slideLeft_0.6s_ease-out_0.4s_backwards]">

                        <div className="mb-8">
                            <h1 className="font-['Calistoga'] text-4xl font-bold tracking-wide text-[#1A1A1A] mb-2">AI Document Assistant</h1>
                            <p className="text-[var(--template-text-secondary)] font-['Crimson_Pro'] text-lg">Unlock insights from your documents with Gemini AI.</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-[var(--template-shadow-sm)] border border-[var(--template-border)] p-8 mb-8 relative overflow-hidden group">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--template-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="relative z-10">
                                {!fileBlob ? (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-[var(--template-bg-secondary)] text-[var(--template-primary)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <UploadCloud size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold font-['Calistoga'] text-[#1A1A1A] mb-3">Upload your Document</h3>
                                        <p className="text-[var(--template-text-secondary)] mb-8 max-w-md mx-auto">
                                            Select a PDF file to begin. We'll analyze it securely to generate summaries or create learning quizzes.
                                        </p>
                                        <div className="max-w-md mx-auto border-2 border-dashed border-[var(--template-border)] rounded-xl p-2 hover:border-[var(--template-primary)] transition-colors bg-[var(--template-bg-main)]">
                                            <PDFUploader
                                                onUpload={handleUpload}
                                                onError={(msg) => setAlertModal({ isOpen: true, title: "Upload Error", message: msg, type: "error" })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-6 bg-[var(--template-bg-secondary)] rounded-xl border border-[var(--template-border)]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[var(--template-primary)] shadow-sm border border-[var(--template-border)]">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1A1A1A] text-lg font-['Crimson_Pro']">{fileName}</p>
                                                <p className="text-sm text-[var(--template-primary)] font-medium flex items-center gap-1">
                                                    <CheckCircle size={14} /> Ready for analysis
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFileBlob(null)}
                                            className="text-[var(--template-text-secondary)] hover:text-[var(--template-destructive)] p-2 hover:bg-white rounded-full transition-all"
                                            title="Remove file"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {fileBlob && (
                            <div className="bg-white rounded-2xl shadow-[var(--template-shadow-md)] border border-[var(--template-border)] overflow-hidden min-h-[500px] flex flex-col animate-[slideUp_0.4s_ease-out]">
                                {/* Tabs */}
                                <div className="flex border-b border-[var(--template-border)] bg-[var(--template-bg-secondary)]/30 backdrop-blur-sm">
                                    <button
                                        onClick={() => setActiveTab('summary')}
                                        className={`flex-1 py-5 text-base font-semibold flex items-center justify-center gap-2 transition-all relative ${activeTab === 'summary'
                                            ? 'text-[var(--template-primary)]'
                                            : 'text-[var(--template-text-light)] hover:text-[var(--template-text-secondary)] hover:bg-[var(--template-bg-secondary)]'
                                            }`}
                                    >
                                        <Sparkles size={18} />
                                        Document Summary
                                        {activeTab === 'summary' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--template-primary)]"></div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('quiz')}
                                        className={`flex-1 py-5 text-base font-semibold flex items-center justify-center gap-2 transition-all relative ${activeTab === 'quiz'
                                            ? 'text-[var(--template-accent)]'
                                            : 'text-[var(--template-text-light)] hover:text-[var(--template-text-secondary)] hover:bg-[var(--template-bg-secondary)]'
                                            }`}
                                    >
                                        <Brain size={18} />
                                        Generate Quiz
                                        {activeTab === 'quiz' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--template-accent)]"></div>
                                        )}
                                    </button>
                                </div>

                                <div className="p-8 flex-1 bg-[url('/grid-pattern.svg')] bg-[length:40px_40px] bg-white/50">
                                    {error && (
                                        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3 shadow-sm">
                                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold font-['Crimson_Pro']">Analysis Failed</p>
                                                <p className="text-sm opacity-90">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'summary' && (
                                        <div className="space-y-6 max-w-3xl mx-auto">
                                            {!summary && !isLoading && (
                                                <div className="text-center py-16">
                                                    <div className="w-20 h-20 bg-[var(--template-primary)]/5 text-[var(--template-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <Sparkles size={36} />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 font-['Calistoga']">Executive Summary</h3>
                                                    <p className="text-[var(--template-text-secondary)] mb-8 max-w-sm mx-auto">
                                                        Get a concise, professional summary of your document's key points instantly.
                                                    </p>
                                                    <button
                                                        onClick={handleGenerateSummary}
                                                        className="bg-[var(--template-primary)] hover:bg-[var(--template-primary-light)] text-white px-8 py-3 rounded-xl font-semibold shadow-[var(--template-shadow-sm)] hover:shadow-[var(--template-shadow-md)] hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                                                    >
                                                        <Sparkles size={18} /> Generate Summary
                                                    </button>
                                                </div>
                                            )}

                                            {isLoading && (
                                                <div className="space-y-6 animate-pulse">
                                                    <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto mb-8"></div>
                                                    <div className="space-y-3">
                                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                                    </div>
                                                </div>
                                            )}

                                            {summary && !isLoading && (
                                                <div className="prose prose-slate max-w-none text-[#1A1A1A]">
                                                    <div className="bg-[var(--template-bg-main)] p-8 rounded-2xl border border-[var(--template-border)] shadow-sm relative">
                                                        <Sparkles className="absolute top-6 right-6 text-[var(--template-primary)] opacity-20" size={40} />
                                                        <h3 className="text-xl font-bold text-[var(--template-primary)] mb-6 flex items-center gap-2 font-['Crimson_Pro'] border-b border-[var(--template-border)] pb-4">
                                                            Document Summary
                                                        </h3>
                                                        <div className="leading-relaxed text-lg font-light text-[#1A1A1A]">
                                                            <ReactMarkdown components={{
                                                                strong: ({ node, ...props }) => <span className="font-bold text-[var(--template-primary-dark)]" {...props} />,
                                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4 font-['Calistoga']" {...props} />,
                                                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3 font-['Calistoga']" {...props} />,
                                                                p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                                                            }}>
                                                                {summary}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'quiz' && (
                                        <div className="space-y-6 max-w-3xl mx-auto">
                                            {!quiz && !isLoading && (
                                                <div className="text-center py-16">
                                                    <div className="w-20 h-20 bg-[var(--template-accent)]/10 text-[var(--template-accent)] rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <Brain size={36} />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 font-['Calistoga']">Knowledge Check</h3>
                                                    <p className="text-[var(--template-text-secondary)] mb-8 max-w-sm mx-auto">
                                                        Generate a custom quiz to verify your understanding of the document details.
                                                    </p>
                                                    <button
                                                        onClick={handleGenerateQuiz}
                                                        className="bg-[var(--template-accent)] hover:bg-[#D69520] text-white px-8 py-3 rounded-xl font-semibold shadow-[var(--template-shadow-sm)] hover:shadow-[var(--template-shadow-md)] hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                                                    >
                                                        <Brain size={18} /> Create Quiz
                                                    </button>
                                                </div>
                                            )}

                                            {isLoading && (
                                                <div className="space-y-8">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                                                            <div className="h-5 bg-gray-100 rounded w-2/3 mb-4"></div>
                                                            <div className="space-y-2">
                                                                <div className="h-12 bg-gray-50 rounded"></div>
                                                                <div className="h-12 bg-gray-50 rounded"></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {quiz && !isLoading && (
                                                <div className="space-y-8">
                                                    {quizSubmitted ? (
                                                        <div className="bg-[#E6F4EA] border border-[var(--template-success)]/20 rounded-2xl p-8 text-center animate-[slideDown_0.3s_ease-out]">
                                                            <h3 className="text-3xl font-bold text-[var(--template-primary)] mb-2 font-['Calistoga']">
                                                                Score: {score} / {quiz.length}
                                                            </h3>
                                                            <p className="text-[var(--template-primary-dark)] mb-6 font-medium">
                                                                {score === quiz.length ? "Outstanding! You know your stuff. 🎉" : "Good effort! Review the document to improve."}
                                                            </p>
                                                            <button
                                                                onClick={handleGenerateQuiz}
                                                                className="bg-white border border-[var(--template-border)] text-[var(--template-text-primary)] hover:border-[var(--template-primary)] px-6 py-2 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-md"
                                                            >
                                                                Start New Quiz
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center mb-8">
                                                            <h4 className="text-lg font-bold text-[#1A1A1A] font-['Crimson_Pro']">Quiz Active</h4>
                                                            <p className="text-sm text-[var(--template-text-secondary)]">Select the best answer for each question below.</p>
                                                        </div>
                                                    )}

                                                    <div className="space-y-6">
                                                        {quiz.map((q, qIdx) => (
                                                            <div key={qIdx} className="bg-white p-8 rounded-2xl border border-[var(--template-border)] shadow-sm hover:shadow-md transition-shadow">
                                                                <h4 className="font-bold text-[#1A1A1A] mb-6 flex gap-4 text-lg">
                                                                    <span className="bg-[var(--template-bg-secondary)] text-[var(--template-text-secondary)] w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5 font-['Crimson_Pro'] border border-[var(--template-border)]">
                                                                        {qIdx + 1}
                                                                    </span>
                                                                    {q.question}
                                                                </h4>
                                                                <div className="space-y-3 pl-12">
                                                                    {q.options.map((option, oIdx) => {
                                                                        const isSelected = userAnswers[qIdx] === oIdx;
                                                                        const isCorrect = q.answer === oIdx;

                                                                        let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium relative overflow-hidden ";

                                                                        if (quizSubmitted) {
                                                                            if (isCorrect) {
                                                                                buttonClass += "bg-[#E6F4EA] border-[var(--template-success)] text-[var(--template-primary-dark)]";
                                                                            } else if (isSelected && !isCorrect) {
                                                                                buttonClass += "bg-red-50 border-red-200 text-red-700";
                                                                            } else {
                                                                                buttonClass += "border-transparent bg-gray-50 text-gray-400";
                                                                            }
                                                                        } else {
                                                                            if (isSelected) {
                                                                                buttonClass += "bg-[var(--template-bg-secondary)] border-[var(--template-accent)] text-[#1A1A1A] shadow-sm";
                                                                            } else {
                                                                                buttonClass += "border-transparent bg-[var(--template-bg-secondary)]/50 hover:bg-[var(--template-bg-secondary)] hover:border-[var(--template-border)] text-[#1A1A1A]";
                                                                            }
                                                                        }

                                                                        return (
                                                                            <button
                                                                                key={oIdx}
                                                                                onClick={() => handleQuizOptionSelect(qIdx, oIdx)}
                                                                                disabled={quizSubmitted}
                                                                                className={buttonClass}
                                                                            >
                                                                                <div className="flex items-center justify-between relative z-10">
                                                                                    <span>{option}</span>
                                                                                    {quizSubmitted && isCorrect && <CheckCircle size={18} className="text-[var(--template-success)]" />}
                                                                                    {quizSubmitted && isSelected && !isCorrect && <X size={18} className="text-red-500" />}
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {!quizSubmitted && (
                                                        <div className="flex justify-end pt-8 border-t border-[var(--template-border)] mt-8">
                                                            <button
                                                                onClick={handleSubmitQuiz}
                                                                disabled={Object.keys(userAnswers).length !== quiz.length}
                                                                className="bg-[var(--template-primary)] hover:bg-[var(--template-primary-light)] text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                            >
                                                                Submit Answers <ArrowRight size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </main>
                </div>
            </div>

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div>
    );
}
