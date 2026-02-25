import React, { useState, useMemo } from 'react';
import {
    BookOpen,
    Search,
    Star,
    Plus,
    X,
    Tag,
    Eye,
    LayoutGrid
} from 'lucide-react';
import {
    ClauseSnippet,
    DEFAULT_SNIPPETS,
    SNIPPET_CATEGORIES,
    searchSnippets
} from './snippets/snippetLibrary';

interface SnippetLibraryProps {
    onInsertSnippet: (snippet: ClauseSnippet) => void;
    isOpen: boolean;
    onClose: () => void;
}

const FAVORITES_KEY = 'repaart_snippet_favorites';

export const SnippetLibrary: React.FC<SnippetLibraryProps> = ({
    onInsertSnippet,
    isOpen,
    onClose
}) => {
    const [snippets] = useState<ClauseSnippet[]>(DEFAULT_SNIPPETS);
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [previewSnippet, setPreviewSnippet] = useState<ClauseSnippet | null>(null);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Guardar favoritos
    const toggleFavorite = (snippetId: string) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(snippetId)) {
                newFavorites.delete(snippetId);
            } else {
                newFavorites.add(snippetId);
            }
            localStorage.setItem(FAVORITES_KEY, JSON.stringify([...newFavorites]));
            return newFavorites;
        });
    };

    // Filtrar snippets
    const filteredSnippets = useMemo(() => {
        let result = snippets;

        // Filtro de búsqueda
        if (searchQuery) {
            result = searchSnippets(result, searchQuery);
        }

        // Filtro de categoría
        if (selectedCategory) {
            result = result.filter(s => s.category === selectedCategory);
        }

        // Filtro de favoritos
        if (showFavoritesOnly) {
            result = result.filter(s => favorites.has(s.id));
        }

        return result;
    }, [snippets, searchQuery, selectedCategory, showFavoritesOnly, favorites]);

    // Snippets destacados (favoritos primero)
    const sortedSnippets = useMemo(() => {
        return [...filteredSnippets].sort((a, b) => {
            const aFav = favorites.has(a.id);
            const bFav = favorites.has(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });
    }, [filteredSnippets, favorites]);

    // Obtener conteo por categoría
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        snippets.forEach(s => {
            counts[s.category] = (counts[s.category] || 0) + 1;
        });
        return counts;
    }, [snippets]);

    const handleInsert = (snippet: ClauseSnippet) => {
        onInsertSnippet(snippet);
        setPreviewSnippet(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden">

                {/* Sidebar - Categories */}
                <div className="w-72 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/30">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-emerald-600 rounded-xl">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Biblioteca</h3>
                                <p className="text-xs text-slate-500">{snippets.length} cláusulas</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar cláusulas..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Favorites Toggle */}
                    <div className="px-4 py-3">
                        <button
                            onClick={() => {
                                setShowFavoritesOnly(!showFavoritesOnly);
                                setSelectedCategory(null);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${showFavoritesOnly
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                                <span className="text-sm font-medium">Favoritos</span>
                            </div>
                            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                {favorites.size}
                            </span>
                        </button>
                    </div>

                    {/* Categories List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 px-2">
                            Categorías
                        </h4>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setShowFavoritesOnly(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${!selectedCategory && !showFavoritesOnly
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <LayoutGrid className="w-4 h-4" />
                                    <span className="text-sm font-medium">Todas</span>
                                </div>
                                <span className="text-xs text-slate-400">{snippets.length}</span>
                            </button>

                            {SNIPPET_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setShowFavoritesOnly(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${selectedCategory === cat.id
                                        ? `bg-${cat.color}-100 dark:bg-${cat.color}-900/30 text-${cat.color}-700 dark:text-${cat.color}-400`
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <span className="text-sm font-medium capitalize">{cat.label}</span>
                                    <span className="text-xs text-slate-400">{categoryCounts[cat.id] || 0}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {showFavoritesOnly ? 'Cláusulas Favoritas' :
                                    selectedCategory ? SNIPPET_CATEGORIES.find(c => c.id === selectedCategory)?.label :
                                        'Todas las Cláusulas'}
                            </h4>
                            <p className="text-xs text-slate-500">
                                {sortedSnippets.length} resultados
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Snippets Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {sortedSnippets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="text-slate-500">No se encontraron cláusulas</p>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-2 text-sm text-emerald-600 hover:underline"
                                    >
                                        Limpiar búsqueda
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {sortedSnippets.map(snippet => {
                                    const category = SNIPPET_CATEGORIES.find(c => c.id === snippet.category);
                                    const isFav = favorites.has(snippet.id);

                                    return (
                                        <div
                                            key={snippet.id}
                                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-lg hover:border-emerald-300 transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${category?.color}-100 dark:bg-${category?.color}-900/30 text-${category?.color}-700 dark:text-${category?.color}-400 font-medium`}>
                                                            {category?.label}
                                                        </span>
                                                        {isFav && (
                                                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                                                        )}
                                                    </div>
                                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                        {snippet.title}
                                                    </h5>
                                                </div>

                                                <button
                                                    onClick={() => toggleFavorite(snippet.id)}
                                                    className={`p-2 rounded-lg transition-all ${isFav
                                                        ? 'text-amber-500 hover:bg-amber-50'
                                                        : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                                                </button>
                                            </div>

                                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                                {snippet.description}
                                            </p>

                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {snippet.tags.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-full"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setPreviewSnippet(snippet)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase transition-all"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Vista previa
                                                </button>
                                                <button
                                                    onClick={() => handleInsert(snippet)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Insertar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Modal */}
                {previewSnippet && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200"
                        onClick={() => setPreviewSnippet(null)}
                    >
                        <div
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{previewSnippet.title}</h4>
                                    <p className="text-xs text-slate-500">{previewSnippet.description}</p>
                                </div>
                                <button
                                    onClick={() => setPreviewSnippet(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs whitespace-pre-wrap leading-relaxed">
                                    {previewSnippet.content}
                                </pre>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {previewSnippet.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center gap-1"
                                        >
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setPreviewSnippet(null)}
                                    className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold text-sm hover:text-slate-900 transition-all"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => handleInsert(previewSnippet)}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Insertar cláusula
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SnippetLibrary;
