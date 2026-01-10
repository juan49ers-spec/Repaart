import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Zap, Filter } from 'lucide-react';
import ShiftModal from './ShiftModal';
import ShiftCard from './ShiftCard';
import QuickFillModal from './QuickFillModal';

import { findMotoConflict, findRiderConflict } from '../../utils/schedulerValidation';
import { toLocalISOStringWithOffset, toLocalDateString, getStartOfWeek } from '../../utils/dateUtils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileAgendaView from './MobileAgendaView';
import { useWeeklySchedule, getWeekIdFromDate, type Shift, type WeekData } from '../../hooks/useWeeklySchedule';
import { WeekService } from '../../services/scheduler/weekService';
import { toFranchiseId, toWeekId } from '../../schemas/scheduler';
import { calculateDayLayout } from '../../utils/eventLayout';
import ConfirmationModal from '../../ui/feedback/ConfirmationModal';
import { getRiderColorMap } from '../../utils/riderColors';
import { useWeather } from '../../hooks/useWeather';
import { getWeatherIcon } from '../../utils/weather';
import { useAuth } from '../../context/AuthContext';

interface WeeklySchedulerProps {
    franchiseId: string;
    readOnly?: boolean;
}

interface VisualEvent extends Shift {
    visualDate: string;
    visualStart: Date;
    visualEnd: Date;
    isContinuation: boolean;
    layout?: any;
}

interface ShiftEvent extends VisualEvent {
    // Ensuring it has all properties needed by ShiftCard/Layout
    riderId: string;
    riderName: string;
}

const WeeklyScheduler: React.FC<WeeklySchedulerProps> = ({ franchiseId, readOnly = false }) => {
    // --- STATE MANAGEMENT (HOOK) ---
    const {
        weekData,
        loading,
        referenceDate,
        currentWeekId,
        riders,
        motos,
        navigateWeek,
        saveWeek,
        updateWeekData
    } = useWeeklySchedule(franchiseId, readOnly);

    // --- UI Local State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any | null>(null); // Ideally narrow down ShiftData
    const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);
    const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null); // Filter by rider

    // PRIME MODE STATE - Horario Prime: 12:00-16:00 (comidas) y 19:00-24:00 (cenas)

    const { user } = useAuth();
    // Fetch weather for this franchise context (Franchises are in 'users' collection)
    const { daily: weatherDaily } = useWeather(franchiseId || user?.uid, 'users');

    const [viewMode, setViewMode] = useState<'full' | 'prime'>('full');

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        confirmText: 'Confirmar'
    });

    // Helpers
    const changeWeek = (dir: number) => navigateWeek(dir);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const isSaving = loading || isProcessing;
    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    // --- LOGIC: Shift Operations ---

    const handleOpenNew = (dateIsoString?: string) => {
        if (readOnly) return;
        setEditingShift(null);
        if (dateIsoString) {
            setSelectedDateForNew(dateIsoString);
        } else {
            const today = toLocalDateString(new Date());
            const isTodayInWeek = weekData && weekData.startDate && weekData.endDate && today >= weekData.startDate && today <= weekData.endDate;
            setSelectedDateForNew(isTodayInWeek ? today : (weekData?.startDate || today));
        }
        setIsModalOpen(true);
    };

    // eslint-disable-next-line no-unused-vars
    // const handleCopyWeek = async () => { ... } // Kept commented as in original if not used

    const handleSaveShift = async (shiftPayload: any) => {
        // Internal save logic extracted for reuse in callbacks
        const saveInternal = async (payload: any) => {
            try {
                setIsProcessing(true);
                const currentShifts = weekData?.shifts || [];
                let updatedShifts: Shift[];

                if (editingShift) {
                    updatedShifts = currentShifts.map((s: any) => (s.shiftId === payload.shiftId || s.id === payload.shiftId) ? payload : s);
                } else {
                    updatedShifts = [...currentShifts, payload];
                }

                const updatedWeekData: WeekData = {
                    ...(weekData || {}),
                    shifts: updatedShifts,
                    id: currentWeekId,
                    startDate: weekData?.startDate || referenceDate.toISOString().split('T')[0],
                    status: weekData?.status || 'draft',
                    metrics: weekData?.metrics || { totalHours: 0, activeRiders: 0, motosInUse: 0 }
                } as WeekData;
                await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
                updateWeekData(updatedWeekData);
                setIsModalOpen(false);
            } catch (error: any) {
                console.error("Error saving shift:", error);
                alert("Error al guardar el turno.");
            } finally {
                setIsProcessing(false);
            }
        };

        const currentShifts = weekData?.shifts || [];

        // A. Moto Conflict
        const motoConflict = findMotoConflict(shiftPayload, currentShifts, editingShift?.shiftId);
        if (motoConflict) {
            setConfirmDialog({
                isOpen: true,
                title: 'Conflicto de Moto',
                message: `La moto ya está asignada a ${motoConflict.riderName} en este horario. ¿Quieres asignarla de todas formas?`,
                confirmText: 'Asignar Igualmente',
                isDestructive: true,
                onConfirm: () => saveInternal(shiftPayload)
            });
            return;
        }

        // B. Rider Conflict
        const riderConflict = findRiderConflict(shiftPayload, currentShifts, editingShift?.shiftId);
        if (riderConflict) {
            setConfirmDialog({
                isOpen: true,
                title: 'Conflicto de Rider',
                message: `${shiftPayload.riderName} ya tiene turno. ¿Crear igual?`,
                confirmText: 'Crear Igualmente',
                isDestructive: true,
                onConfirm: () => saveInternal(shiftPayload)
            });
            return;
        }

        // No conflicts
        await saveInternal(shiftPayload);
    };

    const handleQuickFillCreate = async (shifts: any[]) => {
        if (!weekData) return;
        setIsProcessing(true);
        try {
            const newShifts = shifts.map(shift => {
                const startDate = new Date(`${shift.date}T${shift.startTime}:00`);
                const endDate = new Date(`${shift.date}T${shift.endTime}:00`);
                return {
                    id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    shiftId: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    riderId: shift.riderId,
                    riderName: shift.riderName,
                    motoId: shift.motoId || null,
                    motoPlate: shift.motoId ? motos.find((m: any) => m.id === shift.motoId)?.licensePlate : null,
                    startAt: toLocalISOStringWithOffset(startDate),
                    endAt: toLocalISOStringWithOffset(endDate),
                    notes: 'Creado con Relleno Rápido'
                };
            });

            const updatedShifts: Shift[] = [...(weekData.shifts || []), ...newShifts];
            const updatedWeekData: WeekData = {
                ...weekData,
                shifts: updatedShifts,
                id: currentWeekId,
                startDate: weekData.startDate || referenceDate.toISOString().split('T')[0]
            } as WeekData;
            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
            updateWeekData(updatedWeekData);
            alert(`✅ ${newShifts.length} turno(s) creado(s)!`);
        } catch (error) {
            console.error("Error creating bulk shifts:", error);
            alert("Error al crear los turnos.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteShift = async (shiftId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        const performDelete = async () => {
            try {
                setIsProcessing(true);
                const currentShifts = weekData?.shifts || [];
                const updatedShifts = currentShifts.filter((s) => (s.shiftId !== shiftId && (s.id as string) !== shiftId));
                if (!weekData) return;
                const updatedWeekData: Partial<WeekData> = { ...weekData, shifts: updatedShifts, id: currentWeekId };
                await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
                updateWeekData(updatedWeekData as WeekData);
                setIsModalOpen(false);
            } catch (error) {
                console.error("Error deleting shift:", error);
                alert("Error al eliminar.");
            } finally {
                setIsProcessing(false);
            }
        };

        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Turno',
            message: '¿Seguro que quieres eliminar este turno? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            isDestructive: true,
            onConfirm: performDelete
        });
    };

    const handleCloneShift = async (shift: Shift, e: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            setIsProcessing(true);
            const clonedShift = {
                ...shift,
                shiftId: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            const currentShifts = weekData?.shifts || [];
            const updatedShifts = [...currentShifts, clonedShift];
            const updatedWeekData: WeekData = {
                status: 'draft',
                metrics: { totalHours: 0, activeRiders: 0, motosInUse: 0 },
                ...(weekData || {}),
                shifts: updatedShifts,
                id: currentWeekId,
                startDate: weekData?.startDate || referenceDate.toISOString().split('T')[0]
            } as WeekData;
            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
            updateWeekData(updatedWeekData);
        } catch (error) {
            console.error("Error cloning shift:", error);
            alert("Error al duplicar turno.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- HELPERS FOR RENDERING ---

    const getDays = () => {
        let start: Date;
        if (weekData?.startDate) {
            const [y, m, d] = weekData.startDate.split('-').map(Number);
            start = new Date(y, m - 1, d);
        } else {
            const startString = getStartOfWeek(referenceDate);
            start = new Date(startString);
        }
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push({
                dateObj: d,
                label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                isoDate: toLocalDateString(d),
                shortLabel: d.toLocaleDateString('es-ES', { weekday: 'short' })
            });
        }
        return days;
    };

    const days = getDays();

    // --- OPTIMIZATION: GROUP BY DAY DICTIONARY (O(N)) ---
    const visualEvents = useMemo(() => {
        if (!weekData?.shifts) return {} as Record<string, VisualEvent[]>;

        const groupedEvents: Record<string, VisualEvent[]> = {}; // Dictionary: { 'YYYY-MM-DD': [events...] }

        // Helper to push to dictionary safely
        const pushToDay = (dateKey: string, eventObj: VisualEvent) => {
            if (!groupedEvents[dateKey]) groupedEvents[dateKey] = [];
            groupedEvents[dateKey].push(eventObj);
        };

        weekData.shifts.forEach((shift: Shift) => {
            const startISO = shift.startAt;
            const endISO = shift.endAt;

            // WARNING: INTENTIONAL TIMEZONE STRIPPING FOR VISUAL CONSISTENCY
            const parseDateManual = (isoStr: string) => {
                if (!isoStr) return new Date();
                const cleanStr = isoStr.replace('Z', '').split('.')[0];
                const [datePart, timePart] = cleanStr.split('T');
                const [y, m, d] = datePart.split('-').map(Number);
                const [h, min] = timePart.split(':').map(Number);
                return new Date(y, m - 1, d, h, min, 0);
            };

            const start = parseDateManual(startISO);
            const end = parseDateManual(endISO);
            const startDay = startISO.split('T')[0];
            const endDay = endISO.split('T')[0];

            if (startDay === endDay) {
                pushToDay(startDay, {
                    ...shift,
                    visualDate: startDay,
                    visualStart: start,
                    visualEnd: end,
                    isContinuation: false
                });
            } else {
                // Cross-Midnight Split
                const endOfDay = new Date(start);
                endOfDay.setHours(23, 59, 59, 999);
                pushToDay(startDay, {
                    ...shift,
                    visualDate: startDay,
                    visualStart: start,
                    visualEnd: endOfDay,
                    isContinuation: false
                });

                const startOfNextDay = new Date(end);
                startOfNextDay.setHours(0, 0, 0, 0);
                pushToDay(endDay, {
                    ...shift,
                    visualDate: endDay,
                    visualStart: startOfNextDay,
                    visualEnd: end,
                    isContinuation: true
                });
            }
        });

        return groupedEvents;
    }, [weekData?.shifts]);

    // Color map for riders
    const riderColorMap = useMemo(() => {
        return getRiderColorMap(riders || []);
    }, [riders]);

    // Drag & Drop
    const handleDrop = async (e: React.DragEvent, targetDay: { isoDate: string }) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-500/10', 'border-blue-400/50');
        if (readOnly) return;

        try {
            const rawData = e.dataTransfer.getData('application/json');
            if (!rawData) return;
            const shiftData = JSON.parse(rawData);

            setIsProcessing(true);

            const originalStart = new Date(shiftData.startAt);
            const originalEnd = new Date(shiftData.endAt);
            const duration = originalEnd.getTime() - originalStart.getTime();

            const newStart = new Date(targetDay.isoDate);
            const newEnd = new Date(targetDay.isoDate);
            newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
            newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);
            newEnd.setTime(newStart.getTime() + duration);

            const updatedShift = {
                ...shiftData,
                startAt: newStart.toISOString(),
                endAt: newEnd.toISOString()
            };

            // Basic conflict check
            const hasConflict = weekData?.shifts.some((s: Shift) => {
                if (s.shiftId === shiftData.shiftId) return false;
                const sameRider = s.riderId === updatedShift.riderId;
                const sameMoto = s.motoId && updatedShift.motoId && s.motoId === updatedShift.motoId;
                const sStart = new Date(s.startAt);
                const sEnd = new Date(s.endAt);
                const timeOverlap = !(newEnd <= sStart || newStart >= sEnd);
                return timeOverlap && (sameRider || sameMoto);
            });

            if (hasConflict) {
                alert('⚠️ ¡Conflicto detectado! El turno no puede moverse a ese horario.');
                setIsProcessing(false);
                return;
            }

            if (!weekData) return;
            const currentShifts = weekData.shifts || [];
            const updatedShifts = currentShifts.map((s: Shift) =>
                s.shiftId === shiftData.shiftId ? updatedShift : s
            );
            const updatedWeekData: WeekData = {
                ...weekData,
                shifts: updatedShifts,
                id: currentWeekId,
                startDate: weekData.startDate || (referenceDate instanceof Date ? referenceDate.toISOString() : referenceDate).split('T')[0]
            } as WeekData;
            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
            updateWeekData(updatedWeekData);

        } catch (error) {
            console.error('Error dropping shift:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-500/10', 'border-blue-400/50'); };
    const handleDragLeave = (e: React.DragEvent) => { e.currentTarget.classList.remove('bg-blue-500/10', 'border-blue-400/50'); };
    const handleEditShift = (shift: any) => { setEditingShift(shift); setSelectedDateForNew(null); setIsModalOpen(true); };
    const handleColumnClick = (e: React.MouseEvent, dateIso: string) => { if (e.target === e.currentTarget) handleOpenNew(dateIso); };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onSaveAll = () => saveWeek(franchiseId, currentWeekId, weekData as WeekData);

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-indigo-50/30 font-sans text-slate-900 overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-900">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* --- HEADER --- */}
            <div className="flex items-center justify-between p-2 border-b border-white/50 bg-white/60 backdrop-blur-xl sticky top-0 z-30 shadow-sm supports-[backdrop-filter]:bg-white/40 h-14">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-slate-900 flex items-center tracking-tight">
                        <span className="bg-gradient-to-r from-indigo-900 to-slate-800 bg-clip-text text-transparent mr-2">
                            {(() => {
                                const d = new Date(referenceDate);
                                const month = d.toLocaleDateString('es-ES', { month: 'long' });
                                const year = d.getFullYear();
                                return <span className="capitalize">{month} <span className="text-slate-400 font-light text-base">{year}</span></span>;
                            })()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/50 text-slate-500 text-[10px] font-bold border border-slate-200/60 shadow-sm backdrop-blur-sm">
                            S{getWeekIdFromDate(new Date(referenceDate)).split('_')[1]}
                        </span>
                    </h2>
                    <div className="flex gap-1 bg-slate-100/50 p-0.5 rounded-lg border border-slate-200/50">
                        <button onClick={() => changeWeek(-1)} aria-label="Semana anterior" className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => changeWeek(1)} aria-label="Semana siguiente" className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* VIEW MODE TOGGLES */}
                    <div className="bg-white p-1 rounded-lg border-2 border-slate-200 dark:border-slate-700 flex gap-0.5 mr-2 shadow-sm scale-90 origin-right">
                        <button
                            onClick={() => setViewMode('prime')}
                            className={`group relative px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${viewMode === 'prime'
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-1.5">
                                <Filter className={`w-3 h-3 transition-transform group-hover:scale-110 ${viewMode === 'prime' ? 'text-white' : 'text-amber-500'}`} />
                                <div className="flex flex-col items-start leading-none">
                                    <span className={`tracking-wide font-black ${viewMode === 'prime' ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>PRIME</span>
                                </div>
                            </div>
                            {viewMode === 'prime' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode('full')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all duration-300 ${viewMode === 'full'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            TODO EL DÍA
                        </button>
                    </div>

                    {!isMobile && (
                        <>
                            {/* Rider Filter Selector */}
                            <div className="flex items-center gap-2 mr-2">
                                <select
                                    value={selectedRiderId || ''}
                                    onChange={(e) => setSelectedRiderId(e.target.value || null)}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                    aria-label="Filtrar por rider"
                                >
                                    <option value="">🏍️ Riders</option>
                                    {riders?.map((rider) => (
                                        <option key={rider.id} value={rider.id}>
                                            {rider.fullName || rider.id}
                                        </option>
                                    ))}
                                </select>
                                {/* Color Legend - Only show riders that exist */}
                                {selectedRiderId === null && riders && riders.length > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm">
                                        <span className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Riders:</span>
                                        {riders.map((rider) => {
                                            const color = riderColorMap.get(rider.id);
                                            return (
                                                <div
                                                    key={rider.id}
                                                    className={`w-2 h-2 rounded-full ${color?.bg} border ${color?.border} shadow-sm transition-transform hover:scale-125 cursor-help`}
                                                    title={rider.fullName || rider.id}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <button onClick={onSaveAll} disabled={isSaving || readOnly} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-all disabled:opacity-50 text-[10px] font-bold shadow-sm hover:shadow-md active:scale-95">
                                <Save className="w-3 h-3" />
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={() => setIsQuickFillOpen(true)} disabled={readOnly} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition-all disabled:opacity-50 text-[10px] font-bold active:scale-95 shadow-sm">
                                <Zap className="w-3 h-3" />
                                Relleno Rápido
                            </button>
                        </>
                    )}
                    {isMobile && !readOnly && (
                        <button onClick={() => setIsQuickFillOpen(true)} aria-label="Auto-Rellenar" className="p-2 bg-indigo-600 text-white rounded-lg shadow-md">
                            <Zap className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {loading || isProcessing ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
                    <div className="animate-spin mr-3 h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    <span className="font-medium text-slate-500">Cargando semana...</span>
                </div>
            ) : (
                <div className="flex-1 overflow-auto bg-slate-50 relative">
                    {isMobile ? (
                        // --- MOBILE VIEW ---
                        <div className="flex-1 overflow-auto bg-slate-50 relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                            <div className="p-4">
                                <MobileAgendaView
                                    days={days}
                                    // Optimized: Pass dictionary directly for O(1) access
                                    visualEvents={visualEvents}
                                    onEditShift={handleEditShift}
                                    onDeleteShift={handleDeleteShift}
                                    onAddShift={handleOpenNew}
                                />
                            </div>
                        </div>
                    ) : (
                        // --- DESKTOP VIEW ---
                        <div className="min-w-[1000px] h-full flex flex-col bg-white/40 border-l border-white/20">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm pl-9">
                                {days.map((day, i) => {
                                    const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                                    return (
                                        <div key={i} className={`px-2 py-3 border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-indigo-50/50 backdrop-blur-sm shadow-[inset_0_-2px_4px_rgba(0,0,0,0.02)]' : ''} transition-colors hover:bg-white/60 flex items-center justify-between gap-1`}>
                                            <div className="flex items-baseline gap-1.5">
                                                <div className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    {day.label.split(' ')[0]}
                                                </div>
                                                <div className={`text-lg font-black tracking-tight leading-none ${isToday ? 'text-indigo-600 drop-shadow-sm' : 'text-slate-700'}`}>
                                                    {day.label.split(' ')[1]}
                                                </div>
                                            </div>

                                            {/* Weather Forecast */}
                                            {weatherDaily && (
                                                <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                                                    {(() => {
                                                        const idx = weatherDaily.time.findIndex(t => t === day.isoDate);

                                                        if (idx !== -1) {
                                                            const max = Math.round(weatherDaily.temperature_2m_max[idx]);
                                                            const min = Math.round(weatherDaily.temperature_2m_min[idx]);
                                                            const code = weatherDaily.weathercode[idx];
                                                            return (
                                                                <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity bg-white/40 px-1.5 py-0.5 rounded-lg border border-white/40 shadow-sm">
                                                                    <div className="scale-125 origin-center">
                                                                        {getWeatherIcon(code, "w-6 h-6")}
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-slate-500 flex items-center leading-none pl-1">
                                                                        <span>{max}°</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Scrollable Timeline Area (Fixed CSS) */}
                            <div className="flex-1 overflow-y-auto relative no-scrollbar bg-slate-50/30">
                                {/* Current Time Indicator Line (if functional requirement, strictly visual here) */}

                                {/* Time Lines */}
                                <div className="absolute inset-0 pointer-events-none z-0">
                                    {(() => {
                                        // Filtrar horas según modo
                                        const hoursToShow = viewMode === 'prime'
                                            ? hours.filter(h => {
                                                const hourNum = parseInt(h);
                                                return (hourNum >= 12 && hourNum <= 15) || (hourNum >= 19 && hourNum <= 23);
                                            })
                                            : hours;

                                        return hoursToShow.map((hour, i) => {
                                            const hourNum = parseInt(hour);
                                            const isPrimeComida = hourNum >= 12 && hourNum <= 15;
                                            const isPrimeCena = hourNum >= 19 && hourNum <= 23;
                                            const isPrimeBlock = isPrimeComida || isPrimeCena;

                                            // En modo prime, recalcular posición para que sea contiguo
                                            const topPos = viewMode === 'prime'
                                                ? i * 60 // Posiciones consecutivas
                                                : hourNum * 60; // Posiciones absolutas

                                            return (
                                                <div key={i} className={`absolute w-full flex items-start group ${isPrimeBlock
                                                    ? 'border-t border-amber-200/40 bg-gradient-to-r from-amber-50/50 to-transparent'
                                                    : 'border-t border-slate-100/60'
                                                    }`} style={{ top: `${topPos}px`, height: '60px' } as React.CSSProperties}>

                                                    {/* Hour Label */}
                                                    <div className="flex flex-col pl-2 pt-2 w-9 shrink-0 items-center relative">
                                                        <span className={`text-[10px] font-bold tracking-tighter ${isPrimeBlock ? 'text-amber-600' : 'text-slate-300'
                                                            }`}>{hour}</span>

                                                        {/* Professional Vertical Indicators */}
                                                        {isPrimeComida && hourNum === 12 && (
                                                            <div className="absolute top-8 left-2 flex flex-col items-center gap-1 opacity-70">
                                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                                                                    COMIDA
                                                                </span>
                                                                <div className="w-0.5 h-6 bg-amber-300/50 rounded-full" />
                                                            </div>
                                                        )}
                                                        {isPrimeCena && hourNum === 19 && (
                                                            <div className="absolute top-8 left-2 flex flex-col items-center gap-1 opacity-70">
                                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                                                                    CENA
                                                                </span>
                                                                <div className="w-0.5 h-6 bg-amber-300/50 rounded-full" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Subtle Block Divider for Prime */}
                                                    {isPrimeBlock && (
                                                        <div className="absolute inset-0 border-l border-amber-100/30 pointer-events-none" />
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Columns Container */}
                                <div className={`grid grid-cols-7 relative z-10 pl-9 ${viewMode === 'prime' ? 'h-[540px]' : 'h-[1440px]'}`}>
                                    {days.map((day, colIndex) => {
                                        // O(1) Lookup - No more .filter()
                                        const dayEvents = visualEvents[day.isoDate] || [];
                                        // Improved: Min card width 80px triggers Deck Mode earlier (smart stacking)
                                        const layoutEvents = calculateDayLayout(dayEvents as any[], 140, 80);

                                        return (
                                            <div
                                                key={colIndex}
                                                className="relative border-r border-slate-200/60 last:border-r-0 h-full group transition-colors hover:bg-indigo-50/10"
                                                onClick={(e) => handleColumnClick(e, day.isoDate)}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, day)}
                                            >
                                                {!readOnly && (
                                                    <div className="hidden group-hover:flex items-center justify-center absolute w-full h-12 bg-indigo-50/40 border-y border-indigo-100 pointer-events-none z-0 backdrop-blur-[2px] top-0 shadow-sm">
                                                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                                            Añadir Turno
                                                        </span>
                                                    </div>
                                                )}

                                                {layoutEvents.map((ev: any) => {
                                                    const style = ev.layout;
                                                    const shiftEvent = ev as ShiftEvent;

                                                    // Calcular posición ajustada para modo Prime
                                                    let adjustedTop = style.top;
                                                    if (viewMode === 'prime' && shiftEvent.visualStart) {
                                                        const startHour = shiftEvent.visualStart.getHours();
                                                        const startMinutes = shiftEvent.visualStart.getMinutes();

                                                        // Mapear horas Prime a posiciones consecutivas
                                                        if (startHour >= 12 && startHour <= 15) {
                                                            // Comida: 12-15 → posiciones 0-3 (0-240px)
                                                            adjustedTop = (startHour - 12) * 60 + startMinutes;
                                                        } else if (startHour >= 19 && startHour <= 23) {
                                                            // Cena: 19-23 → posiciones 4-8 (240-540px)
                                                            adjustedTop = ((startHour - 19) + 4) * 60 + startMinutes;
                                                        } else {
                                                            // Turno fuera de Prime (ocultar)
                                                            adjustedTop = -9999;
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={ev.id + (ev.isContinuation ? '-c' : '')}
                                                            className={`absolute transition-all duration-300 ${style.isDeck ? 'hover:z-50' : 'hover:z-50'}`}
                                                            style={{
                                                                top: `${adjustedTop}px`,
                                                                height: `${style.height}px`,
                                                                left: style.left,
                                                                width: style.width,
                                                                zIndex: style.zIndex,
                                                                paddingRight: '2px',
                                                                paddingLeft: '2px'
                                                            } as React.CSSProperties}
                                                        >
                                                            <div className="h-full w-full relative drop-shadow-sm hover:drop-shadow-md transition-shadow">
                                                                <ShiftCard
                                                                    event={shiftEvent as any}
                                                                    onClick={(e) => { e.stopPropagation(); handleEditShift(shiftEvent); }}
                                                                    onClone={(ev: any, e: any) => handleCloneShift(ev as Shift, e)}
                                                                    onDelete={handleDeleteShift}
                                                                    readOnly={readOnly}
                                                                    style={{ height: '100%' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <QuickFillModal
                isOpen={isQuickFillOpen}
                onClose={() => setIsQuickFillOpen(false)}
                onCreateShifts={handleQuickFillCreate as any}
                riders={riders}
                motos={motos as any}
                weekDays={days}
            />

            <ShiftModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveShift}
                initialData={editingShift}
                riders={riders}
                motos={motos}
                selectedDate={selectedDateForNew || undefined}
                onDelete={handleDeleteShift}
            />

            <ConfirmationModal
                isOpen={confirmDialog.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                isDestructive={confirmDialog.isDestructive}
                confirmText={confirmDialog.confirmText}
            />


        </div>
    );
};

export default WeeklyScheduler;
