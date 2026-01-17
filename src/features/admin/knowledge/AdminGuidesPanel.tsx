import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { generateGuideContent } from '../../../lib/gemini';
import { Plus, Save, Trash2, X, Type, PlayCircle, Search, Filter, ShieldAlert, Edit2, Sparkles, Wand2, FileText, Layout } from 'lucide-react';
import { GUIDE_THEMES, GUIDE_ICONS } from '../../../lib/constants';
import ReactMarkdown from 'react-markdown';

// Internal Interface for the Guide Form
interface GuideData {
    id?: string;
    title: string;
    description: string;
    content?: string; // Markdown Content
    category: string;
    theme: keyof typeof GUIDE_THEMES;
    icon: keyof typeof GUIDE_ICONS;
    isCritical: boolean;
    url?: string;
}

const INITIAL_FORM: GuideData = {
    title: '',
    description: '',
    content: '',
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
    const [previewMode, setPreviewMode] = useState<'card' | 'full'>('full'); // 'card' or 'full'

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
                    content: result.content || result.description, // Fallback to desc if no content
                    category: result.category,
                    theme: result.theme as any,
                    icon: result.icon as any,
                    isCritical: result.isCritical,
                });
                setIsAiModalOpen(false);
                setIsDrawerOpen(true); // Open editor with result
                setPreviewMode('full'); // Show full content
                setAiPrompt(''); // Clear
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            if (error.message && error.message.includes("Invalid JSON")) {
                alert("La IA generó una respuesta pero no pudimos leerla correctamente (Error de formato). Por favor, intenta simplificar el texto o inténtalo de nuevo.");
            } else if (error.message && error.message.includes("No JSON structure")) {
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
        setFormData({ ...guide, content: guide.content || guide.description }); // Ensure content exists
        setIsDrawerOpen(true);
        setPreviewMode('full');
    };

    const handleNew = () => {
        setSelectedGuide(null);
        setFormData(INITIAL_FORM);
        setIsDrawerOpen(true);
        setPreviewMode('card');
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
                content: formData.content || '',
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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Guías</h2>
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
                            aria-label="Filtrar por categoría"
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
                                            <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
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
                                            Leer Guía <PlayCircle className="w-3 h-3" />
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
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Sparkles className="w-6 h-6 text-fuchsia-500" />
                                        Asistente IA
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Pega un texto borrador, un email o una nota. Gemini estructurará la guía completa por ti.
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
                                placeholder="Ej: 'Cómo gestionar un accidente leve con la moto. Paso 1: llamar al seguro 91000... Paso 2: avisar al coordinador...'"
                                className="w-full h-40 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all font-medium text-slate-700 dark:text-slate-200 resize-none mb-6 placeholder-slate-400"
                            />

                            <button
                                onClick={handleAiGenerate}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Redactando Guía...
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

            {/* --- DRAWER (EDITOR) --- */}
            {/* Backdrop */}
            {isDrawerOpen && (
                <div
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={handleCloseDrawer}
                />
            )}

            {/* Drawer Panel - WIDER FOR DOCUMENT EDITING */}
            <div
                className={`absolute inset-y-0 right-0 w-full md:w-[800px] lg:w-[900px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Drawer Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleCloseDrawer}
                            title="Cerrar Editor"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {selectedGuide ? 'Editar Guía' : 'Nueva Guía'}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Preview Switcher */}
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex items-center">
                            <button
                                onClick={() => setPreviewMode('card')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${previewMode === 'card'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <Layout className="w-3 h-3" /> Tarjeta
                            </button>
                            <button
                                onClick={() => setPreviewMode('full')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${previewMode === 'full'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <FileText className="w-3 h-3" /> Documento
                            </button>
                        </div>

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
                            onClick={handleSave}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 text-xs"
                        >
                            <Save className="w-3 h-3" />
                            Guardar
                        </button>
                    </div>
                </div>

                {/* Drawer Content - Split View */}
                <div className="flex-1 overflow-y-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">

                    {/* LEFT: FORM & EDITOR */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                        {/* Metadata Fields Condensed */}
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 font-bold text-lg text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder="Título de la Guía"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200"
                                    aria-label="Categoría"
                                >
                                    <option value="operativa">Operativa</option>
                                    <option value="tecnico">Técnico</option>
                                    <option value="accidente">Accidentes</option>
                                    <option value="rrhh">Recursos Humanos</option>
                                </select>

                                <button
                                    onClick={() => setFormData({ ...formData, isCritical: !formData.isCritical })}
                                    className={`w-full px-4 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide ${formData.isCritical
                                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                                        }`}
                                >
                                    {formData.isCritical ? <ShieldAlert className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                    {formData.isCritical ? 'Crítico' : 'Normal'}
                                </button>
                            </div>

                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 placeholder-slate-400 resize-none"
                                placeholder="Resumen corto para la tarjeta (Máx 2 frases)..."
                            />
                        </div>

                        {/* CONTENT EDITOR */}
                        <div className="flex-1 flex flex-col h-[500px]">
                            <label className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">
                                <span className="flex items-center gap-2"><Type className="w-3 h-3" /> Contenido (Markdown)</span>
                                <span className="text-[10px] text-indigo-500 cursor-help" title="Usa # para Títulos, - para listas, ** para negrita">¿Ayuda de formato?</span>
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="flex-1 w-full p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm text-slate-800 dark:text-slate-200 resize-none leading-relaxed"
                                placeholder="# Introducción\nEscribe aquí tu guía completa...\n\n## Paso 1\n..."
                            />
                        </div>

                        {/* Visual Selectors (Collapsed by default logic, but showing here for now) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Icono</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                    {Object.entries(GUIDE_ICONS).map(([name, Icon]) => (
                                        <button
                                            key={name}
                                            onClick={() => setFormData({ ...formData, icon: name as any })}
                                            title={name}
                                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${formData.icon === name
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Color</label>
                                <div className="flex gap-2">
                                    {Object.entries(GUIDE_THEMES).map(([key, theme]) => (
                                        <button
                                            key={key}
                                            onClick={() => setFormData({ ...formData, theme: key as any })}
                                            title={key}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${formData.theme === key ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-40 hover:opacity-100'} ${theme.bg}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PREVIEW AREA */}
                    <div className={`md:w-1/2 bg-white dark:bg-slate-950 flex flex-col ${previewMode === 'card' ? 'bg-slate-100 dark:bg-slate-900 items-center justify-center' : ''}`}>

                        {previewMode === 'card' ? (
                            <div className="w-full max-w-sm p-8">
                                <div className="text-center mb-4 text-xs font-bold uppercase text-slate-400 tracking-widest">Vista de Tarjeta</div>
                                {/* Card Mockup */}
                                <div className="bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
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

                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{formData.title || 'Título de la Guía'}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{formData.description || 'Descripción corta...'}</p>

                                    <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <span className={`text-[9px] font-bold uppercase ${themeStyles.text}`}>Ver Documento</span>
                                        <PlayCircle className={`w-4 h-4 ${themeStyles.text}`} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg ${themeStyles.bg} flex items-center justify-center`}>
                                                <PreviewIcon className={`w-4 h-4 ${themeStyles.text}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{formData.title || 'Sin Título'}</h4>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{formData.category} &bull; Lectura estimada: 5 min</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MARKDOWN PREVIEW CONTENT */}
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <article className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:text-indigo-600 dark:prose-h2:text-indigo-400 prose-a:text-indigo-500 hover:prose-a:text-indigo-600 prose-img:rounded-xl prose-hr:border-slate-200 dark:prose-hr:border-slate-800">
                                        {formData.content ? (
                                            <ReactMarkdown>{formData.content}</ReactMarkdown>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
                                                <FileText className="w-12 h-12 mb-2 opacity-50" />
                                                <p>Escribe en el editor para ver el resultado en tiempo real.</p>
                                            </div>
                                        )}
                                    </article>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGuidesPanel;
