import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Trophy,
    CloudRain,
    Calendar,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    X,
    TrendingUp,
    AlertTriangle,
    Info
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface InsightCard {
    id: string;
    type: 'sport' | 'weather' | 'holiday' | 'ai_tip';
    severity: 'low' | 'medium' | 'high';
    message: string;
    actionable: string;
    date: Date;
    displayDate: string;
}

interface OpsIntelligenceBarProps {
    weekDays: Date[];
}

export const OpsIntelligenceBar: React.FC<OpsIntelligenceBarProps> = ({ weekDays }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    // V12: Static/Mock Logic (Stable) - Removed Zustand Real-Time Store
    const filteredInsights = useMemo(() => {
        if (!weekDays || weekDays.length === 0) return [];

        const baseInsights: (Omit<InsightCard, 'date' | 'displayDate'> & { dayOffset?: number })[] = [
            { id: 'sc-1', type: 'sport', severity: 'high', message: "El Clásico: Real Madrid vs FC Barcelona", actionable: "Sube personal +35% en Zona Centro entre 20h-23h", dayOffset: 6 }, // Sunday
            { id: 'sc-2', type: 'weather', severity: 'medium', message: "Previsión de Lluvia Intensa", actionable: "Activa bonus de lluvia y revisa baúles estancos", dayOffset: 2 }, // Wednesday
            { id: 'sc-3', type: 'ai_tip', severity: 'low', message: "Pico de Demanda: Domingo de Resaca", actionable: "La demanda de desayunos sube un 15% este domingo", dayOffset: 6 }, // Sunday
            { id: 'sc-4', type: 'holiday', severity: 'medium', message: "Evento Local: Procesión en Centro", actionable: "Cierre de calles principales previsto. Desvía riders.", dayOffset: 4 }, // Friday
        ];

        const mocks = baseInsights.map((insight) => {
            const targetDate = weekDays[insight.dayOffset ?? 0] || weekDays[0];

            return {
                id: insight.id,
                type: insight.type,
                severity: insight.severity,
                message: insight.message,
                actionable: insight.actionable,
                date: targetDate,
                displayDate: format(targetDate, 'EEEE d, MMM', { locale: es })
            } as InsightCard;
        });

        return mocks;
    }, [weekDays]);

    const nextInsight = useCallback(() => {
        if (filteredInsights.length <= 1) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % filteredInsights.length);
            setIsAnimating(false);
        }, 400);
    }, [filteredInsights.length]);

    const prevInsight = useCallback(() => {
        if (filteredInsights.length <= 1) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + filteredInsights.length) % filteredInsights.length);
            setIsAnimating(false);
        }, 400);
    }, [filteredInsights.length]);

    useEffect(() => {
        const timer = setInterval(nextInsight, 8000);
        return () => clearInterval(timer);
    }, [nextInsight]);

    if (!isVisible || filteredInsights.length === 0) return null;

    const insight = filteredInsights[currentIndex];

    const getIcon = () => {
        switch (insight.type) {
            case 'sport': return <Trophy className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" size={18} />;
            case 'weather': return <CloudRain className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" size={18} />;
            case 'holiday': return <Calendar className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" size={18} />;
            case 'ai_tip': return <Sparkles className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]" size={18} />;
        }
    };

    const getSeverityIcon = () => {
        switch (insight.severity) {
            case 'high': return <AlertTriangle className="text-red-500 animate-pulse" size={14} />;
            case 'medium': return <TrendingUp className="text-amber-500" size={14} />;
            case 'low': return <Info className="text-blue-500" size={14} />;
        }
    };

    const getGlowColor = () => {
        switch (insight.severity) {
            case 'high': return 'shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20';
            case 'medium': return 'shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20';
            case 'low': return 'shadow-[0_0_15px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/20';
        }
    };

    return (
        <div className="relative group overflow-hidden bg-slate-950/90 backdrop-blur-md border-b border-white/5 h-[56px] flex items-center px-4 shrink-0 transition-all duration-500">
            {/* Ambient Background Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 pointer-events-none" />

            {/* Nav Left */}
            <button
                onClick={prevInsight}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all z-10 active:scale-90"
            >
                <ChevronLeft size={20} />
            </button>

            {/* Content Area */}
            <div className="flex-1 flex items-center justify-center px-8 relative overflow-hidden h-full">
                <div
                    key={insight.id}
                    className={cn(
                        "flex items-center gap-8 transition-all duration-700 max-w-5xl w-full px-6 py-2 rounded-xl",
                        getGlowColor(),
                        isAnimating ? "opacity-0 -translate-y-4 blur-sm" : "opacity-100 translate-y-0 blur-0"
                    )}
                >
                    {/* Event Type & Icon */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-sm">
                            {getIcon()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-black">
                                {insight.type.replace('_', ' ')}
                            </span>
                            <span className="text-white font-bold text-[15px] leading-tight tracking-tight">
                                {insight.message}
                            </span>
                        </div>
                    </div>

                    {/* Week Pulse Indicator */}
                    <div className="hidden lg:flex items-center gap-1.5 px-4 h-8 border-x border-white/10 shrink-0">
                        {weekDays.map((day, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                                    isSameDay(day, insight.date)
                                        ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] scale-125"
                                        : "bg-white/10"
                                )}
                                title={format(day, 'EEEE')}
                            />
                        ))}
                    </div>

                    {/* Actionable Tip */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            {getSeverityIcon()}
                            <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-black">
                                Inteligencia Ops
                            </span>
                        </div>
                        <p className="text-indigo-200 text-sm font-semibold truncate">
                            {insight.actionable}
                        </p>
                    </div>

                    {/* Date Tag */}
                    <div className="shrink-0 flex flex-col items-end hidden sm:flex">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <span className="text-[10px] text-white/60 font-mono capitalize">
                                {insight.displayDate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav Right & Close */}
            <div className="flex items-center gap-3 z-10">
                <div className="flex items-center gap-1 text-[10px] font-mono text-white/20 mr-2">
                    <span>{currentIndex + 1}</span>
                    <span className="text-white/10">/</span>
                    <span>{filteredInsights.length}</span>
                </div>
                <button
                    onClick={nextInsight}
                    className="p-1.5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all active:scale-90"
                >
                    <ChevronRight size={20} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/10 hover:text-red-400 transition-all"
                    title="Cerrar barra de inteligencia"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Bloomberg Glow Line Layer */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent w-full animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent w-full" />
            </div>
        </div>
    );
};
