import React, { useState } from 'react';
import { CheckCircle, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSaveQuizResult, Quiz, AcademyModule } from '../../hooks/useAcademy';
import { useAuth } from '../../context/AuthContext';
import QuizResults from './QuizResults';

interface QuizEngineProps {
    quiz: Quiz;
    module: AcademyModule;
    onComplete?: (score: number, moduleId?: string) => void;
}

/**
 * Quiz Engine - Motor de evaluación para estudiantes
 * Muestra preguntas, valida respuestas y guarda resultados
 */
const QuizEngine: React.FC<QuizEngineProps> = ({ quiz, module, onComplete }) => {
    const { user } = useAuth();
    const saveQuizResult = useSaveQuizResult();

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({}); // For single-choice: number, for multi-select: array
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    // Handle para respuesta única (multiple-choice y true-false)
    const handleSingleAnswer = (questionIndex: number, answerIndex: number) => {
        setAnswers({
            ...answers,
            [questionIndex]: answerIndex
        });
    };

    const handleSubmit = async () => {
        // Calcular puntuación
        let correct = 0;
        quiz.questions.forEach((q, index) => {
            const userAnswer = answers[index];
            // Para single-choice y true-false
            if (userAnswer === q.correctAnswer) {
                correct++;
            }
        });

        const finalScore = Math.round((correct / quiz.questions.length) * 100);
        setScore(finalScore);
        setShowResults(true);

        // Guardar resultado
        try {
            if (user?.uid) {
                await saveQuizResult(user.uid, module?.id || '', finalScore, answers);
            }

            if (finalScore >= 80) {
                setTimeout(() => {
                    if (onComplete) onComplete(finalScore, module.id);
                }, 3000);
            }
        } catch (error) {
            console.error('Error saving quiz result:', error);
        }
    };

    const handleRetry = () => {
        setCurrentQuestion(0);
        setAnswers({});
        setShowResults(false);
        setScore(0);
    };

    const allAnswered = quiz.questions.every((_, index) => {
        const answer = answers[index];
        return answer !== undefined;
    });

    if (showResults) {
        return (
            <QuizResults
                quiz={quiz}
                answers={answers}
                score={score}
                onRetry={handleRetry}
                onComplete={() => onComplete && onComplete(score, module?.id)}
            />
        );
    }

    const question = quiz.questions[currentQuestion];

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 animate-fade-in">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                        Pregunta {currentQuestion + 1} de {quiz.questions.length}
                    </span>
                    <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                        {Object.keys(answers).length}/{quiz.questions.length} respondidas
                    </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` } as React.CSSProperties}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xl shadow-slate-200/50 mb-8 min-h-[400px] flex flex-col">
                {/* Question Type Badge */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Opción Múltiple
                    </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 leading-tight">
                    {question.text}
                </h2>

                <div className="space-y-4 flex-1">
                    {/* Single-Choice - Radio buttons */}
                    {question.options.map((option: string, index: number) => {
                        const isSelected: boolean = answers[currentQuestion] === index;

                        return (
                            <button
                                key={index}
                                onClick={() => handleSingleAnswer(currentQuestion, index)}
                                className={`w-full text-left px-6 py-5 rounded-2xl border-2 font-medium transition-all group flex items-center justify-between ${isSelected
                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                aria-pressed={isSelected ? 'true' : 'false'}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected
                                        ? 'border-[6px] border-indigo-600 bg-white'
                                        : 'border-2 border-slate-300 group-hover:border-indigo-300'
                                        }`}
                                    />
                                    <div>
                                        <span className={`font-bold mr-3 ${isSelected ? 'text-indigo-700' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        <span className={`text-lg ${isSelected ? 'text-indigo-900 font-semibold' : 'text-slate-600'}`}>
                                            {option}
                                        </span>
                                    </div>
                                </div>
                                {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
                <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-slate-800 font-bold transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Anterior
                </button>

                {currentQuestion === quiz.questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <Award className="w-5 h-5" />
                        Finalizar Quiz
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                        disabled={answers[currentQuestion] === undefined}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Siguiente
                        <ArrowRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizEngine;
