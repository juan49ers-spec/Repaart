import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { generateGuideContent } from '../../../lib/gemini';
import { Plus, Save, Trash2, X, Type, PlayCircle, Search, Filter, ShieldAlert, Edit2, Sparkles, Wand2 } from 'lucide-react';
import { GUIDE_THEMES, GUIDE_ICONS } from '../../../lib/constants';

// Internal Interface for the Guide Form
interface GuideData {
    id?: string;
    title: string;
    description: string;
    category: string;
    theme: keyof typeof GUIDE_THEMES;
    icon: keyof typeof GUIDE_ICONS;
    isCritical: boolean;
    url?: string;
}

const INITIAL_FORM: GuideData = {
    title: '',
    description: '',
    category: 'operativa',
    theme: 'indigo',
    icon: 'FileText',
    isCritical: false,
    url: ''
};

const AdminGuidesPanel: React.FC = () => {
    // Main States
    const [guides, setGuides] = useState<GuideData[]>([]);
    const [selectedGuide, setSelectedGuide] = useState<GuideData | null>(null);
    const [formData, setFormData] = useState<GuideData>(INITIAL_FORM);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // AI Assistant States
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch Guides
    useEffect(() => {
        const q = query(collection(db, "guides"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setGuides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuideData)));
        }, (error) => {
            console.error("Error fetching guides:", error);
        });
        return () => unsubscribe();
    }, []);

    // AI Generation Handler
    // AI Generation Handler
    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateGuideContent(aiPrompt);
            if (result) {
                setFormData({
                    ...INITIAL_FORM,
                    title: result.title,
                    description: result.description,
                    category: result.category,
                    theme: result.theme as any,
                    icon: result.icon as any,
                    isCritical: result.isCritical,
                });
                setIsAiModalOpen(false);
                setIsDrawerOpen(true); // Open editor with result
                setAiPrompt(''); // Clear
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            if (error.message.includes("Invalid JSON")) {
                alert("La IA generó una respuesta pero no pudimos leerla correctamente (Error de formato). Por favor, intenta simplificar el texto o inténtalo de nuevo.");
            } else if (error.message.includes("No JSON structure")) {
                alert("La IA no devolvió un formato válido. Intenta ser más claro en tu petición.");
            } else {
                alert("Error de conexión o de la IA: " + (error.message || "Desconocido"));
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Standard Handlers
    const handleEdit = (guide: GuideData) => {
        setSelectedGuide(guide);
        setFormData(guide);
        setIsDrawerOpen(true);
    };

    const handleNew = () => {
        setSelectedGuide(null);
        setFormData(INITIAL_FORM);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedGuide(null);
            setFormData(INITIAL_FORM);
        }, 300); // Wait for animation
    };

    const handleSave = async () => {
        try {
            const dataToSave = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                theme: formData.theme,
                icon: formData.icon,
                isCritical: formData.isCritical,
                url: formData.url || '',
                updatedAt: serverTimestamp()
            };

            if (selectedGuide?.id) {
                await updateDoc(doc(db, "guides", selectedGuide.id), dataToSave);
            } else {
                await addDoc(collection(db, "guides"), {
                    ...dataToSave,
                    createdAt: serverTimestamp()
                });
            }
            handleCloseDrawer();
        } catch (error) {
            console.error("Error saving guide:", error);
            alert("Error al guardar la guía");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de querer borrar esta guía?")) return;
        try {
            await deleteDoc(doc(db, "guides", id));
            if (selectedGuide?.id === id) handleCloseDrawer();
        } catch (error) {
            console.error("Error deleting guide:", error);
        }
    };

    const filteredGuides = guides.filter(guide => {
        const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guide.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || guide.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Preview Helpers
    const PreviewIcon = GUIDE_ICONS[formData.icon];
    const themeStyles = GUIDE_THEMES[formData.theme];

    return (
        <div className="relative h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">

            {/* --- HEADER TOOLBAR --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 pb-2 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Guías</h2>
                    <p className="text-slate-500 text-sm font-medium">Administra los manuales y procedimientos visibles para la franquicia.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 w-48 focus:w-64 transition-all text-sm font-medium"
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            title="Filtrar por categoría"
                            className="appearance-none pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                            <option value="all">Todas las Categorías</option>
                            <option value="operativa">Operativa</option>
                            <option value="tecnico">Técnico</option>
                            <option value="rrhh">RRHH</option>
                            <option value="accidente">Accidentes</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30 border border-white/10"
                    >
                        <Sparkles className="w-4 h-4" /> AUTO-GENERAR
                    </button>

                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/30"
                    >
                        <Plus className="w-4 h-4" /> Nueva Guía
                    </button>
                </div>
            </div>

            {/* --- GRID CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {filteredGuides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredGuides.map(guide => {
                            const theme = GUIDE_THEMES[guide.theme];
                            const Icon = GUIDE_ICONS[guide.icon];

                            return (
                                <div
                                    key={guide.id}
                                    onClick={() => handleEdit(guide)}
                                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer overflow-hidden"
                                >
                                    {/* Edit Button Overlay */}
                                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            title="Editar guía"
                                            className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Icon & Badge */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                            <Icon className={`w-6 h-6 ${theme.text}`} />
                                        </div>
                                        {guide.isCritical && (
                                            <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                                                Crítico
                                            </span>
                                        )}
                                    </div>

                                    {/* Text */}
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {guide.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-4">
                                        {guide.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                                            {guide.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">
                                            Editar <PlayCircle className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <Search className="w-12 h-12 mb-4 text-slate-300" />
                        <p className="text-sm font-bold">No se encontraron guías</p>
                        <p className="text-xs">Intenta ajustar tu búsqueda o crea una nueva.</p>
                    </div>
                )}
            </div>

            {/* --- AI GENERATION MODAL --- */}
            {isAiModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAiModalOpen(false)} />

                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {/* Decor */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-fuchsia-500/20 blur-3xl rounded-full" />

                        <div className="relative">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Sparkles className="w-6 h-6 text-fuchsia-500" />
                                        Asistente IA
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Pega un texto borrador, un email o una nota rápida. Gemini estructurará la guía por ti.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsAiModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    title="Cerrar asistente IA"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ej: 'Avisar a todos que el lunes hay revisión de frenos obligatoria en el taller central de 9 a 14h. Es muy importante por seguridad.'"
                                className="w-full h-40 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all font-medium text-slate-700 dark:text-slate-200 resize-none mb-6 placeholder-slate-400"
                            />

                            <button
                                onClick={handleAiGenerate}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analizando y Redactando...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Generar Guía Automática
                                    </>
                                )}
                            </button>

                            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest opacity-60">
                                Powered by Google Gemini 2.5 Flash
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DRAWER (SLIDE-OVER) --- */}
            {/* Backdrop */}
            {isDrawerOpen && (
                <div
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={handleCloseDrawer}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={`absolute inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Drawer Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {selectedGuide ? 'Editar Guía' : 'Nueva Guía'}
                    </h3>
                    <div className="flex items-center gap-2">
                        {selectedGuide?.id && (
                            <button
                                onClick={() => handleDelete(selectedGuide.id!)}
                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors"
                                title="Eliminar Guía"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleCloseDrawer}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Cerrar editor"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Drawer Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                    {/* Live Preview Section (Sticky-ish feel) */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 relative group overflow-hidden">
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-[9px] font-bold uppercase tracking-widest text-slate-500">Vista Previa</div>

                        {/* Card Mockup */}
                        <div className="mt-4 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                            {/* Decorative Background Icon */}
                            <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                                <PreviewIcon className={`w-32 h-32 ${themeStyles.text}`} />
                            </div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`w-12 h-12 rounded-xl ${themeStyles.bg} flex items-center justify-center`}>
                                    <PreviewIcon className={`w-6 h-6 ${themeStyles.text}`} />
                                </div>
                                {formData.isCritical && (
                                    <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shadow-sm">
                                        Crítico
                                    </span>
                                )}
                            </div>

                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{formData.title || 'Tu Título Aquí'}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{formData.description || 'La descripción de tu guía aparecerá aquí...'}</p>

                            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span className={`text-[9px] font-bold uppercase ${themeStyles.text}`}>Ver Documento</span>
                                <PlayCircle className={`w-4 h-4 ${themeStyles.text}`} />
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    <Type className="w-3 h-3" /> Título
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/50 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder="Ej: Protocolo de Apertura"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Categoría</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm text-slate-700 dark:text-slate-200"
                                >
                                    <option value="operativa">Operativa</option>
                                    <option value="tecnico">Técnico</option>
                                    <option value="accidente">Accidentes</option>
                                    <option value="rrhh">Recursos Humanos</option>
                                </select>
                            </div>

                            {/* Critical Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Importancia</label>
                                <button
                                    onClick={() => setFormData({ ...formData, isCritical: !formData.isCritical })}
                                    className={`w-full px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide ${formData.isCritical
                                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                                        }`}
                                >
                                    {formData.isCritical ? <ShieldAlert className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                                    {formData.isCritical ? 'Crítico' : 'Normal'}
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium text-slate-600 dark:text-slate-300 placeholder-slate-400 resize-none"
                                placeholder="Breve resumen del contenido..."
                            />
                        </div>

                        {/* URL */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Enlace de Destino</label>
                            <input
                                type="text"
                                value={formData.url}
                                onChange={e => setFormData({ ...formData, url: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-medium text-sm text-blue-600 dark:text-blue-400"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Visual Selectors */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">

                            {/* Color Theme */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Color del Tema</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(GUIDE_THEMES).map(([key, theme]) => (
                                        <button
                                            key={key}
                                            onClick={() => setFormData({ ...formData, theme: key as any })}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${formData.theme === key
                                                ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                                                : 'opacity-50 hover:opacity-100 hover:scale-105'
                                                } ${theme.bg}`}
                                            title={theme.label}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${theme.bg.replace('bg-', 'bg-').replace('50', '500').replace('900/20', '500')}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Icons - Horizontal Scroll */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Icono</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    {Object.entries(GUIDE_ICONS).map(([name, Icon]) => (
                                        <button
                                            key={name}
                                            onClick={() => setFormData({ ...formData, icon: name as any })}
                                            title={`Seleccionar icono ${name}`}
                                            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.icon === name
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform -translate-y-1'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="h-20" /> {/* Spacer */}
                </div>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={handleCloseDrawer}
                        className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminGuidesPanel;
