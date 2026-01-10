import React from 'react';
import { X, Trash2, Calendar, Tag } from 'lucide-react';
import { PREDEFINED_LABELS, getLabelColor } from '../../../constants/labels';

import FeatureComments from './FeatureComments';

interface EditFeatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: {
        id: string;
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        status: 'proposed' | 'in_progress' | 'completed';
        createdAt: any;
        createdByEmail: string;
        labels?: string[];


    } | null;
    onSave: (id: string, data: { title: string; description: string; priority: 'low' | 'medium' | 'high'; labels: string[] }) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const EditFeatureModal: React.FC<EditFeatureModalProps> = ({ isOpen, onClose, feature, onSave, onDelete }) => {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
    const [labels, setLabels] = React.useState<string[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);


    React.useEffect(() => {
        if (feature) {
            setTitle(feature.title);
            setDescription(feature.description);
            setPriority(feature.priority);
            setLabels(feature.labels || []);

        }
    }, [feature]);

    const handleSave = async () => {
        if (!feature || !title.trim() || !description.trim()) return;

        setIsSaving(true);
        try {
            await onSave(feature.id, { title, description, priority, labels });
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!feature) return;

        setIsDeleting(true);
        try {
            await onDelete(feature.id);
            onClose();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error al eliminar');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen || !feature) return null;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Reciente';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            <div
                className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            Editar Mejora
                        </h2>
                        <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(feature.createdAt)}
                            </span>
                            <span>•</span>
                            <span>Por {feature.createdByEmail}</span>
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
                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="feature-title" className="block text-sm font-bold text-slate-300 mb-2">
                            Título <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="feature-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            maxLength={100}
                        />
                        <p className="text-xs text-slate-500 mt-1">{title.length}/100 caracteres</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="feature-description" className="block text-sm font-bold text-slate-300 mb-2">
                            Descripción <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            id="feature-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
                            {(['low', 'medium', 'high'] as const).map((p) => {
                                const labels = { low: '🟢 Baja', medium: '🟡 Media', high: '🔴 Alta' };
                                const colors = {
                                    low: priority === 'low' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600',
                                    medium: priority === 'medium' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600',
                                    high: priority === 'high' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                };

                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all ${colors[p]}`}
                                    >
                                        {labels[p]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Labels */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            <Tag className="w-4 h-4 inline mr-2" />
                            Etiquetas
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_LABELS.map((label) => {
                                const isSelected = labels.includes(label.id);
                                const color = getLabelColor(label.id);

                                return (
                                    <button
                                        key={label.id}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                setLabels(labels.filter(l => l !== label.id));
                                            } else {
                                                setLabels([...labels, label.id]);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all ${isSelected
                                            ? `${color} border-current`
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {label.emoji} {label.label}
                                    </button>
                                );
                            })}
                        </div>
                        {labels.length > 0 && (
                            <p className="text-xs text-slate-500 mt-2">
                                {labels.length} etiqueta{labels.length > 1 ? 's' : ''} seleccionada{labels.length > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>


                </div>

                {/* Comments Section */}
                <div className="px-6 pb-6">
                    <FeatureComments featureId={feature.id} />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-6 border-t border-slate-800 bg-slate-900/50">
                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-slate-400">¿Seguro?</p>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim() || !description.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Backdrop */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-2xl pointer-events-none" />
            )}
        </div>

    );
};

export default EditFeatureModal;
