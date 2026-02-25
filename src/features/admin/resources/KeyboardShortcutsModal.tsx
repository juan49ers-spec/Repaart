import React from 'react';
import { X, Command, CornerDownLeft, ArrowUp, ArrowDown, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ShortcutCategory {
    name: string;
    shortcuts: {
        keys: string[];
        description: string;
    }[];
}

const SHORTCUTS: ShortcutCategory[] = [
    {
        name: 'Generales',
        shortcuts: [
            { keys: ['Ctrl', 'S'], description: 'Guardar borrador' },
            { keys: ['Ctrl', 'E'], description: 'Exportar documento' },
            { keys: ['Ctrl', 'F'], description: 'Activar modo Focus' },
            { keys: ['?'], description: 'Mostrar atajos' },
            { keys: ['Esc'], description: 'Cerrar modal' },
        ]
    },
    {
        name: 'Edición',
        shortcuts: [
            { keys: ['Ctrl', 'B'], description: 'Negrita' },
            { keys: ['Ctrl', 'I'], description: 'Cursiva' },
            { keys: ['Ctrl', 'H'], description: 'Insertar título' },
            { keys: ['Ctrl', 'L'], description: 'Insertar lista' },
            { keys: ['Ctrl', 'K'], description: 'Insertar enlace' },
            { keys: ['Ctrl', 'Z'], description: 'Deshacer' },
            { keys: ['Ctrl', 'Y'], description: 'Rehacer' },
        ]
    },
    {
        name: 'Herramientas',
        shortcuts: [
            { keys: ['Ctrl', 'I'], description: 'Variables inteligentes' },
            { keys: ['Ctrl', 'Shift', 'L'], description: 'Biblioteca de snippets' },
            { keys: ['Ctrl', 'V'], description: 'Historial de versiones' },
            { keys: ['Ctrl', 'A'], description: 'Análisis de compliance' },
        ]
    },
    {
        name: 'Navegación',
        shortcuts: [
            { keys: ['Tab'], description: 'Siguiente campo' },
            { keys: ['Shift', 'Tab'], description: 'Campo anterior' },
            { keys: ['↑'], description: 'Navegar arriba' },
            { keys: ['↓'], description: 'Navegar abajo' },
            { keys: ['Enter'], description: 'Seleccionar / Confirmar' },
        ]
    }
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
    isOpen,
    onClose
}) => {
    if (!isOpen) return null;

    const renderKey = (key: string) => {
        const iconMap: Record<string, React.ReactNode> = {
            '↑': <ArrowUp className="w-3 h-3" />,
            '↓': <ArrowDown className="w-3 h-3" />,
            'Enter': <CornerDownLeft className="w-3 h-3" />,
        };

        return (
            <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                {iconMap[key] || key}
            </kbd>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                            <Keyboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Atajos de Teclado</h3>
                            <p className="text-xs text-slate-500">Navega más rápido con el teclado</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="p-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SHORTCUTS.map((category) => (
                            <div key={category.name}>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Command className="w-4 h-4 text-indigo-500" />
                                    {category.name}
                                </h4>
                                
                                <div className="space-y-2">
                                    {category.shortcuts.map((shortcut, idx) => (
                                        <div 
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                        >
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {shortcut.description}
                                            </span>
                                            
                                            <div className="flex items-center gap-1">
                                                {shortcut.keys.map((key, keyIdx) => (
                                                    <React.Fragment key={keyIdx}>
                                                        {renderKey(key)}
                                                        {keyIdx < shortcut.keys.length - 1 && (
                                                            <span className="text-slate-400 mx-1">+</span>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-xs text-center text-slate-500">
                        Usa <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-bold">?</kbd> en cualquier momento para mostrar esta ayuda
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default KeyboardShortcutsModal;
