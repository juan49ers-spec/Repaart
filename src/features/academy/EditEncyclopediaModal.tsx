import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { EncyclopediaCard } from '../../hooks/useEncyclopedia';

interface EditEncyclopediaModalProps {
    card: EncyclopediaCard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<EncyclopediaCard>) => Promise<void>;
}

const EditEncyclopediaModal: React.FC<EditEncyclopediaModalProps> = ({ card, isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState(card.title);
    const [content, setContent] = useState(card.content);
    const [action, setAction] = useState(card.action);
    const [example, setExample] = useState(card.example || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle(card.title);
            setContent(card.content);
            setAction(card.action);
            setExample(card.example || '');
            setError(null);
        }
    }, [card, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            await onSave(card.id, {
                title,
                content,
                action,
                example: example || undefined
            });
            onClose();
        } catch (err) {
            console.error(err);
            setError("Error al guardar los cambios. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Editando Módulo
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                            {card.id}
                        </span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Título del Módulo
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder="Ej. Estrategia de Precios"
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Contenido Principal (Soporta Markdown básico)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 resize-y leading-relaxed"
                            placeholder="Escribe el contenido educativo aquí..."
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tips: Usa **negrita** para énfasis, - para listas.
                        </p>
                    </div>

                    {/* Action */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            Acción Táctica (Call to Action)
                        </label>
                        <textarea
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            required
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-300"
                            placeholder="¿Qué debe hacer el franquiciado hoy?"
                        />
                    </div>

                    {/* Example */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-amber-600 dark:text-amber-400">
                            Ejemplo Real (Caso de Estudio)
                        </label>
                        <textarea
                            value={example}
                            onChange={(e) => setExample(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-amber-300"
                            placeholder="Ej. Franquicia X aplicó esto y logró Y..."
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
                    <button
                        onClick={onClose}
                        type="button"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditEncyclopediaModal;
