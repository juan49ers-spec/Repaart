import React from 'react';
import {
    Bold, Italic, List, ListOrdered, Link, Image, Video,
    Calculator, Code, Type, Quote, MoreHorizontal
} from 'lucide-react';

interface EditorToolbarProps {
    onInsert: (text: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsert }) => {
    const tools = [
        { icon: Bold, label: 'Negrita', action: '**texto**' },
        { icon: Italic, label: 'Cursiva', action: '*texto*' },
        { icon: Type, label: 'Título', action: '\n## Título\n' },
        { icon: Quote, label: 'Cita', action: '\n> Cita\n' },
        { icon: List, label: 'Lista', action: '\n- Item\n' },
        { icon: ListOrdered, label: 'Lista Num', action: '\n1. Item\n' },
        { icon: Code, label: 'Código', action: '\n```\ncódigo\n```\n' },
        { divider: true },
        { icon: Link, label: 'Enlace', action: '[texto](url)' },
        { icon: Image, label: 'Imagen', action: '![alt](url)' },
        { divider: true },
        { icon: Video, label: 'Video', action: '{{VIDEO:url_del_video}}' },
        { icon: Calculator, label: 'Calculadora', action: '{{WIDGET:calculator_profitability}}' },
        { icon: MoreHorizontal, label: 'Caso Estudio', action: '{{CASE:case_id}}' },
    ];

    return (
        <div className="flex items-center gap-1 p-2 bg-white border border-slate-200 rounded-t-xl border-b-0 overflow-x-auto">
            {tools.map((tool, index) => {
                if (tool.divider) {
                    return <div key={index} className="w-px h-6 bg-slate-200 mx-2 flex-shrink-0" />;
                }
                const Icon = tool.icon!;
                return (
                    <button
                        key={index}
                        onClick={() => onInsert(tool.action!)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title={tool.label}
                        type="button"
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
};
