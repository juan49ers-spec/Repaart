import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Truck, Clock, Plus, Trash2, Calendar, AlertCircle, Save, ArrowRight } from 'lucide-react';
import { toLocalDateString, toLocalISOStringWithOffset } from '../../utils/dateUtils';

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
    motos = []
}) => {
    const [error, setError] = useState<string | null>(null);

    // Calculate default times
    const defaultStartTime = prefillHour !== undefined && prefillHour !== null
        ? `${String(prefillHour).padStart(2, '0')}:00`
        : '10:00';

    const defaultEndTime = prefillHour !== undefined && prefillHour !== null
        ? `${String(prefillHour + 4).padStart(2, '0')}:00`
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

    // Sync EndDate when StartDate changes (User Convenience)
    useEffect(() => {
        if (startDate) {
            setValue('endDate', startDate);
        }
    }, [startDate, setValue]);

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh]">

                {/* HEADER */}
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${initialData ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                            {initialData ? <Clock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                {initialData ? 'Editar Turno' : 'Nuevo Turno'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {initialData ? 'Modifica los detalles del turno existente' : 'Agenda un nuevo turno para la flota'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSaving} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Cerrar modal" aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* ERROR ALERT */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* CHANGE REQUEST HIGHLIGHT */}
                    {initialData?.changeRequested && (
                        <div className="flex flex-col gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-xl text-sm border-2 border-amber-200 dark:border-amber-900/50 shadow-sm animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                                <AlertCircle className="w-4 h-4" />
                                Solicitud de Cambio del Rider
                            </div>
                            <p className="font-medium italic bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                &quot;{initialData.changeReason || 'Sin motivo especificado'}&quot;
                            </p>
                            <p className="text-[9px] opacity-70">
                                * Guardar cambios en este turno marcará el conflicto como resuelto.
                            </p>
                        </div>
                    )}

                    {/* DATES GRID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Inicio
                            </label>
                            <div className="space-y-2">
                                <input
                                    {...register('startDate')}
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <input
                                    {...register('startTime')}
                                    type="time"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" /> Fin
                            </label>
                            <div className="space-y-2">
                                <input
                                    {...register('endDate')}
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <input
                                    {...register('endTime')}
                                    type="time"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* RIDER SELECT */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <User size={16} className="text-blue-500" /> Rider Asignado
                        </label>
                        <select
                            {...register('riderId', { required: true })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                            <option value="">Seleccionar Rider...</option>
                            {riders.map(r => (
                                <option key={r.id} value={r.id}>{r.fullName}</option>
                            ))}
                        </select>
                    </div>

                    {/* MOTO SELECT */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Truck size={16} className="text-orange-500" /> Vehículo (Opcional)
                        </label>
                        <div className="relative">
                            <select
                                {...register('motoId')}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
                            >
                                <option value="">Sin vehículo asignado</option>
                                {motos.map(m => (
                                    <option key={m.id} value={m.id}>{m.licensePlate} - {m.model}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Truck size={14} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
                            El vehículo quedará bloqueado para otros turnos durante este horario.
                        </p>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
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
                                className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Eliminar</span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {isSaving ? <Clock className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Guardando...' : 'Guardar Turno'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftModal;
