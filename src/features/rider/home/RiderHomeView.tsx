import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth, AuthUser } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import SlideToWork from './components/SlideToWork';
import {
    Zap,
    Trophy,
    MapPin,
    AlertCircle,
    Clock,
    CheckCircle2,
    Flame,
    Target,
    TrendingUp,
    Navigation
} from 'lucide-react';

import { riderService } from '../../../services/riderService';
import { IncidentReportModal } from './modals/IncidentReportModal';
import { VehicleChecklistModal } from './modals/VehicleChecklistModal';
import { cn } from '../../../lib/utils';

const RiderHomeView: React.FC = () => {
    const { user } = useAuth() as { user: AuthUser | null };
    const { myShifts, fetchMyShifts } = useRiderStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [celebrationActive, setCelebrationActive] = useState(false);
    
    // Refs for animations
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.uid) fetchMyShifts(user.uid);
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [user, fetchMyShifts]);

    // Stagger animation on mount
    useEffect(() => {
        if (headerRef.current) {
            headerRef.current.classList.add('animate-slide-up');
        }
    }, []);

    // Helpers & Derived State
    const formatTime = (d: Date) => format(d, 'HH:mm');
    const formatSeconds = (d: Date) => format(d, 'ss');

    // Derived state for UI
    const activeShift = useMemo(() => {
        return myShifts.find(s => {
            const start = new Date(s.startAt).getTime();
            const end = new Date(s.endAt).getTime();
            const now = currentTime.getTime();
            return now >= start && now <= end;
        });
    }, [myShifts, currentTime]);

    const isOnline = !!activeShift;
    const platformLevel = { level: 'PRO' };

    const nextShift = useMemo(() => {
        return myShifts
            .filter(s => new Date(s.startAt).getTime() > currentTime.getTime())
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
    }, [myShifts, currentTime]);

    const weeklyStats = useMemo(() => {
        const start = startOfWeek(currentTime, { weekStartsOn: 1 });
        const end = endOfWeek(currentTime, { weekStartsOn: 1 });
        const weeksShifts = myShifts.filter(s => {
            try {
                return isWithinInterval(new Date(s.startAt), { start, end });
            } catch {
                return false;
            }
        });
        const totalHours = weeksShifts.reduce((acc, s) => {
            const duration = (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / (1000 * 60 * 60);
            return acc + duration;
        }, 0);
        return { hours: totalHours, count: weeksShifts.length, target: 40 };
    }, [myShifts, currentTime]);

    const handleClockInComplete = () => {
        setCelebrationActive(true);
        setTimeout(() => {
            setCelebrationActive(false);
        }, 2000);
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-safe">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-emerald-500/5 via-indigo-500/5 to-purple-500/5 rounded-full blur-3xl animate-orb" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-amber-500/5 via-orange-500/5 to-rose-500/5 rounded-full blur-2xl" />
            </div>

            {/* PREMIUM HEADER */}
            <div ref={headerRef} className="relative px-6 pt-8 pb-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                            {/* Premium Avatar with Glow */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-xl animate-aurora-slow" />
                                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/10 dark:ring-white/5 shadow-2xl bg-white dark:bg-slate-800">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center">
                                            <Zap size={32} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                {/* Online Status Indicator */}
                                <div className={cn(
                                    "absolute bottom-0 right-0 w-7 h-7 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center transition-all duration-300",
                                    isOnline ? "bg-emerald-500" : "bg-slate-400"
                                )}>
                                    {isOnline && (
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping" />
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                    {user?.displayName?.split(' ')[0] || 'Rider'}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-[0.2em]">
                                        COCKPIT V4
                                    </span>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                                        <Flame size={12} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                            STREAK: 12
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Pill */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-premium-v2 border border-white/20">
                                <Trophy size={18} className="text-amber-500" />
                                <div className="text-right">
                                    <div className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                        {weeklyStats.hours.toFixed(0)}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        HORAS SEMANA
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREMIUM BENTO GRID */}
            <div className="max-w-7xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-min">
                    
                    {/* MAIN STATUS CARD - Premium */}
                    <div className={cn(
                        "glass-premium-v2 rounded-[2rem] p-8 relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl",
                        activeShift ? "border-emerald-500/30" : "border-white/10"
                    )}>
                        {/* Glow Effect */}
                        <div className={cn(
                            "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl transition-all duration-500",
                            activeShift ? "bg-emerald-500/20" : "bg-slate-500/10"
                        )} />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={cn(
                                    "w-3 h-3 rounded-full transition-all duration-500",
                                    activeShift ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                                    {activeShift ? "TURNO ACTIVO" : "EN ESPERA"}
                                </span>
                            </div>

                            {activeShift ? (
                                <div className="text-center">
                                    <div className="text-6xl font-black text-white tracking-tighter leading-none mb-2">
                                        {format(new Date(activeShift.endAt), 'HH:mm')}
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        Fin de jornada
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-6xl font-black text-white tracking-tighter leading-none">
                                            {formatTime(currentTime)}
                                        </span>
                                        <span className="text-4xl font-bold text-slate-400 font-mono tracking-tight leading-none">
                                            :
                                        </span>
                                        <span className="text-5xl font-black text-white tracking-tighter leading-none">
                                            {formatSeconds(currentTime)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                                        {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-3">
                                <div className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                                    activeShift ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800/50 text-slate-600"
                                )}>
                                    <MapPin size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {activeShift ? "EN ZONA" : "DESCONECTADO"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STATUS PILL */}
                    <div className="glass-premium-v2 rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                activeShift ? "bg-emerald-500 shadow-lg glow-success" : "bg-slate-800/50"
                            )}>
                                <Zap size={28} className={cn(
                                    "transition-all duration-500",
                                    activeShift ? "text-white" : "text-slate-600"
                                )} />
                            </div>
                            <div>
                                <div className={cn(
                                    "text-3xl font-black tracking-tighter leading-none",
                                    activeShift ? "text-emerald-500" : "text-slate-600"
                                )}>
                                    {activeShift ? "ON" : "OFF"}
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    STATUS
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* PLATFORM LEVEL CARD */}
                    <div className="glass-premium-v2 rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-full blur-2xl" />
                        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg">
                                <Target size={28} className="text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-white tracking-tighter leading-none">
                                    {platformLevel?.level || 'N/A'}
                                </div>
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                    BAT 92%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* WEEKLY PROGRESS CARD */}
                    <div className="glass-premium-v2 rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <Trophy size={24} className="text-amber-500" />
                                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    MÉTRICAS SEMANALES
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Horas trabajadas</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-black text-white tracking-tighter">
                                            {weeklyStats.hours.toFixed(0)}
                                        </span>
                                        <span className="text-sm font-bold text-slate-500">/ {weeklyStats.target}</span>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-1000"
                                        style={{ width: `${(weeklyStats.hours / weeklyStats.target) * 100}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Turnos completados</span>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-500" />
                                        <span className="text-2xl font-black text-white tracking-tighter">
                                            {weeklyStats.count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SLIDE TO WORK INTERACTION AREA */}
                <div className="relative mt-8">
                    {activeShift ? (
                        <button
                            onClick={() => alert("Finalizando turno...")}
                            className="w-full h-24 rounded-[2rem] glass-premium-v2 border-rose-500/30 group hover:border-rose-500/50 transition-all duration-500 flex items-center justify-center gap-6 hover:scale-[1.02]"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                                <Zap size={32} className="text-rose-500" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-2xl font-black text-rose-500 uppercase tracking-widest">
                                    FINALIZAR JORNADA
                                </span>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Registrar fin de turno
                                </span>
                            </div>
                        </button>
                    ) : (
                        <SlideToWork
                            onComplete={handleClockInComplete}
                            disabled={!nextShift}
                            label={nextShift ? "Desliza para iniciar" : "Sin turnos hoy"}
                        />
                    )}

                    {/* Celebration Effect */}
                    {celebrationActive && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-ping" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="flex flex-col items-center justify-center gap-4 animate-slide-up">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl">
                                        <CheckCircle2 size={40} className="text-white" />
                                    </div>
                                    <span className="text-2xl font-black text-emerald-500 uppercase tracking-widest">
                                        ¡TURNO INICIADO!
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* QUICK ACTIONS */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={() => setIsIncidentModalOpen(true)}
                        className="glass-premium-v2 rounded-[2rem] p-6 flex flex-col items-center gap-4 group hover:scale-[1.02] hover:border-rose-500/30 transition-all duration-500"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-all">
                            <AlertCircle size={28} className="text-rose-500" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-rose-500 transition-colors">
                                INCIDENTE
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Reportar problema
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setIsChecklistModalOpen(true)}
                        className="glass-premium-v2 rounded-[2rem] p-6 flex flex-col items-center gap-4 group hover:scale-[1.02] hover:border-indigo-500/30 transition-all duration-500"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                            <CheckCircle2 size={28} className="text-indigo-500" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                                CHECKLIST
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Verificación vehículo
                            </span>
                        </div>
                    </button>
                </div>

                {/* NEXT SHIFT CARD */}
                {nextShift && (
                    <div className="mt-8 glass-premium-v2 rounded-[2rem] p-6 relative overflow-hidden hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-emerald-500/10 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock size={24} className="text-indigo-500" />
                                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    PRÓXIMO TURNO
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                                        {format(new Date(nextShift.startAt), 'HH:mm')}
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {format(new Date(nextShift.startAt), 'EEEE, MMM d')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <Navigation size={18} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                        ZONA CENTRO
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <IncidentReportModal
                isOpen={isIncidentModalOpen}
                onClose={() => setIsIncidentModalOpen(false)}
                onSubmit={async (data) => {
                    if (!user?.uid) return;
                    await riderService.reportIncident(user.uid, {
                        type: data.type,
                        description: data.description,
                        isUrgent: data.isUrgent,
                        franchiseId: user.franchiseId || ''
                    });
                }}
            />
            <VehicleChecklistModal
                isOpen={isChecklistModalOpen}
                onClose={() => setIsChecklistModalOpen(false)}
                onSubmit={async (data) => {
                    if (!user?.uid) return;
                    await riderService.submitChecklist(user.uid, {
                        items: data.items,
                        vehicleId: nextShift?.motoPlate || activeShift?.motoPlate || '',
                        franchiseId: user.franchiseId || ''
                    });
                }}
            />
        </div>
    );
};

export default RiderHomeView;
