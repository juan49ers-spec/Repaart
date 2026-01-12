import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { SlideToWork } from './components/SlideToWork';
import {
    CloudSun,
    Bike,
    Zap,
    Trophy,
    TrendingUp,
    MapPin,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

import { riderService } from '../../../services/riderService';
import { shiftService } from '../../../services/shiftService';
import { IncidentReportModal } from './modals/IncidentReportModal';
import { VehicleChecklistModal } from './modals/VehicleChecklistModal';
import { useWeather } from './hooks/useWeather';

export const RiderHomeView: React.FC = () => {
    const { user } = useAuth();
    const { myShifts, fetchMyShifts, updateLocalShift } = useRiderStore();
    const weather = useWeather();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (user?.uid) fetchMyShifts(user.uid);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000); // 1 sec updates
        return () => clearInterval(timer);
    }, [user, fetchMyShifts]);

    // Active Shift Logic: 
    // 1. Check if ANY shift is 'active' status.
    // 2. Else check if we are in time window.
    const activeShift = useMemo(() => {
        // PRIORITY 1: Explicitly active shift
        const explicitlyActive = myShifts.find(s => s.status === 'active');
        if (explicitlyActive) return explicitlyActive;

        // PRIORITY 2: Shift in current time window (that isn't completed)
        return myShifts.find(s => {
            if (s.status === 'completed') return false;
            // If it's 'scheduled' and we are in the time window
            const start = new Date(s.startAt);
            const end = new Date(s.endAt);
            return currentTime >= start && currentTime <= end;
        });
    }, [myShifts, currentTime]);

    const nextShift = useMemo(() => {
        return myShifts
            .filter(s => s.status !== 'completed' && s.status !== 'active' && new Date(s.startAt) > currentTime)
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
    }, [myShifts, currentTime]);

    const weeklyStats = useMemo(() => {
        const start = startOfWeek(currentTime, { weekStartsOn: 1 });
        const end = endOfWeek(currentTime, { weekStartsOn: 1 });
        const weeksShifts = myShifts.filter(s => isWithinInterval(new Date(s.startAt), { start, end }));

        // Calculate hours based on actual time if available
        const totalHours = weeksShifts.reduce((acc, s) => {
            if (s.actualStart && s.actualEnd) {
                return acc + (new Date(s.actualEnd).getTime() - new Date(s.actualStart).getTime()) / (1000 * 60 * 60);
            }
            // If active, calculate from start to NOW
            if (s.status === 'active' && s.actualStart) {
                return acc + (new Date().getTime() - new Date(s.actualStart).getTime()) / (1000 * 60 * 60);
            }
            // Fallback to scheduled (only if completed or past)
            if (s.status === 'completed') {
                return acc + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / (1000 * 60 * 60);
            }
            return acc;
        }, 0);

        return { hours: totalHours, count: weeksShifts.length };
    }, [myShifts, currentTime]);

    // --- ACTIONS ---

    const handleClockIn = async () => {
        // Prefer active (shouldn't happen here) -> then explicitly next -> then fallback to any scheduled today
        const targetShift = activeShift || nextShift || myShifts.find(s => s.status === 'scheduled');

        if (!targetShift) {
            alert("No hay turno disponible para iniciar.");
            return;
        }

        console.log("Attempting Clock In:", targetShift.shiftId);

        try {
            await shiftService.startShift(targetShift.shiftId);

            // OPTIMISTIC UPDATE: Immediate feedback
            updateLocalShift(targetShift.shiftId, {
                status: 'active',
                actualStart: new Date().toISOString()
            });

            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 800);
        } catch (e: any) {
            console.error("Clock In Failed", e);
            alert("Error de conexión. No se pudo iniciar el turno.");
            setIsShaking(false);
        }
    };

    const handleClockOut = async () => {
        if (!activeShift) return;
        if (!window.confirm("¿Seguro que quieres finalizar tu turno?")) return;

        try {
            await shiftService.endShift(activeShift.shiftId);

            // OPTIMISTIC UPDATE: Immediate feedback
            updateLocalShift(activeShift.shiftId, {
                status: 'completed',
                actualEnd: new Date().toISOString()
            });

        } catch (e: any) {
            console.error("Clock Out Failed", e);
            alert("Error al finalizar turno.");
        }
    };

    // Determine state
    const isShiftActive = activeShift && activeShift.status === 'active';
    const canStart = !!nextShift || (!!activeShift && activeShift.status === 'scheduled');

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
            <div className="grid grid-cols-6 grid-rows-2 gap-4 h-[440px]">
                {/* WIDGET 1: MAIN STATUS (Bento 4x2) */}
                <div className={`col-span-4 row-span-2 glass-premium rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden group
                    ${isShiftActive ? 'ring-emerald-500/30 bg-emerald-900/10' : 'ring-white/5'}`}>

                    {isShiftActive && <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl animate-pulse" />}

                    <div className="relative z-10">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em]
                            ${isShiftActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                            {isShiftActive ? '● TURNO ACTIVO' : 'EN ESPERA'}
                        </span>

                        <div className="mt-6">
                            {activeShift ? (
                                <>
                                    <span className="text-6xl font-black text-white font-mono tracking-tighter leading-none">
                                        {format(new Date(activeShift.endAt), 'HH:mm')}
                                    </span>
                                    <p className="text-slate-500 font-bold text-xs mt-4 uppercase tracking-widest">Fin de jornada</p>
                                    {isShiftActive && (
                                        <div className="mt-2 text-[10px] text-emerald-400/80 font-mono">
                                            Llevas {(weeklyStats.hours % 1 * 60).toFixed(0)}m activos
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <span className="text-5xl font-black text-slate-700 font-mono tracking-tighter leading-none">
                                        00:00
                                    </span>
                                    <p className="text-slate-600 font-bold text-xs mt-4 uppercase tracking-widest italic">Standby Mode</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isShiftActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                            <MapPin size={16} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {isShiftActive ? (weather?.city || 'Zona Activa') : 'Desconectado'}
                        </span>
                    </div>
                </div>

                {/* WIDGET 2: WEATHER (Bento 2x1) */}
                <div className="col-span-2 glass-premium rounded-[2rem] p-5 flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                    <CloudSun className={weather ? "text-amber-400" : "text-slate-600"} size={24} />
                    <div>
                        <span className="text-2xl font-black text-white">{weather?.temp ? `${weather.temp}°` : '--'}</span>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 truncate">
                            {weather?.city || 'Cargando...'}
                        </p>
                    </div>
                </div>

                {/* WIDGET 3: VEHICLE (Bento 2x1) */}
                <div className="col-span-2 glass-premium rounded-[2rem] p-5 flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                    <Bike className={activeShift?.motoId ? "text-emerald-400" : "text-slate-600"} size={24} />
                    <div>
                        <span className="text-[11px] font-black text-white uppercase tracking-tighter truncate">
                            {activeShift?.motoPlate || 'SIN MOTO'}
                        </span>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">VEHÍCULO</p>
                    </div>
                </div>
            </div>

            {/* SECONDARY STATS (Score & Hours) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-premium rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <span className="text-lg font-black text-white leading-none">98</span>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Score</p>
                    </div>
                </div>
                <div className="glass-premium rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <span className="text-lg font-black text-white leading-none">{weeklyStats.hours.toFixed(1)}h</span>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Semana</p>
                    </div>
                </div>
            </div>

            {/* INTERACTION AREA */}
            <div className="mt-4 px-2">
                {isShiftActive ? (
                    <button
                        onClick={handleClockOut}
                        className="w-full h-20 glass-premium rounded-full border-rose-500/30 group active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-rose-500/5 bg-rose-900/10"
                    >
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-900/20">
                            <Zap size={24} className="fill-rose-500" />
                        </div>
                        <span className="text-xs font-black text-rose-400 uppercase tracking-[0.3em]">Finalizar Jornada</span>
                    </button>
                ) : (
                    <SlideToWork
                        onComplete={handleClockIn}
                        disabled={!canStart}
                        label={
                            canStart
                                ? "Desliza para Iniciar"
                                : (nextShift ? `Próximo: ${format(new Date((nextShift as any).startAt), 'HH:mm')}` : "Sin más turnos")
                        }
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
                    await riderService.reportIncident(user.uid, { ...data, franchiseId: user.franchiseId || '' });
                }}
            />
            <VehicleChecklistModal
                isOpen={isChecklistModalOpen}
                onClose={() => setIsChecklistModalOpen(false)}
                onSubmit={async (data) => {
                    if (!user?.uid) return;
                    await riderService.submitChecklist(user.uid, { ...data, vehicleId: activeShift?.motoId || undefined });
                }}
            />
        </div>
    );
};
