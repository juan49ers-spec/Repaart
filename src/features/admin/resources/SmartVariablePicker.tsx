import React, { useState, useMemo } from 'react';
import {
    Calculator,
    Calendar,
    Check,
    X,
    Sparkles
} from 'lucide-react';
import {
    SmartVariable,
    CALCULATED_VARIABLES,
    calculateSmartVariables
} from './variables/smartVariables';

interface SmartVariablePickerProps {
    onInsertVariable: (key: string, value: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const SmartVariablePicker: React.FC<SmartVariablePickerProps> = ({
    onInsertVariable,
    isOpen,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'calculated' | 'custom'>('calculated');
    const [customKey, setCustomKey] = useState('');
    const [customValue, setCustomValue] = useState('');

    const calculatedVars = useMemo(() => {
        if (!isOpen) return {};
        return calculateSmartVariables();
    }, [isOpen]);

    const handleInsertCalculated = (variable: SmartVariable) => {
        const value = calculatedVars[variable.key] || '';
        onInsertVariable(variable.key, value);
        onClose();
    };

    const handleInsertCustom = () => {
        if (customKey.trim() && customValue.trim()) {
            onInsertVariable(customKey.trim().toUpperCase().replace(/\s+/g, '_'), customValue.trim());
            setCustomKey('');
            setCustomValue('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Variables Inteligentes</h3>
                            <p className="text-xs text-slate-500">Variables calculadas automáticamente</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('calculated')}
                        className={`flex-1 px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'calculated'
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Calculadas
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`flex-1 px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'custom'
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Calculator className="w-4 h-4" />
                        Personalizada
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'calculated' ? (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 mb-4">
                                Estas variables se calculan automáticamente según la fecha actual:
                            </p>

                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {CALCULATED_VARIABLES.map((variable) => (
                                    <button
                                        key={variable.key}
                                        onClick={() => handleInsertCalculated(variable)}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-left group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                                                    [{variable.key}]
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{variable.description}</p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                                                {calculatedVars[variable.key]}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Click para insertar
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500">
                                Crea una variable personalizada:
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Nombre de la variable
                                </label>
                                <input
                                    type="text"
                                    value={customKey}
                                    onChange={(e) => setCustomKey(e.target.value)}
                                    placeholder="Ej: PLAZO_ENTREGA"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:border-indigo-500"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Se convertirá automáticamente a formato [NOMBRE_VARIABLE]
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Valor
                                </label>
                                <input
                                    type="text"
                                    value={customValue}
                                    onChange={(e) => setCustomValue(e.target.value)}
                                    placeholder="Ej: 30 días"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                                />
                            </div>

                            <button
                                onClick={handleInsertCustom}
                                disabled={!customKey.trim() || !customValue.trim()}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Insertar Variable
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartVariablePicker;
