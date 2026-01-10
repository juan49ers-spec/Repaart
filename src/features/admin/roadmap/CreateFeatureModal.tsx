import React, { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';

interface CreateFeatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { title: string; description: string; priority: 'low' | 'medium' | 'high' }) => void;
}

const CreateFeatureModal: React.FC<CreateFeatureModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            alert('Por favor completa todos los campos');
            return;
        }

        onCreate({ title, description, priority });

        // Reset form
        setTitle('');
        setDescription('');
        setPriority('medium');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Lightbulb className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">Nueva Mejora</h2>
                            <p className="text-sm text-slate-400">Propón un cambio o mejora para la aplicación</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Título <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Migrar componente X a TypeScript"
                            className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                            maxLength={100}
                        />
                        <p className="text-xs text-slate-500 mt-1">{title.length}/100 caracteres</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Descripción <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe la mejora o cambio que propones..."
                            rows={5}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-slate-500 mt-1">{description.length}/500 caracteres</p>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Prioridad
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setPriority('low')}
                                className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all ${priority === 'low'
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                🟢 Baja
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority('medium')}
                                className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all ${priority === 'medium'
                                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                🟡 Media
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority('high')}
                                className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all ${priority === 'high'
                                    ? 'bg-red-500/10 border-red-500 text-red-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                🔴 Alta
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            Crear Mejora
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFeatureModal;
