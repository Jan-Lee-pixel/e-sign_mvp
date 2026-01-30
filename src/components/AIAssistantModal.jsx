import React, { useState } from 'react';
import { X, FileText, Brain, Sparkles, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { secureAiService } from '../services/secureAiService';

export default function AIAssistantModal({ isOpen, onClose, fileBlob }) {
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'quiz'
    const [summary, setSummary] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Quiz state
    const [userAnswers, setUserAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    if (!isOpen) return null;

    const handleGenerateSummary = async () => {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-[scaleIn_0.3s_ease-out]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">AI Document Assistant</h2>
                            <p className="text-xs text-gray-500">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'summary'
                                ? 'text-indigo-600'
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
                                ? 'text-purple-600'
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
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
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to analyze</h3>
                                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Click the button below to generate a concise summary of your document using AI.</p>
                                    <Button onClick={handleGenerateSummary} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="whitespace-pre-wrap leading-relaxed">{summary}</div>
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
                                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Generate a 5-10 question quiz based on the content of your document.</p>
                                    <Button onClick={handleGenerateQuiz} className="bg-purple-600 hover:bg-purple-700 text-white">
                                        Create Quiz
                                    </Button>
                                </div>
                            )}

                            {isLoading && (
                                <div className="space-y-6">
                                    {[1, 2, 3].map(i => (
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
                                    {quizSubmitted && (
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
                                        <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-gray-200 p-4 -mx-6 -mb-6 mt-4 flex justify-end">
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
        </div>
    );
}
