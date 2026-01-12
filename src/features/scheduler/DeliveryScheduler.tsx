import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Shield, Save, Loader2, Clock, Sparkles, Filter, BadgeCheck, AlertTriangle, ShieldCheck, Wand2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getRiderInitials } from '../../utils/colorPalette';
import { toLocalDateString, toLocalISOString, toLocalISOStringWithOffset, getStartOfWeek } from '../../utils/dateUtils';
import ShiftModal from '../../features/operations/ShiftModal';
import QuickFillModal from '../../features/operations/QuickFillModal';
import MobileAgendaView from '../../features/operations/MobileAgendaView';

import { useWeeklySchedule, WeekData, Shift } from '../../hooks/useWeeklySchedule';
import { useAuth } from '../../context/AuthContext';
import { getRiderColor } from '../../utils/riderColors';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { format, startOfWeek, addDays, parseISO, setHours, differenceInMinutes, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFleetStore } from '../../store/useFleetStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { shiftService } from '../../services/shiftService';
import { migrationService } from '../../services/migrationService';
import { notificationService } from '../../services/notificationService';
import { validateWeeklySchedule, generateScheduleFix, generateFullSchedule } from '../../lib/gemini';
import { WeekService } from '../../services/scheduler/weekService';
import { toFranchiseId, toWeekId } from '../../schemas/scheduler';

console.log('📦 ARCHIVO DeliveryScheduler.tsx CARGADO EN EL NAVEGADOR');

const DeliveryScheduler: React.FC<{
    franchiseId: string;
    selectedDate: Date;
    onDateChange?: (date: Date) => void;
    readOnly?: boolean;
}> = ({ franchiseId, selectedDate, onDateChange, readOnly }) => {


    const { user } = useAuth();
    const safeFranchiseId = franchiseId || user?.uid || '';
    const isMobile = useMediaQuery('(max-width: 768px)');

    // --- UI STATE ---
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [showPrime, setShowPrime] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- SHERIFF & MAGIC AI STATE ---
    const [sheriffResult, setSheriffResult] = useState<{
        score: number;
        status: 'optimal' | 'warning' | 'critical';
        feedback: string;
        missingCoverage: string[];
    } | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genPrompt, setGenPrompt] = useState('');

    // Update time every minute for the Red Line
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // --- DATA HOOKS ---
    const {
        weekData,
        loading,
        navigateWeek,
        motos
    } = useWeeklySchedule(safeFranchiseId, readOnly, selectedDate);

    const changeWeek = (direction: number) => {
        if (onDateChange) {
            const newDate = addDays(selectedDate, direction * 7);
            onDateChange(newDate);
        } else {
            navigateWeek(direction);
        }
    };

    // --- DRAFT MODE STATE ---
    const [localShifts, setLocalShifts] = useState<any[]>([]);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const hasUnsavedChanges = localShifts.length > 0 || deletedIds.size > 0;

    // --- STORES ---
    const { riders: rosterRiders, fetchRiders } = useFleetStore();
    const { vehicles, fetchVehicles } = useVehicleStore();

    useEffect(() => {
        if (safeFranchiseId) {
            fetchRiders(safeFranchiseId);
            fetchVehicles(safeFranchiseId);
        }
    }, [fetchRiders, fetchVehicles, safeFranchiseId]);

    // --- ACTIONS ---
    const saveShift = (shiftData: any) => {
        if (readOnly) {
            alert("Modo solo lectura: No se pueden guardar cambios.");
            return;
        }

        const existingId = shiftData.id || shiftData.shiftId;
        const isNewToken = !existingId || (typeof existingId === 'string' && existingId.startsWith('draft-'));

        const finalShift = {
            ...shiftData,
            id: existingId || `draft-${crypto.randomUUID()}`,
            isDraft: true,
            isNew: isNewToken
        };

        setLocalShifts(prev => {
            const filtered = prev.filter(s => String(s.id) !== String(finalShift.id));
            return [...filtered, finalShift];
        });
    };

    const deleteShift = (shiftId: string) => {
        if (readOnly) {
            alert("Modo solo lectura: No se pueden borrar turnos.");
            return;
        }
        const shiftIdStr = String(shiftId);
        if (shiftIdStr.startsWith('draft-')) {
            setLocalShifts(prev => prev.filter(s => String(s.id) !== shiftIdStr));
        } else {
            setDeletedIds(prev => {
                const newSet = new Set(prev);
                newSet.add(shiftIdStr);
                return newSet;
            });
            setLocalShifts(prev => prev.filter(s => String(s.id) !== shiftIdStr));
        }
    };

    const handlePublish = async () => {
        if (!safeFranchiseId || isPublishing || readOnly) return;
        setIsPublishing(true);
        try {
            for (const id of deletedIds) {
                await shiftService.deleteShift(id);
            }
            for (const s of localShifts) {
                const inputData = {
                    franchiseId: safeFranchiseId,
                    riderId: s.riderId,
                    riderName: s.riderName || rosterRiders.find(r => r.id === s.riderId)?.fullName || 'Rider',
                    motoId: s.motoId || null,
                    motoPlate: s.motoPlate || '',
                    startAt: s.startAt,
                    endAt: s.endAt
                };

                const isTrulyNew = (typeof s.id === 'string' && s.id.startsWith('draft-')) || !weekData?.shifts?.some(rs => rs.id === s.id);

                if (isTrulyNew) {
                    await shiftService.createShift(inputData);
                } else {
                    await shiftService.updateShift(s.id, inputData);
                }
            }

            // Notify Admin about the published schedule
            try {
                await notificationService.notify(
                    'SCHEDULE_PUBLISHED',
                    safeFranchiseId,
                    'Franquicia', // idealmente obtener el nombre real
                    {
                        title: 'Horario Publicado',
                        message: `La franquicia ha publicado su horario para la semana.`,
                        priority: 'normal',
                        metadata: { franchiseId: safeFranchiseId }
                    }
                );
                console.log("NOTIFICACIÓN DE PUBLICACIÓN ENVIADA");
            } catch (err) {
                console.warn("Error enviando notificación", err);
            }

            setLocalShifts([]);
            setDeletedIds(new Set());
            // alert("✅ Calendario publicado exitosamente.");
        } catch (error: any) {
            console.error(error);
            alert("Error al publicar.");
        } finally {
            setIsPublishing(false);
        }
    };

    // --- SHERIFF & AI LOGIC ---
    const handleAuditoria = async () => {
        // Audit merged shifts (remote + local drafts)
        if (!mergedShifts || mergedShifts.length === 0) {
            alert("El cuadrante está vacío. Añade turnos antes de auditar.");
            return;
        }
        setIsAuditing(true);
        setSheriffResult(null);
        try {
            const result = await validateWeeklySchedule(mergedShifts);
            if (result) {
                setSheriffResult(result);
            } else {
                alert("El Sheriff no ha podido validar el cuadrante. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error("Error en auditoría:", error);
            alert("Error de conexión con el Sheriff.");
        } finally {
            setIsAuditing(false);
        }
    };

    const handleAutoFix = async () => {
        if (!sheriffResult || !weekData) return;

        setIsFixing(true);
        try {
            const fixResult = await generateScheduleFix(
                mergedShifts || [],
                rosterRiders || [],
                sheriffResult.missingCoverage
            );

            if (fixResult && fixResult.newShifts.length > 0) {
                const confirmed = window.confirm(
                    `El Sheriff sugiere ${fixResult.newShifts.length} nuevos turnos:\n\n` +
                    fixResult.explanation +
                    `\n\n¿Aplicar cambios ahora (como borradores)?`
                );

                if (confirmed) {
                    const newDrafts = fixResult.newShifts.map(s => {
                        const startD = new Date(s.startDay);
                        startD.setHours(s.startHour, 0, 0, 0);
                        const endD = new Date(startD);
                        endD.setHours(s.startHour + s.duration, 0, 0, 0);

                        return {
                            id: `draft-fix-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            shiftId: `draft-fix-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            riderId: s.riderId,
                            riderName: rosterRiders.find(r => r.id === s.riderId)?.fullName || 'Rider',
                            motoId: null,
                            motoPlate: null,
                            startAt: toLocalISOStringWithOffset(startD),
                            endAt: toLocalISOStringWithOffset(endD),
                            isDraft: true,
                            isNew: true
                        };
                    });

                    setLocalShifts(prev => [...prev, ...newDrafts]);

                    // Re-audit automatically
                    setTimeout(() => handleAuditoria(), 1000);
                }
            } else {
                alert("El Sheriff no encontró una solución automática viable. Intenta mover turnos manualmente.");
            }
        } catch (error) {
            console.error("Auto-Fix Error:", error);
            alert("Error al aplicar la corrección automática.");
        } finally {
            setIsFixing(false);
        }
    };

    const handleGeneration = async () => {
        if (!genPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const startDate = toLocalDateString(getStartOfWeek(selectedDate));
            const endDate = toLocalDateString(addDays(getStartOfWeek(selectedDate), 6));

            const result = await generateFullSchedule(
                genPrompt,
                rosterRiders || [],
                startDate,
                endDate
            );

            if (result && result.shifts.length > 0) {
                const apply = window.confirm(`He generado ${result.shifts.length} turnos:\n\n${result.explanation}\n\n¿Aplicar al cuadrante?`);

                if (apply) {
                    const newDrafts = result.shifts.map(s => {
                        const startD = new Date(s.startDay);
                        startD.setHours(s.startHour, 0, 0, 0);
                        const endD = new Date(startD);
                        endD.setHours(s.startHour + s.duration, 0, 0, 0);

                        return {
                            id: `draft-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            shiftId: `draft-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            riderId: s.riderId,
                            riderName: rosterRiders.find(r => r.id === s.riderId)?.fullName || 'Rider',
                            motoId: null,
                            motoPlate: null,
                            startAt: toLocalISOStringWithOffset(startD),
                            endAt: toLocalISOStringWithOffset(endD),
                            isDraft: true,
                            isNew: true
                        };
                    });

                    setLocalShifts(prev => [...prev, ...newDrafts]);
                    setShowGenModal(false);
                    setGenPrompt('');
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error generando horario");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- EVENT SIMULATION ---
    const days = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(start, i);
            return {
                date,
                dateObj: date,
                isoDate: toLocalDateString(date),
                label: format(date, 'EEEE d', { locale: es }),
                shortLabel: format(date, 'EEE', { locale: es })
            };
        });
    }, [selectedDate]);

    // --- GRID CALCULATION ---
    const mergedShifts = useMemo(() => {
        const remote = weekData?.shifts || [];
        const liveRemote = remote.filter(s => !deletedIds.has(String(s.id || s.shiftId)));
        return [...liveRemote, ...localShifts];
    }, [weekData?.shifts, localShifts, deletedIds]);

    const ridersGrid = useMemo(() => {
        const ridersMap = new Map();
        rosterRiders.forEach(r => {
            if (r.status === 'active' || r.status === 'on_route') {
                ridersMap.set(r.id, {
                    id: r.id,
                    fullName: r.fullName,
                    shifts: [],
                    contractHours: r.contractHours || 40
                });
            }
        });

        mergedShifts.forEach(s => {
            const rid = s.riderId;
            if (ridersMap.has(rid)) {
                ridersMap.get(rid).shifts.push(s);
            }
        });

        return Array.from(ridersMap.values()).map(rider => {
            const totalHours = rider.shifts.reduce((acc: number, s: any) => {
                return acc + (differenceInMinutes(new Date(s.endAt), new Date(s.startAt))) / 60;
            }, 0);
            return { ...rider, totalWeeklyHours: totalHours };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [mergedShifts, rosterRiders]);

    const coverage = useMemo(() => {
        const res: Record<string, number[]> = {};
        days.forEach(d => res[d.isoDate] = Array(24).fill(0));
        mergedShifts.forEach(s => {
            const date = toLocalDateString(new Date(s.startAt));
            if (res[date]) {
                const sStart = new Date(s.startAt);
                const sEnd = new Date(s.endAt);
                const start = sStart.getHours();
                const end = sEnd.getHours();
                const endM = sEnd.getMinutes();
                const realEnd = (end === 0 && endM === 0) ? 24 : end;
                for (let h = start; h < realEnd; h++) {
                    if (h >= 0 && h < 24) res[date][h]++;
                }
            }
        });
        return res;
    }, [days, mergedShifts]);

    // --- TIME INDICATOR CALC ---
    const viewingToday = isToday(selectedDate);
    const redLinePosition = viewingToday ? (currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440 * 100 : null;

    // --- UI HELPERS ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any | null>(null);
    const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);
    const [prefillHour, setPrefillHour] = useState<number | undefined>(undefined);
    const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const handleQuickAdd = (dateIso: string, riderId: string, hour?: number) => {
        if (readOnly) return;
        const h = hour ?? 13;
        const baseDate = parseISO(dateIso);
        saveShift({
            riderId,
            startAt: toLocalISOString(setHours(baseDate, h)),
            endAt: toLocalISOString(setHours(baseDate, h + 4)),
            date: dateIso
        });
    };

    const handleAddShift = (dateIso: string, _riderId?: string, hour?: number) => {
        if (readOnly) return;
        setEditingShift(null);
        setSelectedDateForNew(dateIso);
        setPrefillHour(hour);
        setIsModalOpen(true);
    };

    const handleEditShift = (shift: any) => {
        if (readOnly) return;
        setEditingShift(shift);
        setIsModalOpen(true);
    };

    const simpleRiders = useMemo(() => rosterRiders.map(r => ({ id: r.id, fullName: r.fullName, name: r.fullName })), [rosterRiders]);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-400 font-medium">Cargando Matrix V3...</div>;

    if (isMobile) {
        return <MobileAgendaView
            days={days}
            visualEvents={mergedShifts.reduce((acc: any, s: any) => {
                const d = toLocalDateString(new Date(s.startAt));
                if (!acc[d]) acc[d] = [];
                acc[d].push({ ...s, visualStart: s.startAt, visualEnd: s.endAt, shiftId: s.id || s.shiftId });
                return acc;
            }, {})}
            onEditShift={handleEditShift}
            onDeleteShift={deleteShift}
            onAddShift={handleAddShift}
        />;
    }

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden font-sans">
            {/* --- HEADER V3 --- */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 z-30 sticky top-0">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => changeWeek(-1)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500"
                                aria-label="Semana anterior"
                                title="Semana anterior"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="px-2 text-lg font-medium text-slate-900 capitalize">
                                {format(selectedDate, 'MMMM yyyy', { locale: es })}
                            </span>
                            <button
                                onClick={() => changeWeek(1)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500"
                                aria-label="Semana siguiente"
                                title="Semana siguiente"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="flex bg-slate-100/50 p-1 rounded-full border border-slate-100">
                            <button onClick={() => setViewMode('day')} className={cn("px-4 py-1.5 text-xs font-medium rounded-full transition-all", viewMode === 'day' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Día</button>
                            <button onClick={() => setViewMode('week')} className={cn("px-4 py-1.5 text-xs font-medium rounded-full transition-all", viewMode === 'week' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Semana</button>
                        </div>

                        <button onClick={() => setShowPrime(!showPrime)} className={cn("px-4 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-2", showPrime ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm")}>
                            <Zap size={14} className={showPrime ? "fill-amber-500" : ""} /> PRIME
                        </button>
                    </div>

                    {!readOnly && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAuditoria}
                                disabled={isAuditing}
                                className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-bold shadow-sm hover:shadow-md active:scale-95 border backdrop-blur-sm
                                ${sheriffResult ? (sheriffResult.status === 'optimal' ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' : 'bg-amber-50/80 text-amber-700 border-amber-200') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                            `}
                            >
                                {isAuditing ? <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" /> : <BadgeCheck className="w-4 h-4" />}
                                {sheriffResult ? `Sheriff: ${sheriffResult.score}/100` : 'Auditar'}
                            </button>

                            <div className="flex items-center gap-1 p-0.5 bg-slate-100/50 rounded-full border border-slate-200">
                                <button onClick={() => setIsQuickFillOpen(true)} className="px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all text-xs font-medium flex items-center gap-2">
                                    <Zap size={14} className="fill-slate-300" /> Relleno
                                </button>
                                <div className="w-px h-4 bg-slate-300/50" />
                                <button onClick={() => setShowGenModal(true)} className="px-3 py-1.5 text-slate-600 hover:text-violet-600 hover:bg-white rounded-full transition-all text-xs font-medium flex items-center gap-2">
                                    <Sparkles size={14} className="text-amber-400" /> IA Mágica
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SHERIFF VISUAL OVERLAY */}
            {sheriffResult && (
                <div className="absolute top-[80px] right-6 z-50 w-80 animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto">
                    <div className={`
                        p-4 rounded-xl shadow-2xl border backdrop-blur-md
                        ${sheriffResult.status === 'optimal'
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                            : sheriffResult.status === 'critical'
                                ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                                : 'bg-amber-50/90 border-amber-200 text-amber-900'
                        }
                    `}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                {sheriffResult.status === 'optimal'
                                    ? <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                    : <AlertTriangle className="w-6 h-6" />
                                }
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-wider">Reporte del Sheriff</h3>
                                    <span className="text-xs font-bold opacity-80">Puntuación: {sheriffResult.score}/100</span>
                                </div>
                            </div>
                            <button onClick={() => setSheriffResult(null)} className="opacity-50 hover:opacity-100" title="Cerrar reporte">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs font-medium mb-3 leading-relaxed">
                            "{sheriffResult.feedback}"
                        </p>

                        {sheriffResult.missingCoverage.length > 0 && (
                            <div className="bg-white/50 rounded-lg p-2 text-[10px] font-mono mb-2">
                                <strong className="block mb-1 opacity-70">ALERTAS DE COBERTURA:</strong>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    {sheriffResult.missingCoverage.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {sheriffResult.status !== 'optimal' && (
                            <button
                                onClick={handleAutoFix}
                                disabled={isFixing}
                                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isFixing ? 'Corrigiendo...' : (
                                    <>
                                        <Wand2 className="w-3 h-3" />
                                        Corregir con IA
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full border-collapse table-fixed">
                    <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <tr>
                            <th className="w-64 p-4 text-left border-r border-slate-50 bg-white sticky left-0 z-40 text-[10px] uppercase font-bold tracking-widest text-slate-400">Personal</th>
                            {viewMode === 'week' ? days.map(d => (
                                <th key={d.isoDate} className={cn("p-3 text-center transition-colors hover:bg-slate-50/50", d.isoDate === toLocalDateString(new Date()) && "bg-indigo-50")}>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{d.shortLabel}</span>
                                        <span className={cn("text-base font-medium w-8 h-8 flex items-center justify-center rounded-full", d.isoDate === toLocalDateString(new Date()) ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-700")}>{format(d.date, 'd')}</span>
                                    </div>
                                </th>
                            )) : hours.map(h => (
                                <th key={h} className={cn("p-0 text-center text-[10px] font-bold tracking-tighter border-r border-dashed border-slate-100 relative h-10 align-middle transition-colors", showPrime && ((h >= 13 && h <= 15) || (h >= 20 && h <= 23)) ? "bg-amber-50/80 text-amber-600" : "text-slate-400/80")}>
                                    <span className="z-10 relative">{h}:00</span>
                                    {viewingToday && currentTime.getHours() === h && (
                                        <div
                                            className="absolute top-2 w-3 h-3 bg-red-500 rounded-full shadow-sm z-50 -translate-x-1/2"
                                            style={{ left: `calc(${(currentTime.getMinutes() / 60) * 100} * 1%)` } as any}
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ridersGrid.map(rider => (
                            <tr key={rider.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                <td className="p-4 border-r border-slate-100 bg-white sticky left-0 z-30 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.03)]">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg", getRiderColor(rider.id).bg)}>
                                            {getRiderInitials(rider.fullName)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate tracking-tight">{rider.fullName}</p>
                                            <div className="mt-1.5">
                                                <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                                                    <span className={rider.totalWeeklyHours < (rider.contractHours * 0.5) ? "text-amber-500" : rider.totalWeeklyHours <= rider.contractHours ? "text-emerald-500" : "text-rose-500"}>
                                                        {rider.totalWeeklyHours < (rider.contractHours * 0.5) ? "Carga Parcial" : rider.totalWeeklyHours <= rider.contractHours ? "Optimizado" : "Saturación"}
                                                    </span>
                                                    <span className="text-slate-400 tabular-nums">{rider.totalWeeklyHours.toFixed(1)} / {rider.contractHours}h</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                                    <div
                                                        className={cn("h-full transition-all duration-500", rider.totalWeeklyHours < (rider.contractHours * 0.5) ? "bg-amber-400" : rider.totalWeeklyHours <= rider.contractHours ? "bg-emerald-500" : "bg-rose-500")}
                                                        style={{ width: `calc(${Math.min((rider.totalWeeklyHours / rider.contractHours) * 100, 100)} * 1%)` } as any}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                {viewMode === 'week' ? days.map(d => {
                                    const dayShifts = rider.shifts.filter((s: any) => toLocalDateString(new Date(s.startAt)) === d.isoDate);
                                    return (
                                        <td key={d.isoDate} className={cn("p-2 align-top relative cursor-crosshair group/cell hover:bg-slate-50/30", coverage[d.isoDate]?.some(c => c < 4) ? "bg-rose-500/[0.02]" : "", d.isoDate === toLocalDateString(new Date()) && "bg-indigo-50")} onClick={() => handleQuickAdd(d.isoDate, rider.id)} onDoubleClick={() => handleAddShift(d.isoDate, rider.id)}>
                                            <div className="flex flex-col gap-1.5">
                                                {dayShifts.map((s: any) => {
                                                    const sStart = new Date(s.startAt);
                                                    const sEnd = new Date(s.endAt);
                                                    const isExpress = (differenceInMinutes(sEnd, sStart) / 60) < 3;

                                                    if (s.isDraft) {
                                                        return (
                                                            <div key={s.id} onClick={(e) => { e.stopPropagation(); handleEditShift(s); }} className="px-2.5 py-2 rounded-xl bg-white/50 border-2 border-dashed border-indigo-200 text-indigo-500 text-[10px] font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-between">
                                                                <span className="truncate">{format(sStart, 'HH:mm')} - {format(sEnd, 'HH:mm')}</span>
                                                                <Clock size={10} className="animate-spin-slow opacity-40" />
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div key={s.id} onClick={(e) => { e.stopPropagation(); handleEditShift(s); }} className={cn("px-2.5 py-2 rounded-md shadow-sm ring-1 ring-black/5 text-[10px] font-medium text-white transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer flex items-center justify-between gap-1",
                                                            s.changeRequested ? "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400/50 shadow-amber-500/20" :
                                                                s.isConfirmed ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400/50 shadow-emerald-500/20" :
                                                                    sStart.getHours() < 15 ? "bg-gradient-to-br from-emerald-500 to-teal-400 opacity-90" : "bg-gradient-to-br from-indigo-600 to-blue-500 opacity-90"
                                                        )}>
                                                            <span className="whitespace-nowrap tracking-tighter">{format(sStart, 'HH:mm')} - {format(sEnd, 'HH:mm')}</span>
                                                            <div className="flex items-center gap-1">
                                                                {s.changeRequested && <div title="Solicitud de cambio" className="animate-pulse"><Zap size={10} className="fill-white text-white" /></div>}
                                                                {s.isConfirmed && !s.changeRequested && <div title="Confirmado" className="bg-white/20 rounded-full p-0.5"><Zap size={8} className="fill-white text-white" /></div>}
                                                                {isExpress && <Zap size={10} className="fill-white/20 border-none" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    );
                                }) : (
                                    <td className="p-0 relative h-16 bg-white" colSpan={24}>
                                        <div className="absolute inset-0 flex">
                                            {hours.map(h => (
                                                <div key={h} className={cn("flex-1 border-r border-slate-100/50 relative cursor-crosshair transition-colors", showPrime && ((h >= 13 && h <= 15) || (h >= 20 && h <= 23)) ? "bg-amber-100/30" : "hover:bg-slate-50/30")} onClick={() => handleQuickAdd(toLocalDateString(selectedDate), rider.id, h)} onDoubleClick={() => handleAddShift(toLocalDateString(selectedDate), rider.id, h)}>
                                                    {rider.shifts.filter((shift: any) => {
                                                        const sStart = new Date(shift.startAt);
                                                        const sEnd = new Date(shift.endAt);
                                                        if (toLocalDateString(sStart) !== toLocalDateString(selectedDate)) return false;
                                                        const start = sStart.getHours();
                                                        const end = sEnd.getHours();
                                                        const endM = sEnd.getMinutes();
                                                        const realEnd = (end === 0 && endM === 0) ? 24 : end;
                                                        return h >= start && h < realEnd;
                                                    }).map((shift: any) => {
                                                        const sStart = new Date(shift.startAt);
                                                        const isStart = sStart.getHours() === h;
                                                        const isDraft = shift.isDraft;

                                                        return (
                                                            <div
                                                                key={shift.id}
                                                                onClick={(e) => { e.stopPropagation(); handleEditShift(shift); }}
                                                                className={cn(
                                                                    "absolute top-0 h-full w-[calc(100%+1px)] -right-[0.5px] z-10 flex items-center select-none transition-all cursor-pointer shadow-sm border-t border-white/20",
                                                                    isStart ? "rounded-l-lg pl-2" : "rounded-l-none",
                                                                    (new Date(shift.endAt).getHours() === h + 1 || (new Date(shift.endAt).getHours() === 0 && h === 23)) ? "rounded-r-lg" : "rounded-r-none",
                                                                    isDraft
                                                                        ? "bg-white border-2 border-dashed border-indigo-400 text-indigo-600 z-20"
                                                                        : shift.changeRequested ? "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400" :
                                                                            shift.isConfirmed ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400 shadow-md ring-1 ring-white/30" :
                                                                                (sStart.getHours() < 15 ? "bg-gradient-to-b from-emerald-400 to-emerald-500 text-white" : "bg-gradient-to-b from-blue-500 to-blue-600 text-white")
                                                                )}
                                                            >
                                                                {isStart && (
                                                                    <span className="text-[10px] font-medium tracking-tight whitespace-nowrap overflow-visible z-20 text-white/90 drop-shadow-sm">
                                                                        {format(sStart, 'HH:mm')} - {format(new Date(shift.endAt), 'HH:mm')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                            {viewingToday && (
                                                <div
                                                    className="absolute top-0 bottom-0 border-l-[2px] border-red-500 z-50 pointer-events-none transition-all"
                                                    style={{ left: `calc(${redLinePosition} * 1%)` } as any}
                                                />
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white border-t border-slate-100 px-8 py-4 flex items-center gap-8 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.02)] z-30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Cobertura Mínima
                </span>
                <div className="flex-1 flex gap-3">
                    {days.map(d => {
                        const min = Math.min(...(coverage[d.isoDate] || []));
                        return (
                            <div key={d.isoDate} className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden relative group/foot transition-all hover:h-2.5">
                                <div className={cn("h-full transition-all duration-700", min < 4 ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]")} style={{ width: `${Math.min((min / 4) * 100, 100)}%` }} />
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover/foot:opacity-100 pointer-events-none transition-all scale-95 group-hover/foot:scale-100 shadow-xl whitespace-nowrap">
                                    <span className="font-bold">{min}/4</span> riders activos en {d.shortLabel}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isModalOpen && (
                <ShiftModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={saveShift}
                    onDelete={deleteShift}
                    initialData={editingShift}
                    selectedDate={selectedDateForNew || toLocalDateString(selectedDate)}
                    prefillHour={prefillHour}
                    riders={simpleRiders}
                    motos={vehicles.map(v => ({ id: (v.id || 'none') as string, licensePlate: (v.matricula || '') as string, model: (v.modelo || '') as string }))}
                />
            )}

            {isQuickFillOpen && (
                <QuickFillModal
                    isOpen={isQuickFillOpen}
                    onClose={() => setIsQuickFillOpen(false)}
                    onRefresh={() => { }}
                    franchiseId={safeFranchiseId}
                    riders={simpleRiders}
                    motos={motos}
                    weekDays={days}
                    existingShifts={mergedShifts}
                />
            )}

            {hasUnsavedChanges && (
                <div className="fixed bottom-28 right-10 z-[60] animate-in zoom-in-95 slide-in-from-bottom-5">
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="flex items-center gap-4 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ring-8 ring-indigo-50"
                    >
                        {isPublishing ? <Loader2 size={24} className="animate-spin" /> : <Save size={20} />}
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-sm">Publicar Horario</span>
                            <span className="text-[10px] opacity-70 italic">{localShifts.length + deletedIds.size} cambios pendientes</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default DeliveryScheduler;
