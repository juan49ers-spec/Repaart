import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModuleQuiz, useSaveQuiz } from '../../../hooks/useAcademy';
import { QuizQuestion } from '../../../services/academyService';
import { ArrowLeft, Plus, Save, Trash2, CheckCircle, HelpCircle, AlertCircle } from 'lucide-react';

interface QuizEditorProps {
    moduleId?: string;
    onBack?: () => void;
}

export const QuizEditor = ({ moduleId: propModuleId, onBack }: QuizEditorProps) => {
    const { moduleId: paramModuleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const moduleId = propModuleId || paramModuleId;
    const { quiz, loading } = useModuleQuiz(moduleId || '');
    const saveQuiz = useSaveQuiz();

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [passingScore, setPassingScore] = useState<number>(80);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (quiz) {
            setQuestions(quiz.questions || []);
            setPassingScore(quiz.passingScore || 80);
        }
    }, [quiz]);

    const handleSave = async () => {
        if (!moduleId) return;
        setIsSaving(true);
        try {
            await saveQuiz(moduleId, {
                questions,
                passingScore
            });
            alert('Examen guardado correctamente');
        } catch (e) {
            console.error(e);
            alert('Error al guardar el examen');
        } finally {
            setIsSaving(false);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: Date.now().toString(),
                text: 'Nueva Pregunta',
                options: ['Opción A', 'Opción B', 'Opción C'],
                correctAnswer: 0
            }
        ]);
    };

    const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando editor de examen...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10 animate-fade-in">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => onBack ? onBack() : navigate('/admin/academy')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition" title="Volver">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <HelpCircle className="w-8 h-8 text-indigo-500" />
                                Editor de Examen
                            </h1>
                            <p className="text-slate-500">Configura las preguntas y criterios de evaluación para este módulo.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase text-slate-500">Nota Mínima (%)</span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={passingScore}
                                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                                className="w-16 text-center font-bold bg-transparent outline-none border-b border-indigo-500"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Guardando...' : 'Guardar Examen'}
                        </button>
                    </div>
                </div>

                {/* Question List */}
                <div className="space-y-6">
                    {questions.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Este módulo aún no tiene examen</h3>
                            <p className="text-slate-500 mb-6">Añade preguntas para evaluar el conocimiento de los usuarios.</p>
                            <button onClick={addQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition">
                                Crear Primera Pregunta
                            </button>
                        </div>
                    )}

                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative group transition hover:shadow-md">
                            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg" title="Eliminar pregunta">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black rounded-lg">
                                    {idx + 1}
                                </span>
                                <div className="flex-1 space-y-4">
                                    <input
                                        type="text"
                                        value={q.text}
                                        onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                                        className="w-full text-lg font-bold bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none pb-2 transition placeholder-slate-300"
                                        placeholder="Escribe la pregunta aquí..."
                                    />

                                    <div className="grid gap-3 pl-2">
                                        {q.options.map((option: string, optIndex: number) => (
                                            <div key={optIndex} className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateQuestion(idx, 'correctAnswer', optIndex)}
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${q.correctAnswer === optIndex
                                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                                        : 'border-slate-300 hover:border-emerald-300'
                                                        }`}
                                                    title="Marcar como correcta"
                                                >
                                                    {q.correctAnswer === optIndex && <CheckCircle className="w-3 h-3" />}
                                                </button>
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(idx, optIndex, e.target.value)}
                                                    className={`flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${q.correctAnswer === optIndex ? 'ring-1 ring-emerald-500 border-emerald-500' : ''
                                                        }`}
                                                    placeholder={`Opción ${optIndex + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {questions.length > 0 && (
                        <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Añade otra pregunta
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
