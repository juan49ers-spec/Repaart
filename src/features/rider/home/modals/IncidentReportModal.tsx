import React, { useState } from 'react';
import { X, AlertTriangle, AlertOctagon, Clock, Info, Camera, Send } from 'lucide-react';
import { cn } from '../../../../lib/utils'; // Adjust path if needed

interface IncidentReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

type IncidentType = 'accident' | 'breakdown' | 'traffic' | 'other';

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [type, setType] = useState<IncidentType>('breakdown');
    const [isUrgent, setIsUrgent] = useState(false);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ type, isUrgent, description });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    const getTypeIcon = (t: IncidentType) => {
        switch (t) {
            case 'accident': return <AlertOctagon size={24} />;
            case 'breakdown': return <AlertTriangle size={24} />;
            case 'traffic': return <Clock size={24} />;
            case 'other': return <Info size={24} />;
        }
    };

    const getTypeLabel = (t: IncidentType) => {
        switch (t) {
            case 'accident': return 'Accidente';
            case 'breakdown': return 'Avería Mecánica';
            case 'traffic': return 'Retraso / Tráfico';
            case 'other': return 'Otro';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className={cn(
                    "relative p-6 text-white transition-colors duration-300",
                    isUrgent ? "bg-red-600" : "bg-slate-800"
                )}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <h2 className="text-xl font-black tracking-tight">Reportar Incidencia</h2>
                    </div>
                    <p className="text-white/80 text-sm ml-1">Notifica al centro de control inmediatamente.</p>
                </div>

                {/* BODY */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* URGENCY TOGGLE */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">¿Es urgente?</span>
                            <span className="text-xs text-slate-400">Marcar si requieres asistencia inmediata.</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsUrgent(!isUrgent)}
                            className={cn(
                                "w-14 h-8 rounded-full p-1 transition-all duration-300 relative",
                                isUrgent ? "bg-red-500" : "bg-slate-300 dark:bg-slate-600"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300",
                                isUrgent ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* TYPE SELECTION */}
                    <div className="grid grid-cols-2 gap-3">
                        {(['breakdown', 'accident', 'traffic', 'other'] as IncidentType[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    type === t
                                        ? (isUrgent ? "border-red-500 bg-red-50 text-red-700" : "border-slate-800 bg-slate-50 text-slate-800")
                                        : "border-transparent bg-white shadow-sm hover:bg-slate-50 text-slate-400"
                                )}
                            >
                                {getTypeIcon(t)}
                                <span className="text-xs font-bold">{getTypeLabel(t)}</span>
                            </button>
                        ))}
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe brevemente qué ha pasado..."
                            className="w-full h-24 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm focus:ring-2 focus:ring-slate-400 outline-none resize-none transition-all"
                            required
                        />
                    </div>

                    {/* PHOTO PLACEHOLDER */}
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">Adjuntar foto (Opcional)</span>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            "w-full py-4 rounded-xl font-black text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                            isUrgent
                                ? "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                                : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/30"
                        )}
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Enviando...</span>
                        ) : (
                            <>
                                <Send size={18} />
                                Enviar Reporte
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
