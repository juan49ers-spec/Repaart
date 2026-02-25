import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Type, AlignLeft, Hash, Save, FileText, Sparkles } from 'lucide-react';
import SmartVariablePicker from './SmartVariablePicker';
import { calculateSmartVariables } from './variables/smartVariables';

interface ContractTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholders?: string[];
}

export const ContractTextEditor: React.FC<ContractTextEditorProps> = ({
    value,
    onChange,
    placeholders = []
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [showPlaceholderHint, setShowPlaceholderHint] = useState(false);
    const [placeholderSearch, setPlaceholderSearch] = useState('');
    const [isVariablePickerOpen, setIsVariablePickerOpen] = useState(false);

    // Estadísticas derivadas (sin setState en effect)
    const wordCount = useMemo(() => value.trim().split(/\s+/).filter(w => w.length > 0).length, [value]);
    const charCount = value.length;

    // Función para insertar variable inteligente
    const insertSmartVariable = (key: string, value: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const variableText = `[${key}]`;

        const newText = value.substring(0, cursorPos) + variableText + value.substring(cursorPos);
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos + variableText.length, cursorPos + variableText.length);
        }, 0);
    };

    // Reemplazar automáticamente variables calculadas
    const replaceCalculatedVariables = () => {
        let newContent = value;
        const calculatedVars = calculateSmartVariables();

        Object.entries(calculatedVars).forEach(([key, val]) => {
            const regex = new RegExp(`\\[${key}\\]`, 'g');
            newContent = newContent.replace(regex, val);
        });

        if (newContent !== value) {
            onChange(newContent);
        }
    };

    // Auto-save en localStorage cada 30 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            if (value) {
                localStorage.setItem('contract_draft_autosave', JSON.stringify({
                    content: value,
                    timestamp: new Date().toISOString()
                }));
                setLastSaved(new Date());
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [value]);

    const insertMarkdown = useCallback((before: string, after: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newText);

        // Restaurar selección
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    }, [value, onChange]);

    const insertAtLineStart = useCallback((insert: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastNewline = textBeforeCursor.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

        const newText = value.substring(0, lineStart) + insert + value.substring(lineStart);
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos + insert.length, cursorPos + insert.length);
        }, 0);
    }, [value, onChange]);

    // Atajos de teclado
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Ctrl/Cmd + B: Bold
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            insertMarkdown('**', '**');
        }
        // Ctrl/Cmd + I: Italic
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            insertMarkdown('*', '*');
        }
        // Ctrl/Cmd + K: Link
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            insertMarkdown('[', '](url)');
        }
        // Ctrl/Cmd + H: Heading
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            insertAtLineStart('## ');
        }
        // Ctrl/Cmd + L: List
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            insertAtLineStart('- ');
        }
        // Ctrl/Cmd + S: Trigger save indicator
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            localStorage.setItem('contract_draft_autosave', JSON.stringify({
                content: value,
                timestamp: new Date().toISOString()
            }));
            setLastSaved(new Date());
        }
        // [: Mostrar hint de placeholders
        if (e.key === '[') {
            setShowPlaceholderHint(true);
            setPlaceholderSearch('');
        }
        // Escape: Cerrar hint
        if (e.key === 'Escape') {
            setShowPlaceholderHint(false);
        }
    }, [value, insertMarkdown, insertAtLineStart]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursor = e.target.selectionStart;

        setCursorPosition(cursor);
        onChange(newValue);

        // Detectar búsqueda de placeholder
        const textBeforeCursor = newValue.substring(0, cursor);
        const openBracketIndex = textBeforeCursor.lastIndexOf('[');
        if (openBracketIndex !== -1 && !textBeforeCursor.substring(openBracketIndex).includes(']')) {
            const search = textBeforeCursor.substring(openBracketIndex + 1);
            setPlaceholderSearch(search.toLowerCase());
            setShowPlaceholderHint(true);
        } else {
            setShowPlaceholderHint(false);
        }
    };

    const insertPlaceholder = (placeholder: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const openBracketIndex = textBeforeCursor.lastIndexOf('[');

        const newText = value.substring(0, openBracketIndex) + `[${placeholder}]` + value.substring(cursorPos);
        onChange(newText);
        setShowPlaceholderHint(false);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(openBracketIndex + placeholder.length + 2, openBracketIndex + placeholder.length + 2);
        }, 0);
    };

    const filteredPlaceholders = placeholders.filter(p =>
        p.toLowerCase().includes(placeholderSearch)
    );

    return (
        <div className="space-y-3 h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Editor Pro
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsVariablePickerOpen(true)}
                        className="text-[9px] text-indigo-400 hover:text-indigo-500 transition-colors px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center gap-1"
                    >
                        <Sparkles className="w-3 h-3" />
                        Variables
                    </button>
                    <button
                        onClick={() => setShowShortcuts(!showShortcuts)}
                        className="text-[9px] text-slate-400 hover:text-indigo-500 transition-colors px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
                    >
                        ⌘ Atajos
                    </button>
                    <button
                        onClick={replaceCalculatedVariables}
                        className="text-[9px] text-emerald-400 hover:text-emerald-500 transition-colors px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30"
                    >
                        Calcular fechas
                    </button>
                    {lastSaved && (
                        <span className="text-[9px] text-emerald-500 flex items-center gap-1">
                            <Save className="w-3 h-3" />
                            Guardado {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Shortcuts Panel */}
            {showShortcuts && (
                <div className="bg-slate-800 rounded-xl p-3 text-xs space-y-2 animate-in fade-in">
                    <div className="flex justify-between text-slate-300"><span>Ctrl+B</span><span className="text-slate-500">Negrita</span></div>
                    <div className="flex justify-between text-slate-300"><span>Ctrl+I</span><span className="text-slate-500">Cursiva</span></div>
                    <div className="flex justify-between text-slate-300"><span>Ctrl+H</span><span className="text-slate-500">Título</span></div>
                    <div className="flex justify-between text-slate-300"><span>Ctrl+L</span><span className="text-slate-500">Lista</span></div>
                    <div className="flex justify-between text-slate-300"><span>Ctrl+S</span><span className="text-slate-500">Guardar borrador</span></div>
                </div>
            )}

            {/* Placeholder Hint */}
            {showPlaceholderHint && filteredPlaceholders.length > 0 && (
                <div className="bg-indigo-900/50 border border-indigo-700 rounded-xl p-2 max-h-32 overflow-y-auto">
                    <div className="text-[9px] text-indigo-300 mb-1 font-bold uppercase tracking-wider">Placeholders disponibles:</div>
                    <div className="flex flex-wrap gap-1">
                        {filteredPlaceholders.map(p => (
                            <button
                                key={p}
                                onClick={() => insertPlaceholder(p)}
                                className="text-[10px] px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded transition-colors"
                            >
                                [{p}]
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Editor Container with Syntax Highlighting Simulation */}
            <div className="relative flex-1 min-h-[300px]">
                <textarea
                    ref={textareaRef}
                    id="contract-editor-pro"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="absolute inset-0 w-full h-full bg-slate-900 text-indigo-100/90 p-4 rounded-2xl font-mono text-[11px] leading-relaxed border border-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 custom-scrollbar resize-none whitespace-pre-wrap"
                    placeholder="# Escribe tu contrato en Markdown...

Ejemplo:
# CONTRATO DE SERVICIOS

Entre [NOMBRE_DEL_FRANQUICIADO], CIF [CIF_FRANQUICIA]...

## Cláusula 1
El objeto del presente contrato..."
                    spellCheck={false}
                />

                {/* Highlight overlay for placeholders */}
                <div
                    className="absolute inset-0 p-4 font-mono text-[11px] leading-relaxed pointer-events-none overflow-hidden whitespace-pre-wrap break-words opacity-0"
                    aria-hidden="true"
                >
                    {value.split(/(\[[A-Z0-9_ÁÉÍÓÚÑ\s/]+\])/gi).map((part, i) => {
                        const isPlaceholder = /^\[[A-Z0-9_ÁÉÍÓÚÑ\s/]+\]$/i.test(part);
                        return isPlaceholder ? (
                            <mark key={i} className="bg-indigo-500/30 text-indigo-300 rounded px-0.5">{part}</mark>
                        ) : (
                            <span key={i}>{part}</span>
                        );
                    })}
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                        <Type className="w-3 h-3" />
                        {wordCount.toLocaleString()} palabras
                    </span>
                    <span className="flex items-center gap-1">
                        <AlignLeft className="w-3 h-3" />
                        {charCount.toLocaleString()} caracteres
                    </span>
                    <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {placeholders.length} placeholders
                    </span>
                </div>
                <div className="text-[10px] text-slate-600">
                    Posición: {cursorPosition}
                </div>
            </div>

            {/* Smart Variable Picker */}
            <SmartVariablePicker
                isOpen={isVariablePickerOpen}
                onClose={() => setIsVariablePickerOpen(false)}
                onInsertVariable={insertSmartVariable}
            />
        </div>
    );
};

export default ContractTextEditor;
