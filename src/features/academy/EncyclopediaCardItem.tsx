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
    Bookmark,
    Share2,
    MoreHorizontal,
    Pencil,
    CheckCircle2,
    Star
} from 'lucide-react';
import { EncyclopediaCard } from '../../hooks/useEncyclopedia';
import toast from 'react-hot-toast';

// Category configurations with colors and icons
const categoryConfig: Record<string, {
    icon: React.FC<{ size?: number; className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    gradientFrom: string;
    gradientTo: string;
}> = {
    "Estrategia": {
        icon: TrendingUp,
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-950/40",
        borderColor: "border-violet-200 dark:border-violet-800/50",
        gradientFrom: "from-violet-400",
        gradientTo: "to-purple-500"
    },
    "Finanzas": {
        icon: CreditCard,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
        borderColor: "border-emerald-200 dark:border-emerald-800/50",
        gradientFrom: "from-emerald-400",
        gradientTo: "to-teal-500"
    },
    "Operativa": {
        icon: Truck,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/40",
        borderColor: "border-blue-200 dark:border-blue-800/50",
        gradientFrom: "from-blue-400",
        gradientTo: "to-indigo-500"
    },
    "RRHH": {
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-950/40",
        borderColor: "border-orange-200 dark:border-orange-800/50",
        gradientFrom: "from-orange-400",
        gradientTo: "to-pink-500"
    },
    "Comercial": {
        icon: Target,
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-50 dark:bg-rose-950/40",
        borderColor: "border-rose-200 dark:border-rose-800/50",
        gradientFrom: "from-rose-400",
        gradientTo: "to-pink-500"
    },
    "Tecnología": {
        icon: Cpu,
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
        borderColor: "border-indigo-200 dark:border-indigo-800/50",
        gradientFrom: "from-indigo-400",
        gradientTo: "to-cyan-500"
    },
    "Calidad": {
        icon: ShieldCheck,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/40",
        borderColor: "border-amber-200 dark:border-amber-800/50",
        gradientFrom: "from-amber-400",
        gradientTo: "to-orange-500"
    },
    "Seguridad": {
        icon: ShieldCheck,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/40",
        borderColor: "border-red-200 dark:border-red-800/50",
        gradientFrom: "from-red-400",
        gradientTo: "to-rose-500"
    },
    "Liderazgo": {
        icon: BookOpen,
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
        borderColor: "border-cyan-200 dark:border-cyan-800/50",
        gradientFrom: "from-cyan-400",
        gradientTo: "to-blue-500"
    }
};

const defaultConfig = {
    icon: Target,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/40",
    borderColor: "border-slate-200 dark:border-slate-800/50",
    gradientFrom: "from-slate-400",
    gradientTo: "to-slate-500"
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
    const config = categoryConfig[card.category || 'General'] || defaultConfig;
    const Icon = config.icon;
    const [showActions, setShowActions] = useState(false);

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
            navigator.clipboard.writeText(text);
            toast.success("Contenido copiado");
        }
        setShowActions(false);
    };

    return (
        <div
            className={`
                group relative bg-white dark:bg-slate-900 
                rounded-2xl border transition-all duration-300 overflow-hidden
                ${isExpanded
                    ? `${config.borderColor} shadow-xl`
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1'
                }
            `}
        >
            {/* Illustration Header */}
            <div
                className={`
                    relative h-36 ${config.bgColor} 
                    flex items-center justify-center overflow-hidden
                    border-b ${config.borderColor}
                `}
            >
                {/* Abstract gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} opacity-10`} />

                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                {/* Main Icon */}
                <div className={`relative z-10 p-6 rounded-2xl ${config.bgColor} border ${config.borderColor} shadow-sm`}>
                    <Icon className={`w-10 h-10 ${config.color}`} />
                </div>

                {/* Featured Badge */}
                {card.isFeatured && (
                    <div className="absolute top-3 right-3 z-20">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white shadow-md`}>
                            <Star className="w-3 h-3 fill-white" />
                            Premium
                        </span>
                    </div>
                )}

                {/* Read Badge */}
                {isRead && (
                    <div className="absolute top-3 left-3 z-20">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-500 text-white">
                            <CheckCircle2 className="w-3 h-3" />
                            Leído
                        </span>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => onToggleExpand(card.id)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleExpand(card.id);
                    }
                }}
                className="p-5 cursor-pointer"
            >
                {/* Category Label */}
                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest ${config.color} mb-2`}>
                    {card.category}
                </span>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                    {card.title}
                </h3>

                {/* Description */}
                <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {card.content}
                </p>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="mt-6 space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        {/* Action Card */}
                        {card.action && (
                            <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                                <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${config.color} mb-2`}>
                                    <Target className="w-4 h-4" />
                                    Acción Clave
                                </h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                    {card.action}
                                </p>
                            </div>
                        )}

                        {/* Example Card */}
                        {card.example && (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                                    <Lightbulb className="w-4 h-4" />
                                    Ejemplo Práctico
                                </h4>
                                <p className="text-sm text-slate-700 dark:text-amber-100 italic">
                                    &quot;{card.example}&quot;
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {/* Audio Button */}
                <button
                    onClick={(e) => onToggleSpeak(e, card)}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${isSpeaking
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }
                    `}
                >
                    {isSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    {isSpeaking ? 'Pausar' : 'Escuchar'}
                </button>

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    {/* Bookmark */}
                    {onToggleFavorite && (
                        <button
                            onClick={(e) => onToggleFavorite(card.id, e)}
                            className={`p-2 rounded-lg transition-all ${isFavorite
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            title="Guardar"
                        >
                            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    )}

                    {/* Mark as Read */}
                    {!isAdmin && onToggleRead && (
                        <button
                            onClick={(e) => onToggleRead(card.id, e)}
                            className={`p-2 rounded-lg transition-all ${isRead
                                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            title={isRead ? "Marcar no leído" : "Marcar leído"}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </button>
                    )}

                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title="Compartir"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>

                    {/* More Actions (Admin) */}
                    {isAdmin && onEdit && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowActions(!showActions);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {showActions && (
                                <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[120px] z-50">
                                    <button
                                        onClick={(e) => {
                                            onEdit(card, e);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

EncyclopediaCardItem.displayName = 'EncyclopediaCardItem';

export default EncyclopediaCardItem;
