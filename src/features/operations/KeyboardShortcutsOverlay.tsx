import React, { useState, useEffect } from 'react';
import { X, Command } from 'lucide-react';

const KeyboardShortcutsOverlay: React.FC = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Toggle overlay with '?'
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setShow(prev => !prev);
            }
            // Close with Escape
            if (e.key === 'Escape' && show) {
                setShow(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [show]);

    if (!show) {
        return (
            <button
                onClick={() => setShow(true)}
                className="fixed bottom-6 left-6 p-3 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/50 rounded-lg shadow-lg backdrop-blur-sm transition-all hover:scale-105 z-40"
                title="Keyboard Shortcuts (Press ?)"
            >
                <Command className="w-5 h-5 text-slate-300" />
            </button>
        );
    }

    interface Shortcut {
        key: string;
        description: string;
    }

    const shortcuts: Shortcut[] = [
        { key: '?', description: 'Mostrar/ocultar este panel' },
        { key: 'N', description: 'Nuevo turno' },
        { key: '←', description: 'Semana anterior' },
        { key: '→', description: 'Semana siguiente' },
        { key: 'P', description: 'Exportar PDF' },
        { key: 'C', description: 'Comparar semanas' },
        { key: 'S', description: 'Guardar cambios (Ctrl+S)' },
        { key: 'ESC', description: 'Cerrar modal/panel' },
    ];

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Command className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Atajos de Teclado</h2>
                    </div>
                    <button
                        onClick={() => setShow(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-2">
                    {shortcuts.map((shortcut, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-700/30"
                        >
                            <span className="text-slate-300">{shortcut.description}</span>
                            <kbd className="px-3 py-1 bg-slate-800 border border-slate-600 rounded font-mono text-sm text-blue-400 shadow-sm">
                                {shortcut.key}
                            </kbd>
                        </div>
                    ))}
                </div>

                <div className="mt-4 text-xs text-slate-500 text-center">
                    Presiona <kbd className="px-2 py-0.5 bg-slate-800 rounded">?</kbd> en cualquier momento
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsOverlay;
