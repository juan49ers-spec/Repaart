import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Truck, Clock, Calendar, AlertCircle, ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import { toLocalDateString, toLocalISOStringWithOffset } from '../../utils/dateUtils';
import { getRiderInitials } from '../../utils/colorPalette';
import { cn } from '../../lib/utils';

interface Rider {
    id: string;
    fullName: string;
}

interface Moto {
    id: string;
    licensePlate: string;
    model: string;
}

interface MotoAssignment {
    motoId: string;
    plate: string;
    startAt: string;
    endAt: string;
}

interface ShiftData {
    shiftId?: string;
    riderId: string;
    riderName: string;
    startAt: string;
    endAt: string;
    date: string;
    startTime: string;
    endTime: string;
    day: string;
    motoId: string | null;
    motoPlate: string | null;
    motoAssignments: MotoAssignment[];
}

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ShiftData) => void;
    onDelete?: (shiftId: string) => void;
    initialData?: {
        shiftId?: string; // Optional to match Shift schema - can use id || shiftId
        id?: string;
        riderId?: string | null;
        startAt: string;
        endAt: string;
        motoAssignments?: { motoId: string }[];
        changeRequested?: boolean;
        changeReason?: string | null;
    } | null;
    selectedDate?: string;
    prefillHour?: number;
    isSaving?: boolean;
    riders?: Rider[];
    motos?: Moto[];
    existingShifts?: { startAt: string | Date; endAt: string | Date; riderId?: string; [key: string]: unknown }[];
}

interface FormValues {
    riderId: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    motoId: string;
}

const ShiftModal: React.FC<ShiftModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    selectedDate,
    prefillHour,
    isSaving = false,
    riders = [],
    motos = [],
    existingShifts = []
}) => {
    const [error, setError] = useState<string | null>(null);

    // Calculate default times incorporating fractional hours (0.5 = 30 min)
    const getFormattedTime = (hourVal: number) => {
        const hours = Math.floor(hourVal);
        const minutes = (hourVal % 1) >= 0.5 ? '30' : '00';
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    const defaultStartTime = prefillHour !== undefined && prefillHour !== null
        ? getFormattedTime(prefillHour)
        : '10:00';

    const defaultEndTime = prefillHour !== undefined && prefillHour !== null
        ? getFormattedTime(prefillHour + 4)
        : '14:00';

    const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            riderId: '',
            startDate: selectedDate || toLocalDateString(new Date()),
            startTime: defaultStartTime,
            endDate: selectedDate || toLocalDateString(new Date()),
            endTime: defaultEndTime,
            motoId: ''
        }
    });

    const startDate = watch('startDate');
    const startTimeStr = watch('startTime');
    const endDate = watch('endDate');
    const endTimeStr = watch('endTime');
    const selectedRiderId = watch('riderId');

    // Duration calculation was removed since it's no longer shown in UI

    // Sync EndDate when StartDate changes (User Convenience)
    useEffect(() => {
        if (startDate) {
            setValue('endDate', startDate);
        }
    }, [startDate, setValue]);

    const isRiderBusy = React.useCallback((riderId: string) => {
        if (!existingShifts || !startDate || !startTimeStr || !endDate || !endTimeStr) return false;

        const currentStart = new Date(`${startDate}T${startTimeStr}`).getTime();
        const currentEnd = new Date(`${endDate}T${endTimeStr}`).getTime();

        return existingShifts.some(s => {
            // Ignore the current shift if we are editing
            if (initialData?.shiftId === s.id) return false;
            if (s.riderId !== riderId) return false;

            const sStart = new Date(s.startAt).getTime();
            const sEnd = new Date(s.endAt).getTime();

            // Overlap check: (StartA < EndB) && (EndA > StartB)
            return (currentStart < sEnd) && (currentEnd > sStart);
        });
    }, [existingShifts, startDate, startTimeStr, endDate, endTimeStr, initialData?.shiftId]);

    // [SMART SUGGESTIONS] Calculate rider suggestions based on availability and workload
    const riderSuggestions = React.useMemo(() => {
        if (!startDate || !startTimeStr || !endTimeStr) return [];
        
        // Calculate duration of the shift being created
        let shiftDuration = 0;
        try {
            const start = new Date(`${startDate}T${startTimeStr}`).getTime();
            const end = new Date(`${startDate}T${endTimeStr}`).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
                shiftDuration = (end - start) / (1000 * 60 * 60);
            }
        } catch {
            shiftDuration = 0;
        }
        
        // Get week start (Monday)
        const currentDate = new Date(startDate);
        const dayOfWeek = currentDate.getDay();
        const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(currentDate.setDate(diff));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return riders
            .map(rider => {
                // Calculate total hours for this rider in the current week
                const weeklyHours = existingShifts
                    .filter(s => {
                        if (s.riderId !== rider.id) return false;
                        const shiftDate = new Date(s.startAt);
                        return shiftDate >= weekStart && shiftDate < weekEnd;
                    })
                    .reduce((total, s) => {
                        const start = new Date(s.startAt).getTime();
                        const end = new Date(s.endAt).getTime();
                        return total + (end - start) / (1000 * 60 * 60);
                    }, 0);

                // Check availability (no overlap)
                const isAvailable = !isRiderBusy(rider.id);
                
                // Calculate if rider would exceed 40h limit
                const wouldExceedLimit = (weeklyHours + shiftDuration) > 40;

                return {
                    ...rider,
                    weeklyHours,
                    isAvailable,
                    wouldExceedLimit
                };
            })
            .filter(r => r.isAvailable) // Only show available riders
            .sort((a, b) => {
                // Sort by: available first, then by fewer hours
                if (a.wouldExceedLimit && !b.wouldExceedLimit) return 1;
                if (!a.wouldExceedLimit && b.wouldExceedLimit) return -1;
                return a.weeklyHours - b.weeklyHours;
            });
    }, [riders, existingShifts, startDate, startTimeStr, endTimeStr, isRiderBusy]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (initialData) {
                // EDIT MODE
                const startParts = initialData.startAt.split('T');
                const endParts = initialData.endAt.split('T');
                reset({
                    riderId: initialData.riderId || '',
                    startDate: startParts[0],
                    startTime: startParts[1].substring(0, 5),
                    endDate: endParts[0],
                    endTime: endParts[1].substring(0, 5),
                    motoId: initialData.motoAssignments?.[0]?.motoId || ''
                });
            } else {
                // CREATE MODE
                reset({
                    riderId: '',
                    startDate: selectedDate || toLocalDateString(new Date()),
                    startTime: defaultStartTime,
                    endDate: selectedDate || toLocalDateString(new Date()),
                    endTime: defaultEndTime,
                    motoId: ''
                });
            }
        }
    }, [isOpen, initialData, selectedDate, prefillHour, reset, defaultStartTime, defaultEndTime]);

    const onSubmit = (data: FormValues) => {
        setError(null);
        if (!data.startTime || !data.endTime) {
            setError("Por favor completa los horarios.");
            return;
        }
        if (!data.riderId) {
            setError("Por favor selecciona un Rider.");
            return;
        }

        const startTs = new Date(`${data.startDate}T${data.startTime}`).getTime();
        const endTs = new Date(`${data.endDate}T${data.endTime}`).getTime();

        if (startTs >= endTs) {
            setError("La hora de fin debe ser posterior al inicio.");
            return;
        }

        const [startYear, startMonth, startDay] = data.startDate.split('-').map(Number);
        const [startHour, startMinute] = data.startTime.split(':').map(Number);
        const [endYear, endMonth, endDay] = data.endDate.split('-').map(Number);
        const [endHour, endMinute] = data.endTime.split(':').map(Number);

        const startDateObj = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0);
        const endDateObj = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 0);

        const startAt = toLocalISOStringWithOffset(startDateObj);
        const endAt = toLocalISOStringWithOffset(endDateObj);

        const selectedRider = riders.find(r => r.id === data.riderId);
        const selectedMoto = motos.find(m => m.id === data.motoId);

        const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const dayIndex = new Date(startAt).getDay();
        const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;

        const payload: ShiftData = {
            shiftId: initialData?.shiftId || crypto.randomUUID(),
            riderId: data.riderId,
            riderName: selectedRider ? selectedRider.fullName : 'Unknown',
            startAt,
            endAt,
            date: data.startDate,
            startTime: data.startTime,
            endTime: data.endTime,
            day: DAYS[adjustedDayIndex] || '',
            motoId: selectedMoto ? selectedMoto.id : null,
            motoPlate: selectedMoto ? selectedMoto.licensePlate : null,
            motoAssignments: selectedMoto ? [{
                motoId: selectedMoto.id,
                plate: selectedMoto.licensePlate,
                startAt,
                endAt
            }] : []
        };

        onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[360px] aspect-square rounded-[36px] shadow-2xl flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="relative px-5 pt-5 pb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <h2 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                {initialData ? 'Editar Turno' : 'Nuevo Turno'}
                            </h2>
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {initialData ? 'Modifica los detalles del turno' : 'Planifica la disponibilidad'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="p-1.5 -mr-1 -mt-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            title="Cerrar modal"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* BODY (Scrollable si es necesario, pero intentando ajustar) */}
                <div className="flex-1 overflow-y-auto px-5 py-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">

                    {/* ERROR ALERT */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[12px] font-medium animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* CHANGE REQUEST HIGHLIGHT */}
                    {initialData?.changeRequested && (
                        <div className="flex flex-col gap-1.5 p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-400 rounded-xl text-[12px] font-medium shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" />
                                <span>Solicitud de Cambio Pendiente</span>
                            </div>
                            <p className="text-amber-700/80 dark:text-amber-500/80 italic pl-5 line-clamp-2">
                                &quot;{initialData.changeReason || 'Sin motivo especificado'}&quot;
                            </p>
                        </div>
                    )}

                    {/* SELECTOR DE RIDER */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[12px] font-bold text-slate-900 dark:text-slate-100">
                                Asignar a...
                            </label>
                            {!initialData && riderSuggestions.length > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                    {riderSuggestions.length} disponibles
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none snap-x">
                            {Array.from(new Set([...riderSuggestions.map(r=>r.id), ...riders.map(r=>r.id)])).map(id => {
                                const r = riders.find(rider => rider.id === id);
                                if (!r) return null;
                                const isBusy = isRiderBusy(r.id);
                                const isSelected = selectedRiderId === r.id;
                                const isSuggested = riderSuggestions.some(s => s.id === r.id);
                                
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setValue('riderId', r.id)}
                                        className={cn(
                                            "snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1.5 transition-all p-2 rounded-[20px] w-[64px] relative border border-transparent",
                                            isSelected 
                                                ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900" 
                                                : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700",
                                            isBusy && !isSelected && "opacity-40"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/10",
                                            isSelected 
                                                ? "bg-white/20 dark:bg-black/10 text-white dark:text-slate-900" 
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                                        )}>
                                            {getRiderInitials(r.fullName)}
                                        </div>
                                        <div className="flex flex-col items-center w-full relative">
                                            <span className="text-[10px] font-bold truncate w-full text-center leading-tight">
                                                {r.fullName.split(' ')[0]}
                                            </span>
                                        </div>
                                        {/* Badge Indicador Sutil */}
                                        {isSuggested && !isSelected && !isBusy && (
                                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white bg-emerald-500 dark:border-slate-900" />
                                        )}
                                        {isBusy && !isSelected && (
                                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white bg-rose-400 dark:border-slate-900" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <input type="hidden" {...register('riderId', { required: true })} />
                    </div>

                    {/* SETTINGS GROUP - APPLE STYLE */}
                    <div className="bg-[#FCFCFD] dark:bg-slate-800/40 rounded-[20px] border border-slate-100 dark:border-slate-700/50 flex flex-col">
                        
                        {/* Fecha */}
                        <div className="flex justify-between items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/50">
                            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
                                <div className="p-1.5 bg-rose-100/80 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-[8px]">
                                    <Calendar size={15} strokeWidth={2.5} />
                                </div>
                                Fecha
                            </label>
                            <input
                                {...register('startDate')}
                                type="date"
                                className="bg-transparent border-none text-[13px] font-bold text-right outline-none text-slate-900 dark:text-white focus:ring-0 p-0"
                            />
                        </div>

                        {/* Hora */}
                        <div className="flex flex-col px-4 py-3.5 gap-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
                                    <div className="p-1.5 bg-amber-100/80 dark:bg-orange-500/20 text-amber-500 dark:text-orange-400 rounded-[8px]">
                                        <Clock size={15} strokeWidth={2.5} />
                                    </div>
                                    Horario
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    {...register('startTime')}
                                    type="time"
                                    className="flex-1 bg-slate-100/60 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-center outline-none focus:ring-1 focus:ring-slate-300 transition-all text-slate-900 dark:text-white"
                                />
                                <span className="text-slate-300 dark:text-slate-600 shrink-0"><ArrowRight size={14} strokeWidth={2.5} /></span>
                                <input
                                    {...register('endTime')}
                                    type="time"
                                    className="flex-1 bg-slate-100/60 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-center outline-none focus:ring-1 focus:ring-slate-300 transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Vehículo */}
                        <div className="flex justify-between items-center px-4 py-3.5">
                            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
                                <div className="p-1.5 bg-indigo-100/80 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-[8px]">
                                    <Truck size={15} strokeWidth={2.5} />
                                </div>
                                Moto
                            </label>
                            <div className="relative flex items-center">
                                <select
                                    {...register('motoId')}
                                    className="bg-transparent border-none text-[13px] font-bold text-right outline-none text-slate-500 hover:text-slate-700 dark:text-slate-400 focus:ring-0 p-0 pr-4 appearance-none cursor-pointer"
                                    dir="rtl"
                                >
                                    <option value="">A pie / Propio</option>
                                    {motos.map(m => (
                                        <option key={m.id} value={m.id}>{m.licensePlate}</option>
                                    ))}
                                </select>
                                <ChevronRight size={14} className="absolute right-0 text-slate-300 dark:text-slate-600 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="px-5 py-4 mt-auto flex items-center justify-between">
                    {initialData && onDelete ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('¿Eliminar este turno permanentemente?')) {
                                    const deleteId = initialData.shiftId || initialData.id;
                                    if (deleteId) {
                                        onDelete(deleteId);
                                        onClose();
                                    }
                                }
                            }}
                            disabled={isSaving}
                            className="text-[13px] text-rose-500 font-semibold hover:text-rose-600 dark:hover:text-rose-400 transition-colors bg-transparent border-none p-0 mx-2"
                        >
                            Eliminar
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-700 transition-colors bg-transparent border-none p-0 mx-2"
                        >
                            Cancelar
                        </button>
                    )}
                    
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSaving}
                        className={cn(
                            "flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all transform active:scale-95 shadow-sm flex-1 ml-2",
                            isSaving ? "opacity-70 bg-[#0F172A] dark:bg-white dark:text-[#0F172A]" : "bg-[#0F172A] hover:bg-slate-800 dark:bg-white dark:text-[#0F172A] dark:hover:bg-slate-100"
                        )}
                    >
                        {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                        {isSaving ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Turno'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftModal;
