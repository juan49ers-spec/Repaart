import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Truck, Clock, Plus, Trash2, Calendar, AlertCircle, Save, ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import { toLocalDateString, toLocalISOStringWithOffset } from '../../utils/dateUtils';
import { getRiderColor } from '../../utils/riderColors';
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
        shiftId: string;
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
    existingShifts?: any[]; // Using any to avoid complex imports for now, or use Shift if available
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

    // Sync EndDate when StartDate changes (User Convenience)
    useEffect(() => {
        if (startDate) {
            setValue('endDate', startDate);
        }
    }, [startDate, setValue]);

    const isRiderBusy = (riderId: string) => {
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
    };

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col overflow-hidden max-h-[85vh] ring-1 ring-black/5">

                {/* HEADER (Premium Ribbon Look) */}
                <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-2xl shadow-inner-sm transition-all duration-300",
                                initialData
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-800/50"
                                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-800/50"
                            )}>
                                {initialData ? <Clock className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">
                                    {initialData ? 'Editar Turno' : 'Nuevo Turno'}
                                </h2>
                                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mt-1">
                                    Despacho de Flota • Repaart
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-90"
                            title="Cerrar modal"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* ERROR ALERT */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm border border-rose-100 dark:border-rose-900/30 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {/* CHANGE REQUEST HIGHLIGHT */}
                    {initialData?.changeRequested && (
                        <div className="flex flex-col gap-2 p-5 bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-400 rounded-2xl text-sm border border-amber-200/50 dark:border-amber-900/30 shadow-sm">
                            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                                <AlertCircle className="w-4 h-4" />
                                Solicitud de Cambio
                            </div>
                            <p className="font-medium italic text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-black/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                &quot;{initialData.changeReason || 'Sin motivo especificado'}&quot;
                            </p>
                        </div>
                    )}

                    {/* SELECTOR DE RIDER (Visual Grid) */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                            Asignar Rider
                        </label>
                        <div className="flex flex-wrap gap-4">
                            {riders.map(r => {
                                const color = getRiderColor(r.id);
                                const isSelected = selectedRiderId === r.id;
                                const isBusy = isRiderBusy(r.id);
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setValue('riderId', r.id)}
                                        className={cn(
                                            "group relative flex flex-col items-center gap-2 transition-all p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                            isSelected ? "scale-105 bg-indigo-50/50 dark:bg-indigo-900/20" : "hover:scale-105"
                                        )}
                                        title={r.fullName + (isBusy ? ' (Ocupado)' : '')}
                                    >
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold transition-all relative overflow-hidden shadow-sm",
                                            color.bg, color.text,
                                            isSelected
                                                ? "shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] ring-2 ring-indigo-500 dark:ring-indigo-400 scale-110"
                                                : "opacity-60 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 ring-1 ring-slate-100 dark:ring-slate-800",
                                            isBusy && !isSelected && "opacity-30 grayscale contrast-75"
                                        )}>
                                            {getRiderInitials(r.fullName)}
                                            {isSelected && (
                                                <div className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-white shadow-sm ring-1 ring-indigo-100" />
                                            )}
                                            {isBusy && (
                                                <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                                    <div className="w-full h-px bg-rose-500/50 rotate-45" />
                                                    <div className="absolute w-full h-px bg-rose-500/50 -rotate-45" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider text-center break-words max-w-[72px] leading-tight",
                                                isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300",
                                                isBusy && "text-rose-400"
                                            )}>
                                                {r.fullName.split(' ')[0]}
                                            </span>
                                            {isBusy && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-[7px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider border border-rose-200 dark:border-rose-800">
                                                    Ocupado
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <input type="hidden" {...register('riderId', { required: true })} />
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800/50" />

                    {/* DATES & TIME RANGE (Unified) */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                            Horario y Fecha
                        </label>
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-inner-sm">
                            <div className="flex flex-col gap-6">
                                {/* Date Input */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        {...register('startDate')}
                                        type="date"
                                        className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                                    />
                                </div>

                                {/* Start - End Time Range */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <input
                                            {...register('startTime')}
                                            type="time"
                                            className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
                                        />
                                    </div>
                                    <div className="text-slate-300 dark:text-slate-700 flex flex-col items-center">
                                        <ArrowRight size={16} strokeWidth={2.5} />
                                        <div className="h-4 w-px bg-current mt-1" />
                                    </div>
                                    <div className="flex-1 relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <input
                                            {...register('endTime')}
                                            type="time"
                                            className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-rose-500 shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOTO SELECT (Elegante) */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                            Vehículo Asignado
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                <Truck size={18} />
                            </div>
                            <select
                                {...register('motoId')}
                                className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl pl-12 pr-10 py-4 text-sm font-semibold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 appearance-none shadow-sm transition-all"
                            >
                                <option value="">Sin vehículo (Reparto a pie / Propio)</option>
                                {motos.map(m => (
                                    <option key={m.id} value={m.id}>{m.licensePlate} • {m.model}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                <ChevronRight size={16} className="rotate-90" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
                    <div>
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('¿Eliminar este turno permanentemente?')) {
                                        onDelete(initialData.shiftId);
                                        onClose();
                                    }
                                }}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-90"
                            >
                                <Trash2 size={16} strokeWidth={2.5} />
                                <span className="hidden sm:inline">Eliminar</span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-6 py-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold text-sm transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSaving}
                            className={cn(
                                "flex items-center gap-2 px-10 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all transform active:scale-95 shadow-xl disabled:opacity-50",
                                initialData
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                            )}
                        >
                            {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" strokeWidth={2.5} />}
                            {isSaving ? 'Enviando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftModal;
