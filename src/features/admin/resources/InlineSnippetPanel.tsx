import React, { useState, useMemo } from 'react';
import { Search, Star, Plus, Tag, Eye } from 'lucide-react';
import {
    ClauseSnippet,
    DEFAULT_SNIPPETS,
    SNIPPET_CATEGORIES,
    searchSnippets
} from './snippets/snippetLibrary';

interface InlineSnippetPanelProps {
    onInsertSnippet: (snippet: ClauseSnippet) => void;
}

const FAVORITES_KEY = 'repaart_snippet_favorites';

const InlineSnippetPanel: React.FC<InlineSnippetPanelProps> = ({ onInsertSnippet }) => {
    const [snippets] = useState<ClauseSnippet[]>(DEFAULT_SNIPPETS);
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null);

    const toggleFavorite = (snippetId: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(snippetId)) next.delete(snippetId);
            else next.add(snippetId);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
            return next;
        });
    };

    const filteredSnippets = useMemo(() => {
        let result = snippets;
        if (searchQuery) result = searchSnippets(result, searchQuery);
        if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
        return [...result].sort((a, b) => {
            const af = favorites.has(a.id) ? -1 : 0;
            const bf = favorites.has(b.id) ? -1 : 0;
            return af - bf;
        });
    }, [snippets, searchQuery, selectedCategory, favorites]);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar cláusula..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-white/5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 border border-slate-200/50 dark:border-white/5 transition-all"
                />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${!selectedCategory ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700'}`}
                >
                    Todas
                </button>
                {SNIPPET_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Snippet count */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {filteredSnippets.length} cláusulas disponibles
            </p>

            {/* Snippets list */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {filteredSnippets.map(snippet => (
                    <div
                        key={snippet.id}
                        className="group bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200/50 dark:border-white/5 hover:border-indigo-500/30 transition-all"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2 p-3">
                            <button
                                onClick={() => toggleFavorite(snippet.id)}
                                className="shrink-0"
                                title={favorites.has(snippet.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                            >
                                <Star className={`w-3.5 h-3.5 transition-colors ${favorites.has(snippet.id) ? 'text-amber-500 fill-amber-500' : 'text-slate-300 hover:text-amber-400'}`} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{snippet.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{snippet.category}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setExpandedSnippet(expandedSnippet === snippet.id ? null : snippet.id)}
                                    className="p-1.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 transition-colors"
                                    title="Previsualizar"
                                >
                                    <Eye className="w-3 h-3 text-slate-500" />
                                </button>
                                <button
                                    onClick={() => onInsertSnippet(snippet)}
                                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                                    title="Insertar cláusula"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Preview (expanded) */}
                        {expandedSnippet === snippet.id && (
                            <div className="px-3 pb-3 border-t border-slate-200/50 dark:border-white/5 pt-2">
                                <pre className="text-[10px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                    {snippet.content}
                                </pre>
                                <button
                                    onClick={() => onInsertSnippet(snippet)}
                                    className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                >
                                    Insertar al Documento
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {filteredSnippets.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-bold">Sin resultados</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InlineSnippetPanel;
