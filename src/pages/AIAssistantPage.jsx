import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Brain, Sparkles, AlertCircle, CheckCircle, UploadCloud, ArrowLeft, LogOut, PenTool } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { secureAiService } from '../services/secureAiService';
import PDFUploader from '../components/PDFUploader';
import Sidebar from '../components/Sidebar';
import AlertModal from '../components/AlertModal';

export default function AIAssistantPage({ session }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'quiz'
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
        // file is the File object from dropzone if customized, but PDFUploader usually returns buffer. 
        // We'll wrap buffer in Blob.
        const blob = new Blob([buffer], { type: 'application/pdf' });
        setFileBlob(blob);
        setFileName("Uploaded Document"); // PDFUploader might not pass name easily, defaulting.

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
        // Assuming session/supabase usage similar to other pages, but simpler here if just props
        // If we need auth logic imports:
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut();
    };


    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--template-bg-main)] font-['DM_Sans'] text-[var(--template-text-primary)]">
            {/* Header */}
            <header className="h-20 bg-[rgba(253,252,248,0.95)] backdrop-blur-xl border-b border-[var(--template-border)] flex items-center justify-between px-8 shadow-sm z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/dashboard')}
                        title="Back to Dashboard"
                        className="text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] hover:bg-transparent transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="h-8 w-[1px] bg-[var(--template-border)]"></div>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2 font-['Crimson_Pro'] text-[var(--template-primary)]">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <span>AI Document Assistant</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {session?.user?.email && (
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[var(--template-bg-secondary)] rounded-xl border border-[var(--template-border)] shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-[var(--template-primary)]/10 flex items-center justify-center text-[var(--template-primary)] text-xs font-bold">
                                {session.user.email[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[var(--template-text-secondary)]">{session.user.email}</span>
                        </div>
                    )}
                    <Button
                        variant="secondary"
                        onClick={handleSignOut}
                        className="text-[var(--template-text-secondary)] hover:text-[var(--template-primary)] bg-white border border-[var(--template-border)] hover:bg-[var(--template-bg-secondary)]"
                    >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <Sidebar activeTab="ai-assistant" />

                <main className="flex-1 overflow-auto p-8 flex justify-center bg-gray-50/50">
                    <div className="w-full max-w-4xl space-y-8">

                        {/* Intro / Upload Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyze Documents with AI</h2>
                                    <p className="text-gray-500">Upload a PDF to generate summaries or take quizzes to test your understanding.</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Sparkles size={24} />
                                </div>
                            </div>

                            {!fileBlob ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-12 text-center hover:border-indigo-300 transition-colors">
                                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <UploadCloud size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your PDF</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                        Select a document to unlock AI-powered insights. We support PDF files.
                                    </p>
                                    <div className="w-full max-w-xs mx-auto">
                                        <PDFUploader
                                            onUpload={handleUpload}
                                            onError={(msg) => setAlertModal({ isOpen: true, title: "Upload Error", message: msg, type: "error" })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{fileName}</p>
                                            <p className="text-xs text-indigo-600">Ready for analysis</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setFileBlob(null)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        Change File
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Analysis Section */}
                        {fileBlob && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                                {/* Tabs */}
                                <div className="flex border-b border-gray-100">
                                    <button
                                        onClick={() => setActiveTab('summary')}
                                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'summary'
                                                ? 'text-indigo-600 bg-indigo-50/30'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <FileText size={18} />
                                        Document Summary
                                        {activeTab === 'summary' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('quiz')}
                                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'quiz'
                                                ? 'text-purple-600 bg-purple-50/30'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Brain size={18} />
                                        Generate Quiz
                                        {activeTab === 'quiz' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                                        )}
                                    </button>
                                </div>

                                <div className="p-8 flex-1">
                                    {error && (
                                        <div className="mb-6 type-error bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold">Something went wrong</p>
                                                <p className="text-sm opacity-90">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'summary' && (
                                        <div className="space-y-6">
                                            {!summary && !isLoading && (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Sparkles size={32} />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to analyze</h3>
                                                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Generate a concise summary of your document using Gemini AI.</p>
                                                    <Button onClick={handleGenerateSummary} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px]">
                                                        Generate Summary
                                                    </Button>
                                                </div>
                                            )}

                                            {isLoading && (
                                                <div className="space-y-4 animate-pulse">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                                                </div>
                                            )}

                                            {summary && !isLoading && (
                                                <div className="prose prose-indigo max-w-none text-gray-700">
                                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                                        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                                                            <Sparkles size={18} />
                                                            AI Summary
                                                        </h3>
                                                        <div className="whitespace-pre-wrap leading-relaxed border-l-2 border-indigo-200 pl-4">{summary}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'quiz' && (
                                        <div className="space-y-6">
                                            {!quiz && !isLoading && (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Brain size={32} />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Test your knowledge</h3>
                                                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Create a 5-10 question multiple-choice quiz from this document.</p>
                                                    <Button onClick={handleGenerateQuiz} className="bg-purple-600 hover:bg-purple-700 text-white min-w-[200px]">
                                                        Create Quiz
                                                    </Button>
                                                </div>
                                            )}

                                            {isLoading && (
                                                <div className="space-y-6">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                                                            <div className="h-5 bg-gray-200 rounded w-2/3 mb-4"></div>
                                                            <div className="space-y-2">
                                                                <div className="h-10 bg-gray-100 rounded"></div>
                                                                <div className="h-10 bg-gray-100 rounded"></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {quiz && !isLoading && (
                                                <div className="space-y-8">
                                                    {quizSubmitted ? (
                                                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-[slideDown_0.3s_ease-out]">
                                                            <h3 className="text-2xl font-bold text-green-700 mb-1">Score: {score} / {quiz.length}</h3>
                                                            <p className="text-green-600">
                                                                {score === quiz.length ? "Perfect score! 🎉" : "Good job! Keep learning."}
                                                            </p>
                                                            <Button
                                                                variant="outline"
                                                                onClick={handleGenerateQuiz}
                                                                className="mt-4 border-green-200 text-green-700 hover:bg-green-100"
                                                            >
                                                                Try Another Quiz
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-gray-500 italic">Select the best answer for each question.</p>
                                                    )}

                                                    <div className="space-y-6">
                                                        {quiz.map((q, qIdx) => (
                                                            <div key={qIdx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                                                <h4 className="font-semibold text-gray-900 mb-4 flex gap-3">
                                                                    <span className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                                                                        {qIdx + 1}
                                                                    </span>
                                                                    {q.question}
                                                                </h4>
                                                                <div className="space-y-2 pl-9">
                                                                    {q.options.map((option, oIdx) => {
                                                                        const isSelected = userAnswers[qIdx] === oIdx;
                                                                        const isCorrect = q.answer === oIdx;

                                                                        let buttonClass = "w-full text-left p-3 rounded-lg border transition-all text-sm ";

                                                                        if (quizSubmitted) {
                                                                            if (isCorrect) {
                                                                                buttonClass += "bg-green-50 border-green-200 text-green-700 font-medium";
                                                                            } else if (isSelected && !isCorrect) {
                                                                                buttonClass += "bg-red-50 border-red-200 text-red-700";
                                                                            } else {
                                                                                buttonClass += "border-gray-100 text-gray-400 opacity-60";
                                                                            }
                                                                        } else {
                                                                            if (isSelected) {
                                                                                buttonClass += "bg-purple-50 border-purple-200 text-purple-700 font-medium";
                                                                            } else {
                                                                                buttonClass += "border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 text-gray-700";
                                                                            }
                                                                        }

                                                                        return (
                                                                            <button
                                                                                key={oIdx}
                                                                                onClick={() => handleQuizOptionSelect(qIdx, oIdx)}
                                                                                disabled={quizSubmitted}
                                                                                className={buttonClass}
                                                                            >
                                                                                <div className="flex items-center justify-between">
                                                                                    <span>{option}</span>
                                                                                    {quizSubmitted && isCorrect && <CheckCircle size={16} className="text-green-600" />}
                                                                                    {quizSubmitted && isSelected && !isCorrect && <X size={16} className="text-red-600" />}
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {!quizSubmitted && (
                                                        <div className="flex justify-end pt-4">
                                                            <Button
                                                                onClick={handleSubmitQuiz}
                                                                disabled={Object.keys(userAnswers).length !== quiz.length}
                                                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                                                            >
                                                                Submit Answers
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </main>
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
