import React, { useEffect, useState, useMemo } from 'react';
import { Trophy, CheckCircle, XCircle, ArrowRight, RotateCcw, TrendingUp } from 'lucide-react';
import { Quiz } from '../../hooks/useAcademy';

interface QuizResultsProps {
    quiz: Quiz;
    answers: Record<number, any>;
    score: number;
    onRetry?: () => void;
    onComplete?: () => void;
}

interface ConfettiPiece {
    id: number;
    left: number;
    delay: number;
    color: string;
}

interface BreakdownItem {
    question: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
}

/**
 * QuizResults - Pantalla de resultados mejorada con animaciones
 * Muestra puntuación, feedback y desglose de respuestas
 */
const QuizResults: React.FC<QuizResultsProps> = ({ quiz, answers, score, onRetry, onComplete }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const passed = score >= (quiz.passingScore || 80);

    const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (passed) {
            // Generate deterministic confetti for this run
            const pieces = [...Array(50)].map((_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 3,
                color: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)]
            }));
            const timer = setTimeout(() => {
                setConfettiPieces(pieces);
                setShowConfetti(true);
            }, 0);

            const hideTimer = setTimeout(() => setShowConfetti(false), 3000);
            return () => { clearTimeout(timer); clearTimeout(hideTimer); };
        }
    }, [passed]);

    // Calculate breakdown and stats
    const breakdown = useMemo<BreakdownItem[]>(() => {
        return quiz.questions.map((q: any, index: number) => {
            const userAnswer = answers[index];
            let isCorrect = false;
            let userAnswerText = '';
            let correctAnswerText = '';

            if (q.type === 'multi-select') {
                const correctAnswers = (q.correctAnswers || []) as number[];
                const userAnswers = (userAnswer || []) as number[];

                const hasAllCorrect = correctAnswers.every(a => userAnswers.includes(a));
                const hasNoIncorrect = userAnswers.every(a => correctAnswers.includes(a));
                isCorrect = hasAllCorrect && hasNoIncorrect && userAnswers.length > 0;

                userAnswerText = userAnswers.map(i => q.options[i]).join(', ');
                correctAnswerText = correctAnswers.map(i => q.options[i]).join(', ');
            } else {
                isCorrect = userAnswer === q.correctAnswer;
                userAnswerText = (userAnswer !== undefined && q.options[userAnswer as number]) ? q.options[userAnswer as number] : '---';
                correctAnswerText = q.options[q.correctAnswer as number];
            }

            return {
                question: q.question,
                isCorrect,
                userAnswer: userAnswerText,
                correctAnswer: correctAnswerText
            };
        });
    }, [quiz, answers]);

    const correctCount = breakdown.filter(i => i.isCorrect).length;
    const incorrectCount = breakdown.length - correctCount;

    return (
        <>
            {/* Confetti Animation */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    <div className="confetti-container">
                        {confettiPieces.map((piece) => (
                            <div
                                key={piece.id}
                                className="confetti"
                                style={{
                                    left: `${piece.left}%`,
                                    animationDelay: `${piece.delay}s`,
                                    backgroundColor: piece.color
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                {/* Header Card */}
                <div className={`bg-white rounded-3xl shadow-2xl p-12 text-center transform transition-all duration-500 ${passed ? 'border-4 border-emerald-400' : 'border-4 border-rose-400'
                    } hover:scale-105`}>
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        {passed ? (
                            <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce-slow">
                                <Trophy className="w-20 h-20 text-emerald-600" />
                            </div>
                        ) : (
                            <div className="w-32 h-32 bg-rose-100 rounded-full flex items-center justify-center animate-pulse">
                                <RotateCcw className="w-20 h-20 text-rose-600" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className={`text-5xl font-black mb-4 ${passed ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {passed ? '¡Felicidades!' : 'No Aprobado'}
                    </h1>

                    {/* Score */}
                    <div className="mb-6">
                        <div className="text-8xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {score}%
                        </div>
                        <p className="text-xl text-slate-600 mt-2">
                            {correctCount} de {quiz.questions.length} correctas
                        </p>
                    </div>

                    {/* Message */}
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                        {passed
                            ? '¡Has completado el módulo con éxito! Tu conocimiento ha sido validado.'
                            : `Necesitas al menos ${quiz.passingScore || 80}% para aprobar. ¡No te rindas, inténtalo de nuevo!`
                        }
                    </p>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                        <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-200">
                            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-emerald-600">{correctCount}</div>
                            <div className="text-sm text-emerald-700">Correctas</div>
                        </div>
                        <div className="bg-rose-50 rounded-2xl p-6 border-2 border-rose-200">
                            <XCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-rose-600">{incorrectCount}</div>
                            <div className="text-sm text-rose-700">Incorrectas</div>
                        </div>
                    </div>
                </div>

                {/* Breakdown Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <TrendingUp className="w-7 h-7 text-blue-600" />
                        Desglose Detallado
                    </h2>

                    <div className="space-y-4">
                        {breakdown.map((item, index) => (
                            <div
                                key={index}
                                className={`p-6 rounded-2xl border-2 transition-all hover:shadow-md ${item.isCorrect
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : 'bg-rose-50 border-rose-300'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {item.isCorrect ? (
                                        <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 mb-3">
                                            Pregunta {index + 1}: {item.question}
                                        </h3>
                                        <div className="space-y-2">
                                            <div className={`flex items-center gap-2 ${item.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                                }`}>
                                                <span className="font-semibold">Tu respuesta:</span>
                                                <span>{item.userAnswer}</span>
                                            </div>
                                            {!item.isCorrect && (
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <span className="font-semibold">Respuesta correcta:</span>
                                                    <span className="font-bold">{item.correctAnswer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                    {!passed && onRetry && (
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                            <RotateCcw className="w-6 h-6" />
                            Reintentar Quiz
                        </button>
                    )}
                    <button
                        onClick={onComplete}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${passed
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                    >
                        {passed ? 'Continuar' : 'Volver'}
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Saved Message */}
                {passed && (
                    <div className="text-center">
                        <p className="text-emerald-600 font-bold text-lg animate-pulse">
                            ✅ Progreso guardado - Siguiente módulo desbloqueado
                        </p>
                    </div>
                )}
            </div>

            {/* CSS for Confetti */}
            <style>{`
                @keyframes confetti-fall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }

                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    top: -10px;
                    animation: confetti-fall 3s linear infinite;
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
            `}</style>
        </>
    );

};

export default QuizResults;
