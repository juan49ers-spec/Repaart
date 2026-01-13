import React, { useState, useEffect } from 'react';
import {
    X,
    Send,
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    AlertCircle,
    History,
    Plus,
    Loader2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { resourceRequestService, DocumentRequest } from '../../../services/resourceRequestService';

interface DocumentRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    folders: { id: string; label: string; }[];
}

const DocumentRequestModal: React.FC<DocumentRequestModalProps> = ({
    isOpen,
    onClose,
    folders
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [isLoading, setIsLoading] = useState(false);
    const [userRequests, setUserRequests] = useState<DocumentRequest[]>([]);

    // Form State
    const [category, setCategory] = useState(folders[0]?.id || 'contracts');
    const [explanation, setExplanation] = useState('');
    const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load history when tab changes to history
    useEffect(() => {
        if (activeTab === 'history' && user?.franchiseId) {
            loadHistory();
        }
    }, [activeTab, user?.franchiseId]);

    const loadHistory = async () => {
        if (!user?.franchiseId) return;
        setIsLoading(true);
        try {
            const history = await resourceRequestService.getUserRequests(user.franchiseId);
            setUserRequests(history);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.franchiseId) return;

        if (!explanation.trim()) {
            alert("Por favor, explica qué documento necesitas.");
            return;
        }

        setIsSubmitting(true);
        try {
            await resourceRequestService.createRequest({
                franchiseId: user.franchiseId,
                franchiseName: user.displayName || 'Franquicia',
                category,
                explanation,
                priority
            });

            // Success
            setExplanation('');
            setPriority('normal');
            setActiveTab('history'); // Switch to history to show it's pending
            loadHistory();
        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Error al enviar la solicitud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'fulfilled':
                return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completado</span>;
            case 'rejected':
                return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rechazado</span>;
            default:
                return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        Solicitar Documentación
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 mx-4 mt-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'new'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Plus className="w-3 h-3" />
                        Nueva Solicitud
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <History className="w-3 h-3" />
                        Historial
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'new' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Category Select */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Categoría</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                >
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority Toggle */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Prioridad</label>
                                <div className="flex gap-3">
                                    <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${priority === 'normal' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" value="normal" checked={priority === 'normal'} onChange={() => setPriority('normal')} className="hidden" />
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-sm font-bold">Normal</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${priority === 'urgent' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" value="urgent" checked={priority === 'urgent'} onChange={() => setPriority('urgent')} className="hidden" />
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm font-bold">Urgente</span>
                                    </label>
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">¿Qué necesitas?</label>
                                <textarea
                                    value={explanation}
                                    onChange={(e) => setExplanation(e.target.value)}
                                    placeholder="Describe el documento que buscas..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                />
                                <p className="text-[10px] text-slate-400 text-right">Sé específico para agilizar la búsqueda.</p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Enviar Solicitud
                            </button>

                        </form>
                    ) : (
                        // HISTORY VIEW
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">Cargando historial...</p>
                                </div>
                            ) : userRequests.length === 0 ? (
                                <div className="text-center py-8 opacity-50">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-500">No tienes solicitudes previas.</p>
                                </div>
                            ) : (
                                userRequests.map(req => (
                                    <div key={req.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(req.status)}
                                                {req.priority === 'urgent' && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 rounded font-bold">URGENTE</span>}
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                                {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">{req.explanation}</h4>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                {folders.find(f => f.id === req.category)?.label || req.category}
                                            </span>

                                            {/* Actions based on status */}
                                            {req.status === 'rejected' && req.rejectionReason && (
                                                <div className="text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded max-w-[200px] truncate" title={req.rejectionReason}>
                                                    Motivo: {req.rejectionReason}
                                                </div>
                                            )}

                                            {/* In a fuller version, fulfilled could show a link button here */}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentRequestModal;
