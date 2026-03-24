import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth, AuthUser } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { format } from 'date-fns';
import SlideToWork from './components/SlideToWork';
import {
    Zap,
    AlertCircle,
    Clock,
    CheckCircle2,
    Flame,
    Navigation,
    User
} from 'lucide-react';

import { riderService } from '../../../services/riderService';
import { shiftService } from '../../../services/shiftService';
import { IncidentReportModal } from './modals/IncidentReportModal';
import { VehicleChecklistModal } from './modals/VehicleChecklistModal';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

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

    // Consecutive days with at least one shift (completed or active)
    const streak = useMemo(() => {
        const workedDays = new Set(
            myShifts
                .filter(s => s.status === 'completed' || s.status === 'active')
                .map(s => s.date)
        );
        const today = new Date();
        let count = 0;
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = format(d, 'yyyy-MM-dd');
            if (workedDays.has(key)) {
                count++;
            } else if (i > 0) {
                break; // gap found — streak ends
            }
        }
        return count;
    }, [myShifts]);

    const nextShift = useMemo(() => {
        return myShifts
            .filter(s => new Date(s.startAt).getTime() > currentTime.getTime())
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
    }, [myShifts, currentTime]);



    const handleClockInComplete = async () => {
        if (!nextShift?.shiftId) return;
        try {
            await shiftService.startShift(nextShift.shiftId);
            setCelebrationActive(true);
            setTimeout(() => setCelebrationActive(false), 2000);
        } catch {
            toast.error('Error al iniciar el turno');
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-50 pb-safe font-sans">
            {/* Header Area */}
            <div ref={headerRef} className="px-6 pt-10 pb-4 animate-slide-up">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-[1.5rem] overflow-hidden shadow-[0_8px_20px_rgb(0,0,0,0.06)] bg-white border-2 border-white">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                    <User size={28} className="text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                                Hola, {user?.displayName?.split(' ')[0] || 'Rider'}
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 bg-white rounded-full px-2 py-0.5 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                                    <Flame size={12} className="text-orange-400" />
                                    <span className="text-[10px] font-bold text-slate-600">RACHA: {streak}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 mt-4 pb-32 space-y-5">
                {/* Main Action Card (Neumorphic) */}
                <div className={cn(
                    "bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-all duration-300",
                    activeShift ? "shadow-[0_8px_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100" : ""
                )}>
                    {/* Subtle corner highlight */}
                    {activeShift && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[4rem] -mr-8 -mt-8 pointer-events-none" />
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-500",
                                activeShift ? "bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "bg-slate-300"
                            )} />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                {activeShift ? "TURNO ACTUAL" : "ESTADO GENERAL"}
                            </span>
                        </div>
                        
                        {activeShift ? (
                            <div className="text-center mb-2">
                                <div className="text-6xl font-black text-slate-800 tracking-tighter mb-1">
                                    {format(new Date(activeShift.endAt), 'HH:mm')}
                                </div>
                                <span className="text-sm font-medium text-slate-500">Hora de salida estimada</span>
                            </div>
                        ) : (
                            <div className="text-center mb-2">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-6xl font-black text-slate-800 tracking-tighter tabular-nums">
                                        {formatTime(currentTime)}
                                    </span>
                                    <span className="text-4xl font-bold text-slate-300 -mt-2 animate-pulse">:</span>
                                    <span className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums">
                                        {formatSeconds(currentTime)}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-slate-500 mt-2 block">
                                    {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </div>
                        )}
                        
                        {/* Action Container */}
                        <div className="w-full mt-8">
                            {activeShift ? (
                                <button
                                    onClick={async () => {
                                        if (!activeShift?.shiftId) return;
                                        try {
                                            await shiftService.endShift(activeShift.shiftId);
                                            toast.success('Turno finalizado');
                                        } catch {
                                            toast.error('Error al finalizar');
                                        }
                                    }}
                                    className="w-full bg-[#f8fafc] text-slate-700 font-bold uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-slate-100"
                                >
                                    <div className="w-10 h-10 bg-white rounded-[1rem] flex items-center justify-center shadow-sm text-slate-400">
                                        <Zap size={20} />
                                    </div>
                                    <span className="mt-1">Tocar para salir</span>
                                </button>
                            ) : (
                                <SlideToWork
                                    onComplete={handleClockInComplete}
                                    disabled={!nextShift}
                                    label={nextShift ? "Desliza para conectar" : "No hay turnos hoy"}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Dashboard Smart Grid */}
                <div className="grid grid-cols-2 gap-5">


                    {/* Quick Action: Incident */}
                    <button onClick={() => setIsIncidentModalOpen(true)} className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform h-40">
                        <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
                            <AlertCircle size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Incidencia</span>
                    </button>

                    {/* Quick Action: Checklist */}
                    <button onClick={() => setIsChecklistModalOpen(true)} className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform h-40">
                        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                            <CheckCircle2 size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Revisión</span>
                    </button>
                </div>

                {/* Next Shift Summary Card */}
                {nextShift && !activeShift && (
                    <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#f8fafc] rounded-[1rem] flex items-center justify-center text-slate-400">
                                <Clock size={20} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                                    {format(new Date(nextShift.startAt), 'HH:mm')}
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    Próximo Turno
                                </p>
                            </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                            <Navigation size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                {nextShift.franchiseId || 'ASIGNADO'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Celebration Effect Overlay */}
            {celebrationActive && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
                    <div className="flex flex-col items-center justify-center gap-4 animate-slide-up">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_10px_40px_rgba(16,185,129,0.4)]">
                            <CheckCircle2 size={48} className="text-white" />
                        </div>
                        <span className="text-xl font-black text-emerald-600 uppercase tracking-[0.2em]">
                            ¡CONECTADO!
                        </span>
                    </div>
                </div>
            )}

            {/* MODALS */}
            <IncidentReportModal
                isOpen={isIncidentModalOpen}
                onClose={() => setIsIncidentModalOpen(false)}
                onSubmit={async (data) => {
                    if (!user?.uid) return;
                    const shiftFranchiseId = activeShift?.franchiseId || nextShift?.franchiseId || user.franchiseId;
                    if (!shiftFranchiseId) {
                        toast.error('No se puede reportar: turno sin franquicia asignada.');
                        return;
                    }
                    await riderService.reportIncident(user.uid, {
                        type: data.type,
                        description: data.description,
                        isUrgent: data.isUrgent,
                        franchiseId: shiftFranchiseId
                    });
                }}
            />
            <VehicleChecklistModal
                isOpen={isChecklistModalOpen}
                onClose={() => setIsChecklistModalOpen(false)}
                onSubmit={async (data) => {
                    if (!user?.uid) return;
                    const shiftFranchiseId = activeShift?.franchiseId || nextShift?.franchiseId || user.franchiseId;
                    if (!shiftFranchiseId) {
                        toast.error('No se puede enviar checklist: turno sin franquicia asignada.');
                        return;
                    }
                    await riderService.submitChecklist(user.uid, {
                        items: data.items,
                        vehicleId: nextShift?.motoPlate || activeShift?.motoPlate || '',
                        franchiseId: shiftFranchiseId
                    });
                }}
            />
        </div>
    );
};

export default RiderHomeView;
