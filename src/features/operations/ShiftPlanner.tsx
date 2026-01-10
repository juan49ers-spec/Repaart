import { useState, useEffect, useMemo, memo, Fragment, type FC } from 'react';
import {
    Calendar, Clock, Filter, Sun, Moon,
    MoreHorizontal, Plus, RefreshCw, Zap, Loader2,
    CheckCircle2, AlertCircle, LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import { useShiftOperations } from '../../hooks/useShiftOperations';
import { toLocalDateString } from '../../utils/dateUtils';
import QuickFillModal from './QuickFillModal';
import ShiftModal from './ShiftModal';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface ToastProps {
    message: string | null;
    type: 'success' | 'error';
    onClose: () => void;
}

interface Shift {
    shiftId: string;
    startAt: string;
    endAt: string;
    riderName?: string;
    riderId: string;
    motoPlate?: string;
    motoId?: string | null;
    [key: string]: any;
}

interface ShiftCardProps {
    shift: Shift;
    onClick: (shift: Shift) => void;
}

interface ShiftConfig {
    start: number;
    end: number;
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}

interface TimeSlotProps {
    hour: number;
    isCurrentHour: boolean;
    assignments: Shift[];
    canEdit: boolean;
    onAssign: (hour: number) => void;
    onEdit: (shift: Shift) => void;
}

interface WeekDay {
    dateObj: Date;
    label: string;
    shortLabel: string;
    isoDate: string;
}

interface ShiftPlannerProps {
    franchiseId?: string;
    readOnly?: boolean;
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    overrideScheduleState?: any; // Type from useWeeklySchedule if needed
}

interface NotificationState {
    message: string;
    type: 'success' | 'error';
}

interface ModalsState {
    shift: boolean;
    quick: boolean;
}

// =====================================================
// UI COMPONENTS
// =====================================================

const Toast: FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    const styles = type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-red-50 border-red-200 text-red-700';
    const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

    return (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-5 z-[200] ${styles}`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

const SHIFT_CONFIG: Record<'LUNCH' | 'DINNER', ShiftConfig> = {
    LUNCH: { start: 12, end: 16, label: 'COMIDA', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    DINNER: { start: 20, end: 23, label: 'CENA', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' }
};

const ShiftCard = memo<ShiftCardProps>(({ shift, onClick }) => (
    <div
        onClick={(e) => { e.stopPropagation(); onClick(shift); }}
        className="group/card relative shrink-0 flex items-center gap-3 bg-white border border-slate-200 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 min-w-[170px]"
    >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {shift.riderName ? shift.riderName.substring(0, 2).toUpperCase() : 'ST'}
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 group-hover/card:text-indigo-700 truncate max-w-[110px]">
                {shift.riderName || 'Sin asignar'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${shift.motoPlate ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-mono text-slate-500 group-hover/card:text-indigo-500">
                    {shift.motoPlate || 'Sin vehículo'}
                </span>
            </div>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity transform translate-x-2 group-hover/card:translate-x-0">
            <MoreHorizontal size={14} className="text-slate-400" />
        </div>
    </div>
));

const TimeSlot = memo<TimeSlotProps>(({ hour, isCurrentHour, assignments, canEdit, onAssign, onEdit }) => {
    const isNight = hour >= 20 || hour <= 5;
    const config = hour >= 20 ? SHIFT_CONFIG.DINNER : (hour >= 12 && hour <= 16 ? SHIFT_CONFIG.LUNCH : null);
    const Icon = config?.icon || Clock;

    return (
        <div className={`group flex relative min-h-[100px] border-b border-slate-100 transition-colors duration-300 ${isNight ? 'bg-slate-50/80' : 'bg-white'} ${isCurrentHour ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
            {isCurrentHour && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-rose-500 z-10 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />}
            <div className="w-24 border-r border-slate-100 flex flex-col items-center justify-center p-2 relative shrink-0">
                <span className={`text-lg font-mono font-bold ${isCurrentHour ? 'text-rose-500' : 'text-slate-400'}`}>
                    {String(hour).padStart(2, '0')}:00
                </span>
                {config && (
                    <div className={`mt-1 flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${config.color} ${config.bg}`}>
                        <Icon size={10} />
                        {config.label}
                    </div>
                )}
            </div>
            <div className="flex-1 p-3 flex items-center overflow-hidden">
                <div className="flex gap-3 overflow-x-auto custom-scrollbar w-full py-1 px-1 items-center">
                    {assignments?.length > 0 ? (
                        assignments.map((shift) => <ShiftCard key={shift.shiftId} shift={shift} onClick={onEdit} />)
                    ) : (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-40 transition-opacity select-none">
                            <div className="w-12 h-[2px] bg-slate-200 rounded-full" />
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Disponible</span>
                        </div>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => onAssign(hour)}
                            className="shrink-0 w-9 h-9 ml-2 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                            title="Añadir turno aquí"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

// =====================================================
// MAIN COMPONENT
// =====================================================

const ShiftPlanner: FC<ShiftPlannerProps> = ({
    franchiseId: propFranchiseId,
    readOnly = false,
    selectedDate,
    onDateChange,
    overrideScheduleState
}) => {
    const { user } = useAuth();

    const activeFranchiseId = propFranchiseId || user?.uid;
    const canEdit = !readOnly && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'franchise');

    const internalHook = useWeeklySchedule(activeFranchiseId ?? null, !activeFranchiseId, selectedDate);
    const { weekData, loading, riders, motos, updateWeekData, refresh } = overrideScheduleState || internalHook;

    const { isSaving, addOrUpdateShift, removeShift, quickFillShifts } = useShiftOperations(activeFranchiseId || null, weekData, updateWeekData, motos);

    if (!activeFranchiseId) {
        return <div className="p-8 text-center text-red-500">Error: No se ha identificado la franquicia operativa.</div>;
    }

    const [viewMode, setViewMode] = useState<'focus' | 'full'>('focus');
    const [searchTerm] = useState('');
    const [selectedDateObj, setSelectedDateObj] = useState(selectedDate || new Date());
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [modals, setModals] = useState<ModalsState>({ shift: false, quick: false });
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [newShiftHour, setNewShiftHour] = useState<number | null>(null);

    useEffect(() => { if (selectedDate) setSelectedDateObj(selectedDate); }, [selectedDate]);

    const notify = (msg: string, type: 'success' | 'error' = 'success') => setNotification({ message: msg, type });

    const selectedIsoDate = toLocalDateString(selectedDateObj);

    const assignmentsByHour = useMemo(() => {
        const map: Record<number, Shift[]> = {};
        if (!weekData?.shifts) return map;

        weekData.shifts.forEach((shift: Shift) => {
            if (!shift.startAt || !shift.startAt.startsWith(selectedIsoDate)) return;
            if (searchTerm && !shift.riderName?.toLowerCase().includes(searchTerm.toLowerCase())) return;

            const d = new Date(shift.startAt);
            if (isNaN(d.getTime())) return;

            const startH = d.getHours();
            const endH = new Date(shift.endAt || shift.startAt).getHours();

            for (let h = startH; h < endH; h++) {
                if (!map[h]) map[h] = [];
                map[h].push(shift);
            }
        });
        return map;
    }, [weekData, selectedIsoDate, searchTerm]);

    const onSaveWrapper = async (data: any) => {
        const res = await addOrUpdateShift(data, !!editingShift);
        if (res.success) {
            notify(editingShift ? 'Turno actualizado' : 'Turno creado');
            setModals(prev => ({ ...prev, shift: false }));
        } else {
            notify(res.error || 'Error al guardar', 'error');
        }
    };

    const onDeleteWrapper = async (id: string) => {
        if (!confirm('¿Eliminar turno?')) return;
        const res = await removeShift(id);
        if (res.success) {
            notify('Turno eliminado');
            setModals(prev => ({ ...prev, shift: false }));
        } else {
            notify('Error al eliminar', 'error');
        }
    };

    const onQuickFillWrapper = async (data: any) => {
        const res = await quickFillShifts(data);
        if (res.success) notify(`${res.count || 0} turnos generados`);
        else notify(res.error || 'Error en Auto-Fill', 'error');
    };

    const weekDays = useMemo<WeekDay[]>(() => {
        const start = weekData ? new Date(weekData.startDate) : new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return {
                dateObj: d,
                label: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
                shortLabel: d.toLocaleDateString('es-ES', { weekday: 'short' }),
                isoDate: toLocalDateString(d)
            };
        });
    }, [weekData]);

    const timeSlots = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        return viewMode === 'focus'
            ? hours.filter(h => (h >= 12 && h <= 16) || (h >= 20 && h <= 23))
            : hours;
    }, [viewMode]);

    const currentHour = new Date().getHours();
    const isToday = selectedIsoDate === toLocalDateString(new Date());

    return (
        <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col shadow-sm overflow-hidden relative">
            {isSaving && <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 z-50"><div className="h-full bg-indigo-500 animate-progress-indeterminate" /></div>}

            {/* Header */}
            <div className="bg-white p-5 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100"><Calendar className="w-5 h-5 text-indigo-600" /></div>
                        Planificador Operativo
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 ml-1">Gestión inteligente de recursos y turnos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                        {weekDays.map((day) => {
                            const isSelected = day.isoDate === selectedIsoDate;
                            return (
                                <button
                                    key={day.isoDate}
                                    onClick={() => { setSelectedDateObj(day.dateObj); onDateChange?.(day.dateObj); }}
                                    className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center min-w-[64px] ${isSelected ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200'}`}
                                >
                                    <span className="uppercase text-[9px] opacity-70 mb-0.5">{day.shortLabel}</span>
                                    <span className="text-sm">{day.dateObj.getDate()}</span>
                                    {day.isoDate === toLocalDateString(new Date()) && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-2 ml-auto pl-2 border-l border-slate-200">
                        <button onClick={() => refresh()} disabled={loading} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => setModals(m => ({ ...m, quick: true }))}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                            >
                                <Zap className="w-4 h-4 text-amber-300" />
                                Auto-Fill
                            </button>
                        )}
                        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex">
                            <button onClick={() => setViewMode('focus')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'focus' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Filter className="w-3 h-3" />Prime
                            </button>
                            <button onClick={() => setViewMode('full')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'full' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Clock className="w-3 h-3" />24h
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                {loading && !weekData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                        <p className="text-slate-500 text-sm animate-pulse">Sincronizando operaciones...</p>
                    </div>
                ) : (
                    <div className="pb-20">
                        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2 flex justify-between items-center shadow-sm">
                            <span className="text-sm font-bold text-slate-700 capitalize flex items-center gap-2">
                                {selectedDateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                {isToday && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] rounded border border-rose-200 uppercase">Hoy</span>}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                {(assignmentsByHour[14]?.length || 0) + (assignmentsByHour[21]?.length || 0)} activos est.
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {timeSlots.map((hour, index) => {
                                const prevHour = index > 0 ? timeSlots[index - 1] : -1;
                                const showGap = viewMode === 'focus' && prevHour !== -1 && (hour - prevHour > 1);
                                return (
                                    <Fragment key={hour}>
                                        {showGap && <div className="h-6 bg-slate-50 flex items-center justify-center border-y border-slate-100"><MoreHorizontal className="w-4 h-4 text-slate-300" /></div>}
                                        <TimeSlot
                                            hour={hour}
                                            isCurrentHour={isToday && hour === currentHour}
                                            assignments={assignmentsByHour[hour] || []}
                                            canEdit={canEdit}
                                            onAssign={() => { setNewShiftHour(hour); setEditingShift(null); setModals(m => ({ ...m, shift: true })); }}
                                            onEdit={(shift) => { setEditingShift(shift); setNewShiftHour(null); setModals(m => ({ ...m, shift: true })); }}
                                        />
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {canEdit && (
                <>
                    <QuickFillModal
                        isOpen={modals.quick}
                        onClose={() => setModals(m => ({ ...m, quick: false }))}
                        onCreateShifts={onQuickFillWrapper}
                        riders={riders}
                        motos={motos}
                        weekDays={weekDays}
                    />
                    <ShiftModal
                        isOpen={modals.shift}
                        onClose={() => !isSaving && setModals(m => ({ ...m, shift: false }))}
                        onSave={onSaveWrapper}
                        onDelete={onDeleteWrapper}
                        initialData={editingShift}
                        riders={riders}
                        motos={motos}
                        selectedDate={selectedIsoDate}
                        prefillHour={newShiftHour ?? undefined}
                        isSaving={isSaving}
                    />
                </>
            )}
            <Toast message={notification?.message || null} type={notification?.type || 'success'} onClose={() => setNotification(null)} />
        </div>
    );
};

export default ShiftPlanner;
