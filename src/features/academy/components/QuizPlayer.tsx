import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import {
    CheckCircle,
    XCircle,
    ChevronRight,
    RotateCcw,
    Trophy,
    Target,
    Zap,
    AlertTriangle
} from 'lucide-react';
import { QuizQuestion, QuizResult, academyService } from '../../../services/academyService';

const PASS_THRESHOLD = 70;

interface QuizPlayerProps {
    questions: QuizQuestion[];
    lessonId: string;
    moduleId: string;
    userId: string;
    onComplete: (passed: boolean) => void;
}

type QuizPhase = 'answering' | 'results';

interface UserAnswer {
    question_id: string;
    selected_index: number;
    correct: boolean;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ questions, lessonId, moduleId, userId, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, UserAnswer>>(new Map());
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [phase, setPhase] = useState<QuizPhase>('answering');
    const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);
    const [saving, setSaving] = useState(false);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const progress = ((currentIndex) / totalQuestions) * 100;
    const isLastQuestion = currentIndex === totalQuestions - 1;

    // Cargar resultado previo
    useEffect(() => {
        const loadPrevious = async () => {
            try {
                const result = await academyService.getQuizResult(userId, moduleId, lessonId);
                if (result) setPreviousResult(result);
            } catch {
                // Silenciar error de carga previa
            }
        };
        loadPrevious();
    }, [userId, moduleId, lessonId]);

    const handleSelectOption = (optionIndex: number) => {
        if (showFeedback) return;
        setSelectedOption(optionIndex);
    };

    const handleConfirm = () => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
        const answer: UserAnswer = {
            question_id: currentQuestion.id,
            selected_index: selectedOption,
            correct: isCorrect,
        };

        setAnswers(prev => new Map(prev).set(currentQuestion.id, answer));
        setShowFeedback(true);
    };

    const handleNext = async () => {
        setShowFeedback(false);
        setSelectedOption(null);

        if (isLastQuestion) {
            // Calcular resultados
            const updatedAnswers = new Map(answers);
            const allAnswers = Array.from(updatedAnswers.values());
            const correctCount = allAnswers.filter(a => a.correct).length;
            const score = Math.round((correctCount / totalQuestions) * 100);
            const passed = score >= PASS_THRESHOLD;

            setSaving(true);
            try {
                await academyService.saveQuizResult(userId, moduleId, lessonId, {
                    score,
                    total_questions: totalQuestions,
                    correct_answers: correctCount,
                    passed,
                    answers: allAnswers,
                });
                onComplete(passed);
            } catch {
                // Silenciar — ya se muestra resultado igual
            }
            setSaving(false);
            setPhase('results');
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleRetry = () => {
        setCurrentIndex(0);
        setAnswers(new Map());
        setSelectedOption(null);
        setShowFeedback(false);
        setPhase('answering');
    };

    const results = useMemo(() => {
        if (phase !== 'results') return null;
        const allAnswers = Array.from(answers.values());
        const correctCount = allAnswers.filter(a => a.correct).length;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= PASS_THRESHOLD;
        return { correctCount, score, passed, allAnswers };
    }, [phase, answers, totalQuestions]);

    // --- RESULTS SCREEN ---
    if (phase === 'results' && results) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
            >
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Score Header */}
                    <div className={cn(
                        'p-8 text-center text-white',
                        results.passed
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    )}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                        >
                            {results.passed ? (
                                <Trophy className="w-16 h-16 mx-auto mb-4" />
                            ) : (
                                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                            )}
                        </motion.div>

                        <h2 className="text-3xl font-black mb-2">
                            {results.passed ? '¡Felicidades!' : 'Casi lo logras'}
                        </h2>
                        <p className="text-white/80 text-sm">
                            {results.passed
                                ? 'Has aprobado la evaluación'
                                : `Necesitas ${PASS_THRESHOLD}% para aprobar. ¡Inténtalo de nuevo!`}
                        </p>
                    </div>

                    {/* Score Card */}
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{results.score}%</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Puntuación</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{results.correctCount}/{totalQuestions}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Correctas</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                    {previousResult ? `${previousResult.score}%` : '—'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Mejor Previo</p>
                            </div>
                        </div>

                        {/* Answer Review */}
                        <div className="space-y-3 mb-6">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                                Revisión de Respuestas
                            </h3>
                            {questions.map((q, i) => {
                                const userAnswer = results.allAnswers.find(a => a.question_id === q.id);
                                return (
                                    <div
                                        key={q.id}
                                        className={cn(
                                            'flex items-center gap-3 p-3 rounded-xl border',
                                            userAnswer?.correct
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                            userAnswer?.correct
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-red-500 text-white'
                                        )}>
                                            {userAnswer?.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                {i + 1}. {q.question}
                                            </p>
                                            {!userAnswer?.correct && (
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                    Correcta: {q.options[q.correctOptionIndex]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        {!results.passed && (
                            <button
                                onClick={handleRetry}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl transition-all"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Intentar de Nuevo
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // --- ANSWERING SCREEN ---
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wide">
                                    Evaluación
                                </p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    Pregunta {currentIndex + 1} de {totalQuestions}
                                </p>
                            </div>
                        </div>
                        {/* Question dots */}
                        <div className="flex gap-1.5">
                            {questions.map((q, i) => {
                                const answered = answers.has(q.id);
                                const isCurrent = i === currentIndex;
                                return (
                                    <div
                                        key={q.id}
                                        className={cn(
                                            'w-2.5 h-2.5 rounded-full transition-all',
                                            isCurrent
                                                ? 'bg-blue-500 scale-125'
                                                : answered
                                                    ? answers.get(q.id)?.correct
                                                        ? 'bg-emerald-400'
                                                        : 'bg-red-400'
                                                    : 'bg-slate-200 dark:bg-slate-700'
                                        )}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Question */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                                {currentQuestion.question}
                            </h3>

                            <div className="space-y-3">
                                {currentQuestion.options.map((option, optionIndex) => {
                                    const isSelected = selectedOption === optionIndex;
                                    const isCorrectAnswer = optionIndex === currentQuestion.correctOptionIndex;

                                    let optionStyle = 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20';
                                    if (isSelected && !showFeedback) {
                                        optionStyle = 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/30';
                                    }
                                    if (showFeedback) {
                                        if (isCorrectAnswer) {
                                            optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30';
                                        } else if (isSelected && !isCorrectAnswer) {
                                            optionStyle = 'border-red-500 bg-red-50 dark:bg-red-900/30';
                                        } else {
                                            optionStyle = 'border-slate-200 dark:border-slate-700 opacity-50';
                                        }
                                    }

                                    const label = String.fromCharCode(65 + optionIndex);

                                    return (
                                        <motion.button
                                            key={optionIndex}
                                            whileHover={!showFeedback ? { scale: 1.01 } : {}}
                                            whileTap={!showFeedback ? { scale: 0.99 } : {}}
                                            onClick={() => handleSelectOption(optionIndex)}
                                            disabled={showFeedback}
                                            className={cn(
                                                'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                                                optionStyle
                                            )}
                                        >
                                            <div className={cn(
                                                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
                                                isSelected && !showFeedback && 'bg-blue-500 text-white',
                                                showFeedback && isCorrectAnswer && 'bg-emerald-500 text-white',
                                                showFeedback && isSelected && !isCorrectAnswer && 'bg-red-500 text-white',
                                                !isSelected && !showFeedback && 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            )}>
                                                {showFeedback ? (
                                                    isCorrectAnswer ? <CheckCircle className="w-5 h-5" /> :
                                                        isSelected ? <XCircle className="w-5 h-5" /> : label
                                                ) : label}
                                            </div>
                                            <span className="text-sm font-medium text-slate-900 dark:text-white flex-1">
                                                {option}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {!showFeedback ? (
                        <button
                            onClick={handleConfirm}
                            disabled={selectedOption === null}
                            className={cn(
                                'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg',
                                selectedOption !== null
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-xl'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                            )}
                        >
                            Confirmar Respuesta
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl transition-all"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLastQuestion ? 'Ver Resultados' : 'Siguiente Pregunta'}
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPlayer;
