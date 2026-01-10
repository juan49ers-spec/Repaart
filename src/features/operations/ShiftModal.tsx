import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Truck, Clock, Plus, Trash2 } from 'lucide-react';
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

    // Calculate default times based on prefillHour
    const defaultStartTime = prefillHour !== undefined && prefillHour !== null
        ? `${String(prefillHour).padStart(2, '0')}:00`
        : '10:00';

    const defaultEndTime = prefillHour !== undefined && prefillHour !== null
        ? `${String(prefillHour + 4).padStart(2, '0')}:00`
        : '14:00';

    const { register, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            riderId: '',
            startDate: selectedDate || toLocalDateString(new Date()),
            startTime: defaultStartTime,
            endDate: selectedDate || toLocalDateString(new Date()),
            endTime: defaultEndTime,
            motoId: ''
        }
    });

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // EDIT MODE
                const startParts = initialData.startAt.split('T');
                const endParts = initialData.endAt.split('T');

                reset({
                    riderId: initialData.riderId || '',
                    startDate: startParts[0],
                    startTime: startParts[1].substring(0, 5), // HH:mm
                    endDate: endParts[0],
                    endTime: endParts[1].substring(0, 5), // HH:mm
                    motoId: initialData.motoAssignments?.[0]?.motoId || ''
                });
            } else {
                // CREATE MODE with explicit prefill
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
        if (!data.startTime || !data.endTime) {
            alert("Por favor selecciona hora de inicio y fin.");
            return;
        }

        // VALIDACIÓN DE TIEMPO SIMPLE (Hallazgo de Auditoría)
        const startTs = new Date(`${data.startDate}T${data.startTime}`).getTime();
        const endTs = new Date(`${data.endDate}T${data.endTime}`).getTime();

        if (startTs >= endTs) {
            alert("La hora de fin debe ser posterior a la de inicio.");
            return;
        }

        const [startYear, startMonth, startDay] = data.startDate.split('-').map(Number);
        const [startHour, startMinute] = data.startTime.split(':').map(Number);
        const [endYear, endMonth, endDay] = data.endDate.split('-').map(Number);
        const [endHour, endMinute] = data.endTime.split(':').map(Number);

        // Construct Date objects to calculate the correct offset
        const startDateObj = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0);
        const endDateObj = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 0);

        // Use the new utility to get string with offset: "YYYY-MM-DDTHH:mm:ss+HH:mm"
        const startAt = toLocalISOStringWithOffset(startDateObj);
        const endAt = toLocalISOStringWithOffset(endDateObj);

        // Resolve Names
        const selectedRider = riders.find(r => r.id === data.riderId);
        const selectedMoto = motos.find(m => m.id === data.motoId);

        // Legacy mapping for compatibility
        const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const dayIndex = new Date(startAt).getDay(); // 0 is Sunday
        const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // 0 is Monday now

        // Construct Payload conforming to Schema
        const payload: ShiftData = {
            shiftId: initialData?.shiftId || crypto.randomUUID(), // New UUID if create
            riderId: data.riderId,
            riderName: selectedRider ? selectedRider.fullName : 'Unknown',
            startAt,
            endAt,

            // Legacy Fields for WeeklyCalendarGrid & Filtering
            date: data.startDate, // YYYY-MM-DD
            startTime: data.startTime, // HH:mm
            endTime: data.endTime, // HH:mm
            day: DAYS[adjustedDayIndex] || '',

            // Denormalized fields for UI compatibility
            motoId: selectedMoto ? selectedMoto.id : null,
            motoPlate: selectedMoto ? selectedMoto.licensePlate : null,

            motoAssignments: selectedMoto ? [{
                motoId: selectedMoto.id,
                plate: selectedMoto.licensePlate,
                startAt, // Full shift duration for this MVP msg assignment
                endAt
            }] : []
        };

        onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] ring-1 ring-black/5">

                {/* HEAD */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-indigo-50/50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5 tracking-tight">
                        {initialData ? (
                            <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30">
                                <Clock className="w-5 h-5" />
                            </div>
                        ) : (
                            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30">
                                <Plus className="w-5 h-5" />
                            </div>
                        )}
                        {initialData ? 'Editar Turno' : 'Nuevo Turno'}
                    </h2>
                    <button onClick={onClose} disabled={isSaving} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/50 transition-all disabled:opacity-50">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Inicio</label>
                            <input {...register('startDate')} disabled={isSaving} type="date" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50 shadow-sm" />
                            <input {...register('startTime')} disabled={isSaving} type="time" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50 shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Fin</label>
                            <input {...register('endDate')} disabled={isSaving} type="date" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50 shadow-sm" />
                            <input {...register('endTime')} disabled={isSaving} type="time" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50 shadow-sm" />
                        </div>
                    </div>

                    {/* Rider Selection */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <User size={16} className="text-blue-600" /> Rider
                        </label>
                        <select
                            {...register('riderId', { required: true })}
                            disabled={isSaving}
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 shadow-sm transition-all"
                        >
                            <option value="">Seleccionar Rider...</option>
                            {riders.map(r => (
                                <option key={r.id} value={r.id}>{r.fullName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Moto Selection */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Truck size={16} className="text-orange-600" /> Asignar Moto (Vincular)
                        </label>
                        <select
                            {...register('motoId')}
                            disabled={isSaving}
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none disabled:opacity-50 shadow-sm transition-all"
                        >
                            <option value="">Sin Moto (Solo Rider)</option>
                            {motos.map(m => (
                                <option key={m.id} value={m.id}>{m.licensePlate} - {m.model}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2 ml-1">
                            * Se asignará la moto por la duración completa del turno en esta versión.
                        </p>
                    </div>
                </form>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-100 flex justify-between gap-3 bg-slate-50 rounded-b-2xl">
                    <div>
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('¿Seguro que quieres eliminar este turno?')) onDelete(initialData.shiftId);
                                }}
                                disabled={isSaving}
                                className="px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                            >
                                <Trash2 size={16} /> Eliminar
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSaving}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 text-sm"
                        >
                            {isSaving && <Clock className="animate-spin w-4 h-4" />}
                            {isSaving ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Turno')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftModal;
