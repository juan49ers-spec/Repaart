import React, { memo, useState } from 'react';
import {
    Target,
    Volume2,
    VolumeX,
    Lightbulb,
    TrendingUp,
    CreditCard,
    Truck,
    Users,
    ShieldCheck,
    Cpu,
    BookOpen,
    Star,
    Pencil,
    CheckCircle2,
    Share2,
    Copy,
    Check
} from 'lucide-react';
import { EncyclopediaCard } from '../../hooks/useEncyclopedia';
import toast from 'react-hot-toast';

const categoryIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
    "Estrategia": TrendingUp,
    "Finanzas": CreditCard,
    "Operativa": Truck,
    "RRHH": Users,
    "Comercial": Target,
    "Tecnología": Cpu,
    "Calidad": ShieldCheck,
    "Seguridad": ShieldCheck,
    "Liderazgo": BookOpen
};

const categoryGradients: Record<string, string> = {
    "Estrategia": "from-violet-500 to-purple-600",
    "Finanzas": "from-emerald-400 to-teal-600",
    "Operativa": "from-blue-500 to-indigo-600",
    "RRHH": "from-orange-400 to-pink-500",
    "Comercial": "from-pink-500 to-rose-600",
    "Tecnología": "from-indigo-500 to-cyan-600",
    "Calidad": "from-amber-400 to-orange-500",
    "Seguridad": "from-red-500 to-rose-600",
    "Liderazgo": "from-cyan-500 to-blue-600"
};

interface EncyclopediaCardItemProps {
    card: EncyclopediaCard;
    isExpanded: boolean;
    isSpeaking: boolean;
    isFavorite?: boolean;
    isAdmin?: boolean;
    isRead?: boolean;
    onToggleExpand: (id: string) => void;
    onToggleSpeak: (e: React.MouseEvent, card: EncyclopediaCard) => void;
    onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
    onEdit?: (card: EncyclopediaCard, e: React.MouseEvent) => void;
    onToggleRead?: (id: string, e: React.MouseEvent) => void;
}

const EncyclopediaCardItem = memo(({
    card,
    isExpanded,
    isSpeaking,
    isFavorite,
    isAdmin,
    isRead,
    onToggleExpand,
    onToggleSpeak,
    onToggleFavorite,
    onEdit,
    onToggleRead
}: EncyclopediaCardItemProps) => {
    const Icon = categoryIcons[card.category] || Target;
    const gradient = categoryGradients[card.category] || "from-slate-500 to-slate-700";
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = `${card.title}\n\n${card.content}\n\nAcción: ${card.action}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Contenido copiado");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = `${card.title}\n\n${card.content}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: card.title,
                    text: text,
                    url: window.location.href
                });
            } catch {
                console.log('Share canceled');
            }
        } else {
            handleCopy(e);
        }
    };

    return (
        <div
            className={`group relative bg-white dark:bg-slate-900 rounded-[2rem] border transition-all duration-500 overflow-hidden
                ${isExpanded
                    ? 'border-indigo-500/30 shadow-2xl shadow-indigo-500/10 scale-[1.02]'
                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:-translate-y-1'
                }
            `}
        >
            {/* Header Gradient Strip with Glassmorphism */}
            <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-br ${gradient} opacity-10 transition-all duration-500 ${isExpanded ? 'h-full opacity-5' : ''}`} />

            {/* Featured Badge - Modern Design */}
            {card.isFeatured && (
                <div className="absolute top-4 right-4 z-20">
                    <div className={`bg-gradient-to-r ${gradient} text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20 flex items-center gap-1.5`}>
                        <Star className="w-3 h-3 fill-white" />
                        Premium
                    </div>
                </div>
            )}

            {/* Main Clickable Content Area */}
            <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded ? "true" : "false"}
                onClick={() => onToggleExpand(card.id)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleExpand(card.id);
                    }
                }}
                className="relative z-10 p-6 md:p-8 flex flex-col items-center text-center outline-none"
            >
                {/* Dynamic Icon Container - Centered & Larger */}
                <div className={`relative shrink-0 mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} blur-2xl opacity-20 group-hover:opacity-50 transition-opacity`} />
                    <div className={`relative w-16 h-16 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20`}>
                        {isRead ? <CheckCircle2 className="w-7 h-7" /> : <Icon className="w-7 h-7" />}
                    </div>
                </div>

                <div className="w-full max-w-2xl">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className={`text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400`}>
                            {card.category}
                        </span>
                        {isRead && (
                            <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <CheckCircle2 className="w-3 h-3" />
                                Leído
                            </span>
                        )}
                    </div>

                    <h3 className={`font-bold text-slate-900 dark:text-white leading-tight mb-4 transition-all duration-300 ${isExpanded ? 'text-3xl md:text-4xl tracking-tight' : 'text-xl md:text-2xl'}`}>
                        {card.title}
                    </h3>

                    {!isExpanded && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base line-clamp-2 leading-relaxed font-normal mx-auto max-w-prose">
                            {card.content}
                        </p>
                    )}
                </div>


                <div
                    className={`nav-content w-full text-left transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-10' : 'grid-rows-[0fr] opacity-0 hidden'}`}
                >
                    <div className="overflow-hidden min-h-0 cursor-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
                            {card.content.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className={`text-slate-600 dark:text-slate-300 text-lg leading-8 ${idx === 0 ? 'first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-slate-900 dark:first-letter:text-white' : ''}`}>
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Action Card */}
                            <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 relative overflow-hidden group/action hover:shadow-lg transition-all">
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Acción Inmediata
                                </h4>
                                <p className="text-base text-slate-700 dark:text-indigo-100 font-medium leading-relaxed">
                                    {card.action}
                                </p>
                            </div>

                            {/* Example Card */}
                            {card.example && (
                                <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 relative overflow-hidden group/example hover:shadow-lg transition-all">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-orange-500" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5" />
                                        Caso Real
                                    </h4>
                                    <p className="text-base text-slate-700 dark:text-amber-100 italic leading-relaxed">
                                        &quot;{card.example}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Control Bar */}
            <div className={`px-6 md:px-8 py-4 flex items-center justify-between transition-all duration-500 z-20 relative ${isExpanded ? 'bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/50 backdrop-blur-sm' : 'bg-transparent border-t border-transparent group-hover:border-slate-50/50'}`}>
                {/* Audio Control */}
                <button
                    onClick={(e) => onToggleSpeak(e, card)}
                    className={`flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider transition-all px-4 py-2 rounded-full transform active:scale-95 ${isSpeaking
                        ? 'text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 animate-pulse'
                        : 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-900 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-900 shadow-sm'
                        }`}
                >
                    {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {isSpeaking ? 'Escuchando...' : 'Escuchar'}
                </button>

                <div className="flex items-center gap-2">
                    {/* Share & Copy Actions */}
                    {isExpanded && (
                        <>
                            <button
                                onClick={handleCopy}
                                className="p-2.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                                title="Copiar texto"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                                title="Compartir"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                        </>
                    )}

                    {!isAdmin && onToggleRead && (
                        <button
                            onClick={(e) => onToggleRead(card.id, e)}
                            className={`p-2.5 rounded-full transition-all duration-300 ${isRead
                                ? 'text-white bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-110'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                }`}
                            title={isRead ? "Marcar no leído" : "Marcar leído"}
                        >
                            <CheckCircle2 className="w-5 h-5" />
                        </button>
                    )}

                    {onToggleFavorite && (
                        <button
                            onClick={(e) => onToggleFavorite(card.id, e)}
                            className={`p-2.5 rounded-full transition-all duration-300 ${isFavorite
                                ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-lg shadow-amber-500/10 scale-110'
                                : 'text-slate-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                }`}
                            title="Favoritos"
                        >
                            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    )}

                    {isAdmin && onEdit && (
                        <button
                            onClick={(e) => onEdit(card, e)}
                            className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-indigo-600 transition-all ml-1"
                            title="Editar (Admin)"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
});

EncyclopediaCardItem.displayName = 'EncyclopediaCardItem';

export default EncyclopediaCardItem;
