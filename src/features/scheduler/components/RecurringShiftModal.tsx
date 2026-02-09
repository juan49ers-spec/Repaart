import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Repeat, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { shiftService, ShiftInput } from '../../../services/shiftService';

interface RecurringShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    baseShift: ShiftInput | null;
    franchiseId: string;
}

export const RecurringShiftModal: React.FC<RecurringShiftModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    baseShift,
    franchiseId
}) => {
    const [pattern, setPattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [occurrences, setOccurrences] = useState(4);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateRecurring = async () => {
        if (!baseShift) {
            setError('No hay turno base para duplicar');
            return;
        }

        if (occurrences < 2 || occurrences > 52) {
            setError('El número de repeticiones debe ser entre 2 y 52');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            await shiftService.createRecurringShift(
                baseShift,
                pattern,
                occurrences,
                franchiseId
            );
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating recurring shifts:', err);
            setError('Error al crear los turnos recurrentes');
        } finally {
            setIsCreating(false);
        }
    };

    const getPatternLabel = () => {
        switch (pattern) {
            case 'daily': return 'días';
            case 'weekly': return 'semanas';
            case 'monthly': return 'meses';
        }
    };

    const getPatternDescription = () => {
        switch (pattern) {
            case 'daily': return 'Todos los días';
            case 'weekly': return 'Cada semana el mismo día';
            case 'monthly': return 'Cada mes el mismo día';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Repeat className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Crear Turnos Recurrentes</h3>
                                        <p className="text-xs text-white/70">Duplicar este turno automáticamente</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {error && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Pattern Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">
                                        Frecuencia de repetición
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'daily', label: 'Diario', icon: '📅' },
                                            { id: 'weekly', label: 'Semanal', icon: '📆' },
                                            { id: 'monthly', label: 'Mensual', icon: '🗓️' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setPattern(p.id as any)}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                                    pattern === p.id
                                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                                                )}
                                            >
                                                <span className="text-2xl">{p.icon}</span>
                                                <span className="text-sm font-medium">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {getPatternDescription()}
                                    </p>
                                </div>

                                {/* Occurrences */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">
                                        Número de repeticiones
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="2"
                                            max="52"
                                            value={occurrences}
                                            onChange={(e) => setOccurrences(parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="w-20 text-center">
                                            <span className="text-2xl font-bold text-indigo-600">{occurrences}</span>
                                            <span className="text-xs text-slate-500 block">{getPatternLabel()}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>2</span>
                                        <span>52</span>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                        <span>
                                            Se crearán <strong className="text-slate-900">{occurrences} turnos</strong> en total
                                            <br />
                                            <span className="text-xs text-slate-500">
                                                {pattern === 'weekly' && '(uno por semana durante ' + occurrences + ' semanas)'}
                                                {pattern === 'daily' && '(uno por día durante ' + occurrences + ' días)'}
                                                {pattern === 'monthly' && '(uno por mes durante ' + occurrences + ' meses)'}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateRecurring}
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <Repeat className="w-4 h-4" />
                                            Crear {occurrences} Turnos
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default RecurringShiftModal;
