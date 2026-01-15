import React, { useState, type FC } from 'react';
import { Plus, Trash2, Save, CheckCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { useModuleQuiz, useSaveQuiz, useDeleteQuiz, AcademyModule, Question } from '../../hooks/useAcademy';

interface QuizEditorProps {
    module: AcademyModule;
    onBack: () => void;
}

// Temporary interface for editing state
interface QuestionState {
    type: 'single-choice' | 'true-false' | 'multi-select';
    question: string;
    options: string[];
    correctAnswer: number;
    correctAnswers: number[];
}

/**
 * Editor de Quizzes para Admin
 * Permite crear evaluaciones con preguntas de opción múltiple
 * Design: Executive Glass
 */
const QuizEditor: FC<QuizEditorProps> = ({ module, onBack }) => {
    const { quiz, loading } = useModuleQuiz(module.id);
    const saveQuiz = useSaveQuiz();
    const deleteQuiz = useDeleteQuiz();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionState>({
        type: 'single-choice',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        correctAnswers: []
    });

    // Sync quiz data when it loads from Firestore
    // Sync quiz data when it loads from Firestore
    // Pattern: Update state during render if props change (avoids double render commit)
    const [prevQuizId, setPrevQuizId] = useState<string | undefined>(undefined);
    if (quiz?.id !== prevQuizId) {
        setPrevQuizId(quiz?.id);
        if (quiz?.questions) {
            setQuestions(quiz.questions);
        }
    }

    const handleAddQuestion = () => {
        if (!currentQuestion.question.trim()) {
            // Using browser alert for simplicity, could be upgraded to Toast
            alert('Por favor completa la pregunta');
            return;
        }

        if (currentQuestion.type === 'single-choice' || currentQuestion.type === 'multi-select') {
            if (currentQuestion.options.some(o => !o.trim())) {
                alert('Por favor completa todas las opciones');
                return;
            }
        }

        if (currentQuestion.type === 'multi-select' && currentQuestion.correctAnswers.length === 0) {
            alert('Por favor selecciona al menos una respuesta correcta');
            return;
        }

        const newQuestion: Question = {
            type: currentQuestion.type === 'single-choice' ? 'single-choice' : currentQuestion.type,
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: (currentQuestion.type === 'multi-select' || currentQuestion.type === 'true-false') ? undefined : currentQuestion.correctAnswer,
            correctAnswers: (currentQuestion.type === 'multi-select') ? currentQuestion.correctAnswers : undefined
        };

        setQuestions([...questions, newQuestion]);

        const resetState: QuestionState = {
            type: currentQuestion.type,
            question: '',
            options: currentQuestion.type === 'true-false' ? ['Verdadero', 'Falso'] : ['', '', '', ''],
            correctAnswer: 0,
            correctAnswers: []
        };

        setCurrentQuestion(resetState);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (questions.length === 0) {
            alert('Agrega al menos una pregunta');
            return;
        }

        try {
            await saveQuiz(module.id, {
                questions,
                passingScore: 80,
                title: `Evaluación: ${module.title} `
            });
            alert('✅ Quiz guardado con éxito');
        } catch (error) {
            console.error('Error saving quiz:', error);
            alert('Error al guardar el quiz');
        }
    };

    const handleDelete = async () => {
        if (!quiz || !confirm('¿Seguro que quieres eliminar este quiz?')) {
            return;
        }

        try {
            await deleteQuiz(quiz.id);
            setQuestions([]);
            alert('✅ Quiz eliminado');
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Error al eliminar el quiz');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden p-8 max-w-7xl mx-auto space-y-8">
            {/* Atmospheric Backgrounds */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse [animation-delay:3s]" />

            <div className="relative z-10 space-y-8 animate-in fade-in duration-1000">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium mb-4 transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[13px]">Volver al currículum</span>
                        </button>
                        <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            Orquestación de Evaluación
                        </h1>
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            Módulo: <span className="font-medium text-purple-600 dark:text-purple-400 bg-purple-500/5 px-3 py-1 rounded-full border border-purple-500/10">{module.title}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {quiz && (
                            <button
                                onClick={handleDelete}
                                className="px-5 py-2.5 bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/20 font-medium transition border border-rose-100 dark:border-rose-900/30 text-sm"
                            >
                                Eliminar Quiz
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] text-sm"
                        >
                            <Save className="w-5 h-5" />
                            Guardar Quiz
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Editor Panel - Glass */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] border border-slate-200/40 dark:border-slate-800/40 p-8 shadow-2xl shadow-indigo-500/[0.05] sticky top-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                    <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nueva Pregunta</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal uppercase tracking-widest opacity-80">Diseño Reactivo</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Tipo de Pregunta
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={currentQuestion.type}
                                            onChange={(e) => {
                                                const newType = e.target.value as QuestionState['type'];
                                                setCurrentQuestion({
                                                    ...currentQuestion,
                                                    type: newType,
                                                    options: newType === 'true-false' ? ['Verdadero', 'Falso'] : ['', '', '', ''],
                                                    correctAnswers: []
                                                });
                                            }}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors appearance-none"
                                            aria-label="Seleccionar tipo de pregunta"
                                        >
                                            <option value="single-choice">Opción Múltiple (1 correcta)</option>
                                            <option value="true-false">Verdadero/Falso</option>
                                            <option value="multi-select">Selección Múltiple (varias correctas)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Pregunta *
                                    </label>
                                    <textarea
                                        value={currentQuestion.question}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors resize-none"
                                        placeholder="Escribe la pregunta aquí..."
                                        rows={3}
                                        aria-label="Texto de la pregunta"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        {currentQuestion.type === 'true-false' ? 'Respuesta Correcta' : 'Opciones de Respuesta'}
                                    </label>
                                    {currentQuestion.type === 'true-false' ? (
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((option, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex items - center gap - 3 p - 3 border rounded - xl cursor - pointer transition - all ${currentQuestion.correctAnswer === index
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-200 dark:ring-emerald-800'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30'
                                                        } `}
                                                    onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                                                >
                                                    <div className={`w - 5 h - 5 rounded - full border flex items - center justify - center ${currentQuestion.correctAnswer === index ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'} `}>
                                                        {currentQuestion.correctAnswer === index && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className={`font - medium ${currentQuestion.correctAnswer === index ? 'text-emerald-900 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'} `}>
                                                        {option}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {currentQuestion.options.map((option, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="flex-shrink-0 pt-2">
                                                        <input
                                                            type={currentQuestion.type === 'multi-select' ? 'checkbox' : 'radio'}
                                                            checked={currentQuestion.type === 'multi-select' ? currentQuestion.correctAnswers.includes(index) : currentQuestion.correctAnswer === index}
                                                            onChange={(e) => {
                                                                if (currentQuestion.type === 'multi-select') {
                                                                    let newCorrect = [...currentQuestion.correctAnswers];
                                                                    if (e.target.checked) newCorrect.push(index);
                                                                    else newCorrect = newCorrect.filter(i => i !== index);
                                                                    setCurrentQuestion({ ...currentQuestion, correctAnswers: newCorrect });
                                                                } else {
                                                                    setCurrentQuestion({ ...currentQuestion, correctAnswer: index });
                                                                }
                                                            }}
                                                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                                            aria-label={`Marcar opción ${index + 1} como correcta`}
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...currentQuestion.options];
                                                            newOptions[index] = e.target.value;
                                                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                                        }}
                                                        placeholder={`Opción ${index + 1} `}
                                                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors text-sm"
                                                        aria-label={`Texto de la opción ${index + 1} `}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleAddQuestion}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                                >
                                    <Plus className="w-5 h-5" />
                                    Agregar Pregunta
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded text-sm">
                                    {questions.length}
                                </span>
                                Preguntas del Quiz
                            </h3>
                            {questions.length === 0 && (
                                <span className="text-sm text-slate-500 dark:text-slate-400 italic">No hay preguntas agregadas</span>
                            )}
                        </div>

                        {questions.length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed p-12 text-center">
                                <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Usa el panel de la izquierda para agregar preguntas al quiz.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, index) => (
                                    <div key={index} className="bg-white dark:bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-indigo-500/5 transition-all group">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wider">
                                                        Pregunta {index + 1}
                                                    </span>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase">
                                                        {q.type === 'single-choice' && 'Opción Múltiple'}
                                                        {q.type === 'true-false' && 'Verdadero/Falso'}
                                                        {q.type === 'multi-select' && 'Selección Múltiple'}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{q.question}</h4>
                                                <div className="space-y-2 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                                                    {q.options.map((option, optIndex) => {
                                                        const isCorrect = q.type === 'multi-select'
                                                            ? q.correctAnswers?.includes(optIndex)
                                                            : q.correctAnswer === optIndex;

                                                        return (
                                                            <div
                                                                key={optIndex}
                                                                className={`p - 2 rounded - lg text - sm flex items - center gap - 2 ${isCorrect
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-100 dark:border-emerald-900/30'
                                                                        : 'text-slate-600 dark:text-slate-400'
                                                                    } `}
                                                            >
                                                                <span className={`w - 5 h - 5 flex items - center justify - center rounded border text - xs ${isCorrect ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-200/50 dark:bg-emerald-800/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'} `}>
                                                                    {String.fromCharCode(65 + optIndex)}
                                                                </span>
                                                                {option}
                                                                {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveQuestion(index)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                title="Eliminar pregunta"
                                                aria-label={`Eliminar pregunta ${index + 1} `}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizEditor;
