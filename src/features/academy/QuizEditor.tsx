import { useState, useEffect, type FC } from 'react';
import { Plus, Trash2, Save, CheckCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { useModuleQuiz, useSaveQuiz, useDeleteQuiz, AcademyModule, Question } from '../../hooks/useAcademy';

interface QuizEditorProps {
    module: AcademyModule;
    onBack: () => void;
}

// Temporary interface for editing state, slightly more permissive/structured than the final model
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
    useEffect(() => {
        if (quiz?.questions) {
            setQuestions(quiz.questions);
        }
    }, [quiz]);

    const handleAddQuestion = () => {
        if (!currentQuestion.question.trim()) {
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
                title: `Evaluación: ${module.title}`
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
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-4 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver
                    </button>
                    <h1 className="text-3xl font-black text-slate-900">Editor de Quiz</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        Módulo: <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{module.title}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    {quiz && (
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 font-bold transition border border-rose-100"
                        >
                            Eliminar Quiz
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                    >
                        <Save className="w-5 h-5" />
                        Guardar Quiz
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Editor Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 sticky top-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Plus className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Agregar Pregunta</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Tipo de Pregunta
                                </label>
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
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50 focus:bg-white transition-colors"
                                    aria-label="Seleccionar tipo de pregunta"
                                >
                                    <option value="single-choice">Opción Múltiple (1 correcta)</option>
                                    <option value="true-false">Verdadero/Falso</option>
                                    <option value="multi-select">Selección Múltiple (varias correctas)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Pregunta *
                                </label>
                                <textarea
                                    value={currentQuestion.question}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50 focus:bg-white transition-colors resize-none"
                                    placeholder="Escribe la pregunta aquí..."
                                    rows={3}
                                    aria-label="Texto de la pregunta"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    {currentQuestion.type === 'true-false' ? 'Respuesta Correcta' : 'Opciones de Respuesta'}
                                </label>
                                {currentQuestion.type === 'true-false' ? (
                                    <div className="space-y-2">
                                        {currentQuestion.options.map((option, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${currentQuestion.correctAnswer === index
                                                    ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
                                                    : 'hover:bg-slate-50 border-slate-200'
                                                    }`}
                                                onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${currentQuestion.correctAnswer === index ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                                    {currentQuestion.correctAnswer === index && <CheckCircle className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={`font-medium ${currentQuestion.correctAnswer === index ? 'text-emerald-900' : 'text-slate-700'}`}>
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
                                                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
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
                                                    placeholder={`Opción ${index + 1}`}
                                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                                                    aria-label={`Texto de la opción ${index + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleAddQuestion}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                            >
                                <Plus className="w-5 h-5" />
                                Agregar Pregunta
                            </button>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm">
                                {questions.length}
                            </span>
                            Preguntas del Quiz
                        </h3>
                        {questions.length === 0 && (
                            <span className="text-sm text-slate-500 italic">No hay preguntas agregadas</span>
                        )}
                    </div>

                    {questions.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">
                                Usa el panel de la izquierda para agregar preguntas al quiz.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    Pregunta {index + 1}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium uppercase">
                                                    {q.type === 'single-choice' && 'Opción Múltiple'}
                                                    {q.type === 'single-choice' && 'Opción Múltiple'}
                                                    {q.type === 'true-false' && 'Verdadero/Falso'}
                                                    {q.type === 'multi-select' && 'Selección Múltiple'}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-4">{q.question}</h4>
                                            <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                                {q.options.map((option, optIndex) => {
                                                    const isCorrect = q.type === 'multi-select'
                                                        ? q.correctAnswers?.includes(optIndex)
                                                        : q.correctAnswer === optIndex;

                                                    return (
                                                        <div
                                                            key={optIndex}
                                                            className={`p-2 rounded-lg text-sm flex items-center gap-2 ${isCorrect
                                                                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                                                                : 'text-slate-600'
                                                                }`}
                                                        >
                                                            <span className={`w-5 h-5 flex items-center justify-center rounded border text-xs ${isCorrect ? 'border-emerald-300 bg-emerald-200/50' : 'border-slate-200 bg-slate-50'}`}>
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
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                            title="Eliminar pregunta"
                                            aria-label={`Eliminar pregunta ${index + 1}`}
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
    );
};

export default QuizEditor;
