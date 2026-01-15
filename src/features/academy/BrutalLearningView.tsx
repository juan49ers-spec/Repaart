import React, { useState, useEffect } from 'react';
import {
    ChevronRight, ChevronLeft, ArrowLeft, Trophy,
    BookOpen, AlertTriangle
} from 'lucide-react';
import { AcademyModule } from '../../hooks/useAcademy';

// Color mapping fallback seguro
interface ThemeColor {
    bg: string;
    text: string;
    border: string;
    light: string;
    gradientFrom: string;
    gradientTo: string;
}

const BASE_COLORS: Record<string, ThemeColor> = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-500', light: 'bg-blue-50', gradientFrom: 'from-blue-600', gradientTo: 'to-blue-400' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-500', light: 'bg-emerald-50', gradientFrom: 'from-emerald-600', gradientTo: 'to-emerald-400' },
    sky: { bg: 'bg-sky-600', text: 'text-sky-600', border: 'border-sky-500', light: 'bg-sky-50', gradientFrom: 'from-sky-600', gradientTo: 'to-sky-400' },
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-500', light: 'bg-indigo-50', gradientFrom: 'from-indigo-600', gradientTo: 'to-indigo-400' },
    red: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-500', light: 'bg-rose-50', gradientFrom: 'from-rose-600', gradientTo: 'to-rose-400' }, // Mapped to Rose
    yellow: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', light: 'bg-amber-50', gradientFrom: 'from-amber-500', gradientTo: 'to-amber-400' }, // Mapped to Amber
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-500', light: 'bg-purple-50', gradientFrom: 'from-purple-600', gradientTo: 'to-purple-400' },
    pink: { bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-500', light: 'bg-pink-50', gradientFrom: 'from-pink-600', gradientTo: 'to-pink-400' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-500', light: 'bg-amber-50', gradientFrom: 'from-amber-600', gradientTo: 'to-amber-400' },
    slate: { bg: 'bg-slate-600', text: 'text-slate-600', border: 'border-slate-500', light: 'bg-slate-50', gradientFrom: 'from-slate-600', gradientTo: 'to-slate-400' },
    orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-500', light: 'bg-orange-50', gradientFrom: 'from-orange-600', gradientTo: 'to-orange-400' },
    teal: { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-500', light: 'bg-teal-50', gradientFrom: 'from-teal-600', gradientTo: 'to-teal-400' },
};

interface Category {
    id: string;
    name: string;
    color: string;
}

interface BrutalLearningViewProps {
    category: Category;
    modules?: AcademyModule[];
    onCompleteModule: (moduleId: string) => Promise<void>;
    onViewQuiz?: () => void;
    onBack: () => void;
    alreadyViewedIds?: string[];
}

export default function BrutalLearningView({
    category,
    modules = [],
    onCompleteModule,
    onViewQuiz,
    onBack,
    alreadyViewedIds = []
}: BrutalLearningViewProps) {
    // Derived state for initial index
    const [activeIndex, setActiveIndex] = useState(() => {
        if (!modules || modules.length === 0) return 0;
        const idx = modules.findIndex(m => !alreadyViewedIds.includes(m.id || ''));
        return idx === -1 ? 0 : idx;
    });

    const [showContext, setShowContext] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    useEffect(() => {
        setShowContext(false);
    }, [activeIndex]);

    // Derived state
    const theme = category ? (BASE_COLORS[category.color] || BASE_COLORS.indigo) : BASE_COLORS.indigo;
    const safeModules = modules || [];
    const currentModule = safeModules[activeIndex];
    const isModuleViewed = currentModule ? alreadyViewedIds.includes(currentModule.id || '') : false;
    const isLastModule = activeIndex === safeModules.length - 1;

    const handleNext = React.useCallback(async () => {
        if (!currentModule || isCompleting) return;
        try {
            if (!isModuleViewed) {
                setIsCompleting(true);
                if (currentModule.id) {
                    await onCompleteModule(currentModule.id);
                }
            }
            if (isLastModule) {
                if (onViewQuiz) onViewQuiz();
            } else {
                setActiveIndex(prev => prev + 1);
            }
        } catch (e) {
            console.error("Error completing module", e);
        } finally {
            setIsCompleting(false);
        }
    }, [currentModule, isCompleting, isModuleViewed, onCompleteModule, isLastModule, onViewQuiz]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && activeIndex > 0) {
                setActiveIndex(prev => prev - 1);
            }
            if (e.key === 'ArrowRight') {
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, handleNext]);


    if (!category) return <div className="p-4 text-rose-500">Error: Categoría no válida</div>;

    if (!currentModule) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-screen bg-slate-50 text-slate-400">
                <AlertTriangle size={48} className="mb-4 text-amber-500" />
                <h3 className="text-xl font-bold mb-2 text-slate-700">No se encontraron módulos</h3>
                <p>Categoría: {category.name}</p>
                <div className="mt-4">
                    <button onClick={onBack} className="text-white bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-700 transition">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const shortcuts = (
        <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-400 absolute bottom-6 right-6 opacity-50 hover:opacity-100 transition-opacity">
            <span className="flex items-center gap-1"><kbd className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">←</kbd> Anterior</span>
            <span className="flex items-center gap-1"><kbd className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">Explorar</kbd></span>
            <span className="flex items-center gap-1"><kbd className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">→</kbd> Siguiente</span>
        </div>
    );

    interface ExtendedModule extends AcademyModule {
        action?: string;
        content?: string;
    }

    const currentModuleExtended = currentModule as ExtendedModule;

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden text-slate-900 font-sans animate-in fade-in duration-300">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 ${theme.bg}`} />
                <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[140px] bg-slate-200/50" />
            </div>

            {/* Header */}
            <div className="relative z-10 px-6 py-4 flex flex-col gap-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                <div className="flex justify-between items-center">
                    <button onClick={onBack} className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                        <div className="p-2 rounded-full group-hover:bg-slate-100 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-bold text-sm hidden sm:block">Volver al mapa</span>
                    </button>

                    <div className="flex flex-col items-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-slate-100 bg-white ${theme.text}`}>
                            {category.name}
                        </span>
                    </div>

                    <div className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        <span className="text-slate-900 font-black">{activeIndex + 1}</span>
                        <span className="mx-1 opacity-30">/</span>
                        <span>{safeModules.length}</span>
                    </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="flex gap-1.5 h-1.5 w-full max-w-3xl mx-auto">
                    {safeModules.map((m, idx) => {
                        const isViewed = alreadyViewedIds.includes(m.id || '');
                        const isActive = idx === activeIndex;
                        const isPast = idx < activeIndex;

                        return (
                            <div
                                key={idx}
                                className={`flex-1 rounded-full transition-all duration-500 relative overflow-hidden ${isActive ? `bg-slate-900 scale-y-125` :
                                    isPast || isViewed ? theme.bg : 'bg-slate-200'
                                    }`}
                            >
                                {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto custom-scroll">
                <div
                    key={currentModule.id} // Triggers animation on change
                    className="w-full max-w-5xl mx-auto flex flex-col gap-10 items-center animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both"
                >
                    {/* Title Section */}
                    <div className="text-center space-y-4 max-w-3xl">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                            Módulo {currentModule.order || activeIndex + 1}
                        </h2>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                            {currentModule.title}
                        </h1>
                    </div>

                    {/* The "Card" - Action */}
                    <div className="w-full relative group perspective-1000">
                        <div className={`absolute inset-0 ${theme.bg} blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rounded-full`} />

                        <div className="relative bg-white/60 backdrop-blur-2xl border border-white/50 p-10 md:p-16 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center transition-transform duration-500 hover:scale-[1.01] hover:shadow-xl">

                            {/* Decorative corner accents */}
                            <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-slate-300 rounded-tl-lg opacity-50" />
                            <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-slate-300 rounded-tr-lg opacity-50" />
                            <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-slate-300 rounded-bl-lg opacity-50" />
                            <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-slate-300 rounded-br-lg opacity-50" />

                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest mb-10 shadow-sm">
                                <Trophy size={14} className="text-amber-500" />
                                Acción Clave
                            </span>

                            <p className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight md:leading-tight tracking-tight">
                                &quot;{currentModuleExtended.action || 'Completar Lecciones'}&quot;
                            </p>
                        </div>
                    </div>

                    {/* Context / Why */}
                    <div className="w-full max-w-3xl mx-auto mt-6">
                        <div className={`transition-all duration-500 overflow-hidden ${showContext ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BookOpen size={16} />
                                    Contexto Estratégico
                                </h4>
                                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                                    {currentModuleExtended.content || currentModule.description}
                                </p>
                            </div>
                        </div>

                        {!showContext && (
                            <button
                                onClick={() => setShowContext(true)}
                                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 py-4 text-sm font-bold transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors shadow-sm">
                                    <ChevronRight className="rotate-90 group-hover:translate-y-0.5 transition-transform" size={16} />
                                </div>
                                <span className="uppercase tracking-widest text-xs">Entender el porqué</span>
                            </button>
                        )}

                        {showContext && (
                            <button
                                onClick={() => setShowContext(false)}
                                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 py-6 text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                Ocultar contexto
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="relative z-20 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 md:p-6 pb-8 md:pb-6">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => activeIndex > 0 && setActiveIndex(prev => prev - 1)}
                        disabled={activeIndex === 0}
                        className="p-5 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {isLastModule && (safeModules.every(m => alreadyViewedIds.includes(m.id || ''))) ? (
                        <button
                            onClick={onViewQuiz}
                            className={`flex-1 group relative overflow-hidden rounded-2xl p-1 shadow-xl shadow-${category.color}-500/20 transition-transform active:scale-[0.99] hover:shadow-${category.color}-500/30`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}`} />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl h-full w-full flex items-center justify-center gap-3 py-4">
                                <span className="font-black text-xl text-white tracking-wide uppercase flex items-center gap-3 drop-shadow-sm">
                                    <Trophy size={24} className="text-yellow-300 drop-shadow" />
                                    Hacer Examen Final
                                </span>
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={isCompleting}
                            className={`flex-1 group relative overflow-hidden rounded-2xl p-[1px] shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed
                                ${isModuleViewed ? 'bg-slate-100 border border-slate-200' : `bg-slate-900`}
                            `}
                        >
                            <div className={`rounded-xl h-full w-full flex items-center justify-center gap-3 py-4 px-8 ${isModuleViewed ? 'bg-white' : 'bg-slate-900'}`}>
                                <span className={`font-bold text-lg tracking-wide flex items-center gap-2 ${isModuleViewed ? 'text-slate-500' : 'text-white'}`}>
                                    {isCompleting ? "Guardando..." : (isModuleViewed ? "Siguiente Lección" : "Entendido · Continuar")}
                                    <ChevronRight size={20} className={`transition-transform group-hover:translate-x-1 ${!isModuleViewed && 'text-emerald-400'}`} />
                                </span>
                            </div>
                        </button>
                    )}
                </div>
                {shortcuts}
            </div>
        </div>
    );
}
