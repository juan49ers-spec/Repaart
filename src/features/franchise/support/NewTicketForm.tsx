import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, AlertCircle, HelpCircle, Zap, LucideIcon, Plus } from 'lucide-react';
import { notificationService } from '../../../services/notificationService';
import { useAuth } from '../../../context/AuthContext';
import { suggestSupportSolution } from '../../../lib/gemini';

interface NewTicketFormProps {
    onSubmit?: (data: any) => void;
    onSubjectChange?: (subject: string) => void;
    sending?: boolean;
    success?: boolean;
    setSuccess?: (success: boolean) => void;
    suggestions?: any[];
    file?: File | null;
    setFile?: (file: File | null) => void;
    uploading?: boolean;
    onClose?: () => void;
}

interface TicketFormData {
    subject: string;
    category: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
}

const NewTicketForm: React.FC<NewTicketFormProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [currentPath, setCurrentPath] = useState('');

    useEffect(() => {
        setCurrentPath(window.location.pathname);
    }, []);

    const [formData, setFormData] = useState<TicketFormData>({
        subject: '',
        category: 'general',
        description: '',
        priority: 'low'
    });
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<{ text: string, confidence: number } | null>(null);

    // AI AUTO-RESOLUTION
    useEffect(() => {
        const timer = setTimeout(async () => {
            // Updated Logic: Trigger if Subject is meaningful (>4 chars) OR Description is meaningful
            const hasSubject = formData.subject.length > 4;
            const hasDesc = formData.description.length > 4;

            if (hasSubject || hasDesc) {
                // Determine text to analyze
                const subjectText = hasSubject ? formData.subject : "Consulta General";
                const descText = hasDesc ? formData.description : formData.subject; // Fallback to subject if desc is empty

                console.log("🤖 Asking Gemini:", subjectText, descText); // Debug log

                const result = await suggestSupportSolution(subjectText, descText);
                if (result && result.isSolvable) {
                    setSuggestion({ text: result.suggestion, confidence: result.confidence });
                } else {
                    setSuggestion(null);
                }
            } else {
                setSuggestion(null);
            }
        }, 1000); // Reduced delay to 1.0s for snappier feel

        return () => clearTimeout(timer);
    }, [formData.description, formData.subject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.description) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "tickets"), {
                ...formData,
                status: 'open',
                origin: currentPath,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                messages: []
            });

            if (onClose) onClose();
            else alert("Ticket creado correctamente!");

            // Notify Admin
            await notificationService.notify(
                'SUPPORT_TICKET',
                user?.uid || 'unknown',
                user?.displayName || 'Franquicia',
                {
                    title: `Nuevo Ticket: ${formData.subject}`,
                    message: `Prioridad: ${formData.priority.toUpperCase()}\nCategoría: ${formData.category}\n\n${formData.description.substring(0, 100)}...`,
                    priority: formData.priority === 'high' ? 'high' : 'normal',
                    metadata: {
                        ticketId: 'unknown',
                        category: formData.category
                    }
                }
            );

        } catch (error) {
            console.error("Error creating ticket:", error);
            alert("Error al crear el ticket");
        } finally {
            setLoading(false);
        }
    };

    const PriorityCard: React.FC<{
        level: 'low' | 'medium' | 'high';
        label: string;
        icon: LucideIcon;
        colorClass: string;
        activeColor: string;
        borderClass: string;
    }> = ({ level, label, icon: Icon, colorClass, activeColor }) => (
        <div
            onClick={() => setFormData({ ...formData, priority: level })}
            className={`
                cursor-pointer p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all
                ${formData.priority === level
                    ? `${activeColor} shadow-sm`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
            `}
        >
            <Icon className={`w-5 h-5 ${formData.priority === level ? 'scale-110' : ''} ${formData.priority === level ? '' : colorClass}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors relative overflow-hidden">

            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] bg-[length:24px_24px]" />

            {/* Header */}
            <div className="px-5 py-3 border-b border-white/50 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl relative z-10 shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight leading-none">
                            Soporte Técnico App
                        </h2>
                        <div className="flex items-center gap-1 mt-0.5 text-emerald-600 dark:text-emerald-400 text-[9px] uppercase tracking-wider font-black opacity-90">
                            <span>(Gratuito)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Critical Disclaimer Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30 px-5 py-2 flex items-start gap-2 relative z-10 shrink-0">
                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium leading-tight">
                    <span className="font-bold">Importante:</span> Este canal es exclusivamente para <u>errores de la plataforma</u>.
                    Para temas operativos, fiscales o de negocio, contrata un <span className="underline">Servicio Premium</span>.
                </p>
            </div>

            {/* Ultra-Compact Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 relative z-10 overflow-y-auto custom-scrollbar flex flex-col min-h-0 bg-white/40 dark:bg-slate-900/40">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full content-start pb-4">

                    {/* AI SUGGESTION BANNER */}
                    {suggestion && (
                        <div className="lg:col-span-12 px-1 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-3 flex gap-3 shadow-sm">
                                <div className="p-2 bg-white dark:bg-emerald-900 rounded-lg shadow-sm shrink-0 h-fit">
                                    <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                                            Solución Inteligente Detectada
                                        </h4>
                                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                            {suggestion.confidence}% Confianza
                                        </span>
                                    </div>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
                                        {suggestion.text}
                                    </p>
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onClose ? onClose() : alert("Genial! Ticket evitado.")}
                                            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md font-bold transition-colors shadow-sm"
                                        >
                                            ¡Funcionó! (Cerrar)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSuggestion(null)}
                                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 px-3 py-1 rounded-md font-bold transition-colors"
                                        >
                                            No ayudó
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Row 1: Asunto (Full) */}
                    <div className="lg:col-span-12 space-y-1.5 shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 font-mono">Asunto</label>
                        <input
                            type="text"
                            placeholder="Resumen del problema..."
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-sm"
                            required
                        />
                    </div>

                    {/* Row 2: Category (4) + Priority (8) */}
                    <div className="lg:col-span-4 space-y-1.5 shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 font-mono">Categoría</label>
                        <div className="relative group">
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                aria-label="Categoría del ticket"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-lg p-3 text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800 shadow-sm"
                            >
                                <option value="general">General</option>
                                <option value="technical">Técnico</option>
                                <option value="billing">Facturación</option>
                                <option value="feature">Mejora</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                                <HelpCircle className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-1.5 shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 font-mono">Urgencia</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['low', 'medium', 'high'].map((level) => (
                                <PriorityCard
                                    key={level}
                                    level={level as any}
                                    label={level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'}
                                    icon={level === 'low' ? HelpCircle : level === 'medium' ? Zap : AlertCircle}
                                    colorClass={level === 'low' ? 'text-blue-500' : level === 'medium' ? 'text-amber-500' : 'text-rose-500'}
                                    activeColor={
                                        level === 'low' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50' :
                                            level === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50' :
                                                'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50'
                                    }
                                    borderClass="border"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Row 3: Description (Left) + File Upload (Right) - Fill Remaining Space */}
                    <div className="lg:col-span-7 flex flex-col space-y-1.5 min-h-[150px]">
                        <div className="flex justify-between items-center pl-1 pr-1">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Detalles</label>
                            <span className={`text-[10px] font-bold ${formData.description.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {formData.description.length}/500
                            </span>
                        </div>
                        <textarea
                            placeholder="Descripción detallada..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 500) })}
                            className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none transition-all leading-relaxed shadow-sm min-h-[120px]"
                            required
                        />
                    </div>

                    <div className="lg:col-span-5 flex flex-col space-y-1.5 min-h-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 font-mono">Evidencia</label>
                        <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-2 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group bg-slate-50/30 dark:bg-slate-900/30 min-h-[120px]">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-tight">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold block mb-0.5">Adjuntar</span>
                                PDF/JPG
                            </p>
                        </div>
                    </div>

                </div>
            </form>

            {/* Ultra-Compact Footer */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md relative z-20 flex justify-between items-center shrink-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider"> Respuesta &lt; 24h</p>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.subject || formData.description.length < 10}
                    className={`
                        px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2
                        ${loading || !formData.subject || formData.description.length < 10
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                        }
                    `}
                >
                    {loading ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>...</span>
                        </>
                    ) : (
                        <>
                            <span>Enviar Ticket</span>
                            <Send className="w-3.5 h-3.5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default NewTicketForm;
