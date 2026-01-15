import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Search,
    BookOpen,
    Star,
    Sparkles,
    CheckCircle2,
    Clock,
    Trophy,
    Plus
} from 'lucide-react';
import { useEncyclopedia, EncyclopediaCard } from '../../hooks/useEncyclopedia';
import EncyclopediaCardItem from './EncyclopediaCardItem';
import EditEncyclopediaModal from './EditEncyclopediaModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { encyclopediaData } from './encyclopediaData';
import { db } from '../../lib/firebase';
import { collection, writeBatch, doc, getDocs, addDoc } from 'firebase/firestore';

const PAGE_SIZE = 200;

const EncyclopediaView: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const { cards, categories, loading, updateModule } = useEncyclopedia();
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Edit State
    const [editingCard, setEditingCard] = useState<EncyclopediaCard | null>(null);
    const [isCreating, setIsCreating] = useState(false);


    // Favorites System (LocalStorage)
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('encyclopedia_favorites');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('encyclopedia_favorites', JSON.stringify(favorites));
    }, [favorites]);

    // Read System (LocalStorage)
    const [readModules, setReadModules] = useState<string[]>(() => {
        const saved = localStorage.getItem('encyclopedia_read_ids');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('encyclopedia_read_ids', JSON.stringify(readModules));
    }, [readModules]);

    const handleToggleRead = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setReadModules(prev =>
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    }, []);

    const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    }, []);

    const handleRandomPick = () => {
        if (cards.length === 0) return;
        const randomCard = cards[Math.floor(Math.random() * cards.length)];

        // Reset filters to ensure visibility
        setSearch(randomCard.title); // Filter to just this card
        setSelectedCategory(null);
        setVisibleCount(PAGE_SIZE);
        setExpandedId(randomCard.id); // Auto-expand
    };

    const handleEdit = useCallback((card: EncyclopediaCard, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCard(card);
    }, []);

    const handleManualSeed = async () => {
        if (!isAdmin) return;
        if (!window.confirm(`¿ESTÁS SEGURO? La siembra manual usará el método antiguo. Para la nueva estructura, usa el boton 'Reinicializar Cursos' en Academy Studio.`)) return;
        // Legacy manual seed logic kept for fallback if needed, or removed to avoid confusion.
        // For now, let's just show a toast redirecting them.
        toast('Por favor usa el botón "Reinicializar Cursos" en el panel principal para la estructura v3.', { icon: 'ℹ️' });
    };

    const handleCreateModule = async (moduleData: Omit<EncyclopediaCard, 'id'>) => {
        if (!isAdmin) return;

        const loadingToast = toast.loading("Guardando nuevo módulo...");
        try {
            // Note: This writes to old flat collection logic unless updated. 
            // Depending on complexity, we might want to disable this or update to write to 'academy_encyclopedia_articles'
            // For now, let's write to articles and prompt for category ID?
            // Actually, simpler to just write to academy_encyclopedia_articles and assume category is passed as string title for now?
            // No, strictly it needs categoryId. 
            // Let's defer "Create Module" UI update for later as it's not the main task.
            // We'll write to the legacy 'academy_encyclopedia' for safety or just fail gracefully.
            // Wait, we are reading from 'academy_encyclopedia_articles'. 
            // Let's redirect writes there.

            const colRef = collection(db, 'academy_encyclopedia_articles');
            // We need a categoryId. The UI form sends 'category' name. We need to find the ID.
            const cat = categories.find(c => c.title === moduleData.category);
            const categoryId = cat ? cat.id : 'general'; // Fallback

            await addDoc(colRef, {
                ...moduleData,
                categoryId,
                isFeatured: false,
                createdAt: new Date().toISOString()
            });
            toast.success("¡Módulo añadido exitosamente!", { id: loadingToast });
            setIsCreating(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el módulo.", { id: loadingToast });
        }
    };

    const filteredCards = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        return cards.filter(card => {
            const matchesSearch =
                (card.title?.toLowerCase() || '').includes(lowerSearch) ||
                (card.content?.toLowerCase() || '').includes(lowerSearch) ||
                (card.category?.toLowerCase() || '').includes(lowerSearch);

            const matchesCategory = selectedCategory
                ? (selectedCategory === 'Favoritos' ? favorites.includes(card.id) :
                    selectedCategory === 'Destacados' ? card.isFeatured :
                        selectedCategory === 'Pendientes' ? !readModules.includes(card.id) :
                            card.category === selectedCategory)
                : true;

            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            // Sort by Featured first
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            // Then by Order if available
            if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
            return 0;
        });
    }, [cards, search, selectedCategory, favorites, readModules]);

    const visibleCards = useMemo(() => {
        return filteredCards.slice(0, visibleCount);
    }, [filteredCards, visibleCount]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setVisibleCount(PAGE_SIZE);
    };

    const handleCategorySelect = (category: string | null) => {
        setSelectedCategory(prev => prev === category ? null : category);
        setVisibleCount(PAGE_SIZE);
    };

    const handleToggleExpand = useCallback((id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const vs = window.speechSynthesis.getVoices();
            setVoices(vs);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    // Clean Text for TTS
    const cleanTextForTTS = useCallback((text: string) => {
        let clean = text;
        clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
        clean = clean.replace(/^\s*-\s+/gm, ', ');
        clean = clean.replace(/\|/g, ', ');
        clean = clean.replace(/\|---|/g, '');
        clean = clean.replace(/\n\n/g, '. ');
        clean = clean.replace(/\n/g, ', ');
        return clean;
    }, []);

    const handleToggleSpeak = useCallback((e: React.MouseEvent, card: EncyclopediaCard) => {
        e.stopPropagation();
        window.speechSynthesis.cancel();
        if (speakingId === card.id) {
            setSpeakingId(null);
            return;
        }

        const cleanTitle = cleanTextForTTS(card.title);
        const cleanContent = cleanTextForTTS(card.content);
        const cleanAction = card.action ? cleanTextForTTS(card.action) : '';
        const cleanExample = card.example ? cleanTextForTTS(card.example) : '';

        const text = `${cleanTitle}. ${cleanContent}. ${cleanAction ? `Acción: ${cleanAction}` : ''}. ${cleanExample ? `Ejemplo: ${cleanExample}` : ''}`;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";

        const preferredVoice = voices.find(v => v.name.includes('Google español')) ||
            voices.find(v => v.name.includes('Microsoft Helena')) ||
            voices.find(v => v.name.includes('Microsoft Laura')) ||
            voices.find(v => v.lang === 'es-ES' && v.name.includes('Google')) ||
            voices.find(v => v.lang === 'es-ES');

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => setSpeakingId(null);
        window.speechSynthesis.speak(utterance);
        setSpeakingId(card.id);
    }, [speakingId, voices, cleanTextForTTS]);

    const loadMore = useCallback(() => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    }, []);

    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                loadMore();
            }
        }, { threshold: 0.1 });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loadMore]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const totalModules = cards.length;
    const categoriesCount = categories.length; // Use loaded categories count
    const filteredCount = filteredCards.length;
    const hasMore = visibleCount < filteredCount;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="mb-6">
                    <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">
                        Enciclopedia <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Repaart 3.0</span>
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-relaxed mb-4">
                        Base de Conocimiento Ejecutivo · {totalModules} Módulos Tácticos
                    </p>
                    {isAdmin && (
                        <div className="mb-6 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 group">
                            <div className="flex-1">
                                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    Zona de Administración
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Gestión de base de conocimiento operativa.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-all active:scale-95"
                                    title="Añadir nuevo módulo"
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir Módulo
                                </button>
                                <button
                                    onClick={handleManualSeed}
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
                                    title="Restaurar base de datos completa"
                                >
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Regenerar (Legacy)
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="font-medium">{categoriesCount} Pilares</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="font-medium">{readModules.length} / {totalModules} Leídos</span>
                        </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                            <span>Progreso de Maestría</span>
                            <span>{Math.round((readModules.length / Math.max(totalModules, 1)) * 100)}% Completado</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out rounded-full relative"
                                style={{ width: `${(readModules.length / Math.max(totalModules, 1)) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Container */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative w-full group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por concepto, táctica o categoría..."
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-24 text-sm font-normal shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-slate-400"
                            />
                            {search && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-lg">
                                    {filteredCount}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleRandomPick}
                            className="flex-shrink-0 px-4 flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl shadow-sm transition-all active:scale-95"
                            title="Descubrir Módulo Aleatorio"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm font-medium">Inspírame</span>
                        </button>
                    </div>

                    {/* Category Pills (Dynamic) */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pb-2 px-4 md:px-0">
                        <button
                            onClick={() => handleCategorySelect(null)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCategory === null
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => handleCategorySelect('Favoritos')}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${selectedCategory === 'Favoritos'
                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200 border-amber-200 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-200 hover:text-amber-600'
                                }`}
                        >
                            <Star className={`w-3 h-3 ${selectedCategory === 'Favoritos' ? 'fill-current' : ''}`} />
                            Favoritos
                        </button>
                        <button
                            onClick={() => handleCategorySelect('Destacados')}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${selectedCategory === 'Destacados'
                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200 border-amber-200 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-200 hover:text-amber-600'
                                }`}
                        >
                            <Trophy className="w-3 h-3" />
                            Destacados
                        </button>
                        <button
                            onClick={() => handleCategorySelect('Pendientes')}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${selectedCategory === 'Pendientes'
                                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 border-indigo-200 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                        >
                            <Clock className="w-3 h-3" />
                            Por Leer
                        </button>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 flex-shrink-0" />

                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.title)}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCategory === cat.title
                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                                    }`}
                            >
                                {cat.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cards List using Memoized Component */}
            <div className="max-w-3xl mx-auto space-y-3 min-h-[50vh]">
                {visibleCards.map(card => (
                    <EncyclopediaCardItem
                        key={card.id}
                        card={card}
                        isExpanded={expandedId === card.id}
                        isSpeaking={speakingId === card.id}
                        isFavorite={favorites.includes(card.id)}
                        isAdmin={isAdmin}
                        isRead={readModules.includes(card.id)}
                        onToggleExpand={handleToggleExpand}
                        onToggleSpeak={handleToggleSpeak}
                        onToggleFavorite={toggleFavorite}
                        onToggleRead={handleToggleRead}
                        onEdit={handleEdit}
                    />
                ))}

                {filteredCards.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-400 dark:text-slate-600 mb-4">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                            {selectedCategory === 'Favoritos' ? 'No tienes favoritos aún' : 'No se encontraron resultados'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            {selectedCategory === 'Favoritos'
                                ? 'Marca módulos con la estrella para guardarlos aquí'
                                : 'Intenta con otros términos de búsqueda o filtros'}
                        </p>
                    </div>
                )}

                {/* Infinite Scroll Sentinel */}
                {hasMore && (
                    <div ref={loaderRef} className="py-8 flex justify-center">
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Edit Modal Component */}
            {editingCard && (
                <EditEncyclopediaModal
                    card={editingCard}
                    isOpen={!!editingCard}
                    onClose={() => setEditingCard(null)}
                    onSave={async (id, updates) => {
                        if (updateModule) {
                            await updateModule(id, updates);
                            setEditingCard(null);
                            toast.success("Módulo actualizado correctamente");
                        }
                    }}
                />
            )}

            {/* Create Module Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Añadir Nuevo Módulo</h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Cerrar">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            handleCreateModule({
                                title: formData.get('title') as string,
                                content: formData.get('content') as string,
                                category: formData.get('category') as string,
                                action: formData.get('action') as string,
                                isFeatured: false
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                                <input name="title" required className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Título del módulo" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                                <select name="category" required title="Selecciona una categoría" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                    {categories.map(cat => <option key={cat.id} value={cat.title}>{cat.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contenido</label>
                                <textarea name="content" required rows={6} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none" placeholder="Contenido del módulo..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Acción Principal</label>
                                <input name="action" required className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej: Implementar sistema de gestión..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                                    Guardar Módulo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EncyclopediaView;
