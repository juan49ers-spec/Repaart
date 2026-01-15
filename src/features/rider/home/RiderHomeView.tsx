import React, { useEffect, useMemo, useState } from 'react';
import { useAuth, AuthUser } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { SlideToWork } from './components/SlideToWork';
import {
    Bike,
    Zap,
    Trophy,
    TrendingUp,
    MapPin,
    AlertCircle,
    Clock,
    CheckCircle2
} from 'lucide-react';

import { riderService } from '../../../services/riderService';
import { IncidentReportModal } from './modals/IncidentReportModal';
import { VehicleChecklistModal } from './modals/VehicleChecklistModal';

export const RiderHomeView: React.FC = () => {
    const { user } = useAuth() as { user: AuthUser | null };
    const { myShifts, fetchMyShifts } = useRiderStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (user?.uid) fetchMyShifts(user.uid);
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [user, fetchMyShifts]);

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
    const platformLevel = { level: 'PRO' }; // Placeholder until gamification module is connected

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
        setIsShaking(true);
        setTimeout(() => {
            setIsShaking(false);
            alert("SISTEMA INICIADO: Buen servicio, " + (user?.displayName?.split(' ')[0] || 'Rider'));
        }, 800);
    };

    return (
        <div className={`flex flex-col gap-8 transition-transform pb-20 ${isShaking ? 'animate-haptic' : ''}`}>
            {/* TOP HEADER */}
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-apple-h1">{user?.displayName?.split(' ')[0] || 'Rider'}</h1>
                    <p className="text-apple-sub mt-1">SISTEMA COCKPIT V3</p>
                </div>
                <div className="relative group">
                    <div className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl transition-transform group-hover:scale-110">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                <Zap size={24} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-2 md:grid-cols-6 md:grid-rows-2 gap-4 h-auto md:h-[440px]">
                {/* WIDGET 1: MAIN STATUS (Bento 4x2) */}
                <div className={`col-span-2 md:col-span-4 row-span-2 glass-premium rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden group min-h-[300px] md:min-h-0
                    ${activeShift ? 'ring-emerald-500/30' : 'ring-white/5'}`}>

                    {activeShift && <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl animate-pulse" />}

                    <div className="relative z-10">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em]
                            ${activeShift ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {activeShift ? 'TURNO ACTIVO' : 'EN ESPERA'}
                        </span>

                        <div className="mt-6">
                            {activeShift ? (
                                <>
                                    <span className="text-4xl font-bold text-white font-mono tracking-tighter leading-none">
                                        {format(new Date(activeShift.endAt), 'HH:mm')}
                                    </span>
                                    <p className="text-slate-500 font-bold text-xs mt-4 uppercase tracking-widest">Fin de jornada</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold text-white font-mono tracking-tight leading-none">
                                            {formatTime(currentTime)}
                                        </span>
                                        <span className="text-2xl font-bold text-slate-400 font-mono mb-2">:</span>
                                        <span className="text-3xl font-bold text-slate-700 font-mono tracking-tight leading-none">
                                            {formatSeconds(currentTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                            {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${activeShift ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                            <MapPin size={16} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {activeShift ? 'Zona Centro' : 'Desconectado'}
                        </span>
                    </div>
                </div>

                {/* WIDGET 2: STATUS (Bento 2x1) */}
                <div className="col-span-1 md:col-span-2 glass-premium rounded-[2rem] p-5 flex flex-col justify-between group hover:scale-[1.02] transition-transform h-32 md:h-auto">
                    <Zap className="text-amber-400" size={24} />
                    <div>
                        <span className="text-2xl font-bold text-white">{activeShift ? 'ON' : 'OFF'}</span>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Status</p>
                    </div>
                </div>

                {/* WIDGET 3: VEHICLE (Bento 2x1) */}
                <div className="col-span-1 md:col-span-2 glass-premium rounded-[2rem] p-5 flex flex-col justify-between group hover:scale-[1.02] transition-transform h-32 md:h-auto">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-[11px] font-bold text-white uppercase tracking-tight">
                            {platformLevel?.level || 'N/A'}
                        </span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">BAT 92%</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xl font-bold text-white leading-none">98</span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Score</p>
                    </div>
                    <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xl font-bold text-white leading-none">{weeklyStats.hours.toFixed(0)}h</span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Semana</p>
                    </div>
                    <Clock className="w-5 h-5 text-indigo-500" />
                </div>
            </div>{/* INTERACTION AREA */}
            <div className="mt-4 px-2">
                {activeShift ? (
                    <button
                        onClick={() => alert("Finalizando turno...")}
                        className="w-full h-20 glass-premium rounded-full border-rose-500/30 group active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                            <Zap size={24} />
                        </div>
                        <span className="text-xs font-black text-rose-400 uppercase tracking-[0.3em]">Finalizar Jornada</span>
                    </button>
                ) : (
                    <SlideToWork
                        onComplete={handleClockInComplete}
                        disabled={!nextShift}
                        label={nextShift ? "Desliza para Iniciar" : "Sin turnos hoy"}
                    />
                )}
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="grid grid-cols-2 gap-4 px-2">
                <button
                    onClick={() => setIsIncidentModalOpen(true)}
                    className="flex items-center gap-4 p-5 glass-premium rounded-[1.8rem] hover:bg-rose-500/5 transition-colors group"
                >
                    <AlertCircle className="text-rose-400 opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-rose-300">INCIDENTE</span>
                </button>
                <button
                    onClick={() => setIsChecklistModalOpen(true)}
                    className="flex items-center gap-4 p-5 glass-premium rounded-[1.8rem] hover:bg-blue-500/5 transition-colors group"
                >
                    <CheckCircle2 className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-300">CHECK-LIST</span>
                </button>
            </div>

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
                        franchiseId: user.franchiseId || '' // Added for security rules
                    });
                }}
            />
        </div>
    );
};
