import React, { useState } from 'react';
import { X, Zap, User, Truck, Sun, Moon, Split, Copy, Loader2, ArrowRight, Trash2, Users, CheckSquare, Square, Euro, AlertTriangle, Bookmark, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toLocalISOString } from '../../utils/dateUtils';
import { shiftService } from '../../services/shiftService';
import { Shift } from '../../schemas/scheduler';

import { CostService } from '../../services/scheduler/costService';
import { ComplianceService, ComplianceIssue } from '../../services/scheduler/complianceService';
import { subDays, addDays, parseISO, setHours, setMinutes, setSeconds, areIntervalsOverlapping, differenceInMinutes } from 'date-fns';

interface Rider {
    id: string;
    name?: string;
    email?: string;
}

interface Moto {
    id: string;
    licensePlate: string;
    model: string;
}

interface WeekDay {
    isoDate: string;
    shortLabel: string;
}

interface QuickFillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    franchiseId: string;
    riders: Rider[];
    motos: Moto[];
    weekDays: WeekDay[];
    existingShifts?: Shift[];
    onCreateShifts?: (shifts: Partial<Shift>[]) => Promise<void>;
}

type PresetType = 'custom' | 'comida' | 'cena' | 'partido' | 'clone_rider';

const QuickFillModal: React.FC<QuickFillModalProps> = ({
    isOpen, onClose, onRefresh, franchiseId, riders, motos, weekDays, existingShifts = [], onCreateShifts: _onCreateShifts
}) => {
    // Estado local del formulario
    const [selectedRiderId, setSelectedRiderId] = useState('');
    const [sourceRiderId, setSourceRiderId] = useState(''); // For cloning
    const [selectedMotoId, setSelectedMotoId] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [overwrite, setOverwrite] = useState(false);

    // Preset State
    const [activePreset, setActivePreset] = useState<PresetType>('custom');

    // Horas (Editable if custom) - Support HH:mm
    const [startHour, setStartHour] = useState('13:30');
    const [endHour, setEndHour] = useState('16:00');

    const [estimatedCost, setEstimatedCost] = useState<{ total: number; hours: number } | null>(null);
    // Compliance State
    const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);

    // Templates State
    const [savedTemplates, setSavedTemplates] = useState<{ name: string, preset: any, start: string, end: string }[]>([]);

    // Load templates on mount
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem('repaart_schedule_templates');
            if (saved) setSavedTemplates(JSON.parse(saved));
        } catch (e) { console.error('Error loading templates', e); }
    }, []);

    const saveTemplate = () => {
        const name = prompt('Nombre de la plantilla (ej: "Lluvia", "Invierno"):');
        if (!name) return;
        const newTemplate = { name, preset: activePreset, start: startHour, end: endHour };
        const updated = [...savedTemplates, newTemplate];
        setSavedTemplates(updated);
        localStorage.setItem('repaart_schedule_templates', JSON.stringify(updated));
    };

    const loadTemplate = (t: typeof savedTemplates[0]) => {
        setActivePreset(t.preset);
        setStartHour(t.start);
        setEndHour(t.end);
    };

    const deleteTemplate = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Borrar plantilla?')) return;
        const updated = savedTemplates.filter((_, i) => i !== index);
        setSavedTemplates(updated);
        localStorage.setItem('repaart_schedule_templates', JSON.stringify(updated));
    };

    // Effect to calculate live cost AND check compliance
    React.useEffect(() => {
        if (!selectedRiderId || selectedDays.length === 0) {
            setEstimatedCost(null);
            setComplianceIssues([]);
            return;
        }

        // 1. Calculate Shift Params
        let minutesPerShift = 0;

        // Helper to get time for a specific day
        const getShiftTimesForDay = (dayIso: string) => {
            const times = [];
            if (activePreset === 'partido') {
                times.push(createSafeShift(dayIso, '13:30', '16:00'));
                times.push(createSafeShift(dayIso, '20:30', '23:00'));
            } else if (activePreset === 'comida') {
                times.push(createSafeShift(dayIso, '13:30', '16:00'));
            } else if (activePreset === 'cena') {
                times.push(createSafeShift(dayIso, '20:30', '23:00'));
            } else if (activePreset === 'custom') {
                times.push(createSafeShift(dayIso, startHour, endHour));
            }
            return times; // array of {start, end, startAt, endAt}
        };

        if (activePreset === 'partido') minutesPerShift = 300;
        else if (activePreset === 'comida' || activePreset === 'cena') minutesPerShift = 150;
        else if (activePreset === 'custom') {
            const s = parseISO(`2024-01-01T${startHour}:00`);
            let e = parseISO(`2024-01-01T${endHour}:00`);
            if (e < s) e = addDays(e, 1);
            minutesPerShift = differenceInMinutes(e, s);
        }

        if (activePreset !== 'clone_rider') {
            const minutesPerShiftCalc = minutesPerShift;

            const niceCost = CostService.calculateEstimatedCost(
                Array(selectedDays.length).fill(null).map(() => ({
                    startAt: '2024-01-01T00:00:00',
                    endAt: new Date(new Date('2024-01-01T00:00:00').getTime() + minutesPerShiftCalc * 60000).toISOString()
                }))
            );
            setEstimatedCost({ total: niceCost.totalCost, hours: niceCost.totalHours });

            const issuesFound: ComplianceIssue[] = [];
            const riderShifts = existingShifts.filter(s => s.riderId === selectedRiderId);

            selectedDays.forEach(dayIso => {
                const proposedForDay = getShiftTimesForDay(dayIso);
                proposedForDay.forEach(p => {
                    const issues = ComplianceService.validateShiftRules(
                        { startAt: p.startAt, endAt: p.endAt, riderId: selectedRiderId },
                        riderShifts as { startAt: string, endAt: string, riderId: string }[]
                    );
                    issuesFound.push(...issues);
                });
            });

            const uniqueIssues = Array.from(new Set(issuesFound.map(i => i.message)))
                .map(msg => issuesFound.find(i => i.message === msg)!);

            setComplianceIssues(uniqueIssues);
        } else {
            setEstimatedCost(null);
            setComplianceIssues([]);
        }

    }, [selectedRiderId, selectedDays, activePreset, startHour, endHour, sourceRiderId, existingShifts]);


    if (!isOpen) return null;

    const toggleDay = (isoDate: string) => {
        setSelectedDays((prev: string[]) =>
            prev.includes(isoDate) ? prev.filter((d: string) => d !== isoDate) : [...prev, isoDate]
        );
    };

    const selectWeekends = () => {
        const weekends = weekDays.filter(d => {
            const date = parseISO(d.isoDate);
            const day = date.getDay();
            return day === 0 || day === 6 || day === 5;
        }).map(d => d.isoDate);
        setSelectedDays(weekends);
    };

    const selectWeekdays = () => {
        const weekdays = weekDays.filter(d => {
            const date = parseISO(d.isoDate);
            const day = date.getDay();
            return day >= 1 && day <= 4;
        }).map(d => d.isoDate);
        setSelectedDays(weekdays);
    };

    const applyPreset = (preset: PresetType) => {
        setActivePreset(preset);
        if (preset === 'comida') {
            setStartHour('13:30');
            setEndHour('16:00');
        } else if (preset === 'cena') {
            setStartHour('20:30');
            setEndHour('23:00');
        } else if (preset === 'partido') {
            setStartHour('13:30');
            setEndHour('23:00');
        }
    };

    const handleGenerate = async () => {
        if (!selectedRiderId || selectedDays.length === 0) {
            alert("Selecciona al menos un rider y un día.");
            return;
        }

        if (complianceIssues.length > 0 && !window.confirm(`¡Advertencia de cumplimiento! Se han detectado ${complianceIssues.length} problemas: \n\n${complianceIssues.map(i => i.message).join('\n')} \n\n¿Deseas continuar de todos modos ? `)) {
            return;
        }

        if (activePreset === 'clone_rider') {
            await handleCloneRiderAction();
            return;
        }

        setIsProcessing(true);
        try {
            const rider = riders.find(r => r.id === selectedRiderId);
            if (!rider) return;

            const moto = motos.find(m => m.id === selectedMotoId);

            if (overwrite) {
                const shiftsToDelete = existingShifts.filter(s =>
                    s.riderId === selectedRiderId &&
                    selectedDays.some(day => s.startAt.startsWith(day))
                );

                const deletePromises = shiftsToDelete.map(s => {
                    const sid = s.shiftId || s.id;
                    if (sid) return shiftService.deleteShift(sid);
                    return Promise.resolve();
                });
                await Promise.all(deletePromises);
            }

            const newShifts: any[] = [];

            for (const dayIso of selectedDays) {
                if (activePreset === 'partido') {
                    const s1 = createSafeShift(dayIso, '13:30', '16:00');
                    if (overwrite || !hasConflict(s1)) {
                        newShifts.push({
                            riderId: rider.id,
                            riderName: rider.name || rider.email || 'Rider',
                            motoId: moto?.id || null,
                            motoPlate: moto?.licensePlate || '',
                            startAt: s1.startAt,
                            endAt: s1.endAt
                        });
                    }

                    const s2 = createSafeShift(dayIso, '20:30', '23:00');
                    if (overwrite || !hasConflict(s2)) {
                        newShifts.push({
                            riderId: rider.id,
                            riderName: rider.name || rider.email || 'Rider',
                            motoId: moto?.id || null,
                            motoPlate: moto?.licensePlate || '',
                            startAt: s2.startAt,
                            endAt: s2.endAt
                        });
                    }
                } else {
                    const s = createSafeShift(dayIso, startHour, endHour);
                    if (overwrite || !hasConflict(s)) {
                        newShifts.push({
                            riderId: rider.id,
                            riderName: rider.name || rider.email || 'Rider',
                            motoId: moto?.id || null,
                            motoPlate: moto?.licensePlate || '',
                            startAt: s.startAt,
                            endAt: s.endAt
                        });
                    }
                }
            }

            if (newShifts.length > 0) {
                if (_onCreateShifts) {
                    await _onCreateShifts(newShifts);
                } else {
                    const promises = newShifts.map(s => shiftService.createShift({ ...s, franchiseId }));
                    await Promise.all(promises);
                }
            }

            onRefresh();
            onClose();
        } catch (error: unknown) {
            console.error("Generación fallida:", error);
            const message = error instanceof Error ? error.message : String(error);
            alert("Error al generar turnos: " + message);
        } finally {
            setIsProcessing(false);
            setSelectedDays([]);
        }
    };

    const handleCloneRiderAction = async () => {
        if (!sourceRiderId || !selectedRiderId || selectedDays.length === 0) {
            alert("Selecciona Rider Origen, Rider Destino y al menos un día.");
            return;
        }

        setIsProcessing(true);
        try {
            const shiftsToClone = existingShifts.filter(s =>
                s.riderId === sourceRiderId &&
                selectedDays.some(day => s.startAt.startsWith(day))
            );

            if (shiftsToClone.length === 0) {
                alert("El rider origen no tiene turnos en los días seleccionados.");
                return;
            }

            if (overwrite) {
                const shiftsToDelete = existingShifts.filter(s =>
                    s.riderId === selectedRiderId &&
                    selectedDays.some(day => s.startAt.startsWith(day))
                );
                const deletePromises = shiftsToDelete.map(s => {
                    const sid = s.shiftId || s.id;
                    if (sid) return shiftService.deleteShift(sid);
                    return Promise.resolve();
                });
                await Promise.all(deletePromises);
            }

            const rider = riders.find(r => r.id === selectedRiderId);
            if (!rider) throw new Error("Rider destino no encontrado");

            const promises = shiftsToClone.map(s => {
                if (!overwrite) {
                    const conflict = existingShifts.some(es =>
                        es.riderId === selectedRiderId &&
                        areIntervalsOverlapping(
                            { start: new Date(s.startAt), end: new Date(s.endAt) },
                            { start: new Date(es.startAt), end: new Date(es.endAt) }
                        )
                    );
                    if (conflict) return Promise.resolve();
                }

                return shiftService.createShift({
                    franchiseId,
                    riderId: selectedRiderId,
                    riderName: rider.name || rider.email || 'Rider',
                    motoId: (s.motoId as string | null),
                    motoPlate: (s.motoPlate as string) || '',
                    startAt: s.startAt,
                    endAt: s.endAt
                });
            });

            await Promise.all(promises);
            onRefresh();
            onClose();

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            alert("Error al clonar: " + message);
        } finally {
            setIsProcessing(false);
        }
    }

    const handleBulkDelete = async () => {
        if (!selectedRiderId || selectedDays.length === 0) {
            alert("Selecciona un rider y los días a limpiar.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de BORRAR todos los turnos de este rider en los ${selectedDays.length} días seleccionados ? `)) return;

        setIsProcessing(true);
        try {
            const shiftsToDelete = existingShifts.filter(s =>
                s.riderId === selectedRiderId &&
                selectedDays.some(day => s.startAt.startsWith(day))
            );

            if (shiftsToDelete.length === 0) {
                alert("No hay turnos para eliminar en esos días.");
                return;
            }

            const deletePromises = shiftsToDelete.map(s => {
                const sid = s.shiftId || s.id;
                if (sid) return shiftService.deleteShift(sid);
                return Promise.resolve();
            });

            await Promise.all(deletePromises);
            onRefresh();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            alert("Error al borrar: " + message);
        } finally {
            setIsProcessing(false);
        }
    }

    const createSafeShift = (dayIso: string, sTime: string, eTime: string) => {
        const parseTime = (t: string) => {
            if (t.includes(':')) {
                const [h, m] = t.split(':').map(Number);
                return { h, m };
            }
            return { h: parseInt(t), m: 0 };
        };

        const startT = parseTime(sTime);
        const endT = parseTime(eTime);

        let start = parseISO(dayIso);
        start = setHours(start, startT.h);
        start = setMinutes(start, startT.m);
        start = setSeconds(start, 0);

        let end = parseISO(dayIso);
        if (endT.h === 24 || (endT.h === 0 && endT.m === 0 && parseInt(eTime) !== 0)) {
            end = addDays(end, 1);
            end = setHours(end, 0);
            end = setMinutes(end, 0);
        } else {
            end = setHours(end, endT.h);
            end = setMinutes(end, endT.m);
        }
        end = setSeconds(end, 0);

        return { start, end, startAt: toLocalISOString(start), endAt: toLocalISOString(end) };
    };

    const hasConflict = (newShift: { start: Date, end: Date, startAt: string }) => {
        return existingShifts.some(es => {
            if (es.riderId !== selectedRiderId) return false;
            const esStart = new Date(es.startAt);
            const esEnd = new Date(es.endAt);
            return areIntervalsOverlapping(
                { start: newShift.start, end: newShift.end },
                { start: esStart, end: esEnd }
            );
        });
    };



    const handleClonePreviousWeek = async () => {
        if (!franchiseId || weekDays.length === 0) return;
        const confirmClone = window.confirm("¿Importar la planificación completa de la semana pasada?");
        if (!confirmClone) return;

        setIsProcessing(true);
        try {
            const currentStart = parseISO(weekDays[0].isoDate);
            const prevStart = subDays(currentStart, 7);
            const prevEnd = subDays(currentStart, 1);
            prevEnd.setHours(23, 59, 59, 999);

            const oldShifts = await shiftService.getShiftsInRange(franchiseId, prevStart, prevEnd);

            if (oldShifts.length === 0) {
                alert("No hay turnos en la semana pasada para clonar.");
                return;
            }

            const replicatedPromises = oldShifts
                .map(s => {
                    const newStart = addDays(new Date(s.startAt), 7);
                    const newEnd = addDays(new Date(s.endAt), 7);
                    const startAt = toLocalISOString(newStart);
                    const endAt = toLocalISOString(newEnd);

                    const conflict = existingShifts.some(es =>
                        es.riderId === s.riderId &&
                        (es.startAt === startAt || areIntervalsOverlapping(
                            { start: newStart, end: newEnd },
                            { start: new Date(es.startAt), end: new Date(es.endAt) }
                        ))
                    );

                    if (conflict && !overwrite) return null;

                    return shiftService.createShift({
                        franchiseId,
                        riderId: s.riderId,
                        riderName: s.riderName,
                        motoId: s.motoId,
                        motoPlate: s.motoPlate,
                        startAt,
                        endAt
                    });
                })
                .filter(p => p !== null) as Promise<void>[];

            await Promise.all(replicatedPromises);
            onRefresh();
            onClose();
        } catch (error: unknown) {
            console.error("Clonación fallida:", error);
            alert("Error al importar.");
        } finally {
            setIsProcessing(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl border border-white/40 rounded-3xl w-full max-w-md sm:max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">

                <div className="px-8 pt-8 pb-6 border-b border-slate-100/50 flex justify-between items-center bg-gradient-to-r from-indigo-50/30 to-blue-50/30">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2 md:gap-3 tracking-tight">
                            <div className="p-2 md:p-2.5 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                                <Zap className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="hidden sm:inline">Autocompletar Turnos</span>
                            <span className="sm:hidden">Autocompletar</span>
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                            {complianceIssues.length > 0 && !isProcessing && (
                                <div className="animate-in fade-in slide-in-from-left-4 hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full cursor-help group/compliance"
                                    title={complianceIssues.map(i => i.message).join('\n')}>
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-amber-700">
                                        {complianceIssues.length} Alerta{complianceIssues.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}

                            {estimatedCost && activePreset !== 'clone_rider' && (
                                <div className="animate-in fade-in slide-in-from-left-4 hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                                    <Euro size={12} className="text-emerald-600" />
                                    <span className="text-[10px] font-bold text-emerald-700">
                                        Impacto: {CostService.formatCurrency(estimatedCost.total)}
                                    </span>
                                </div>
                            )}
                            {activePreset === 'clone_rider' ? (
                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] ml-0.5">Modo Clonar Rider</p>
                            ) : (
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] ml-0.5">Planificación Automática</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
                        aria-label="Cerrar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 pl-1 block">Acciones Rápidas</label>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => applyPreset('comida')} aria-label="Preset Comida" className={cn("relative p-3 rounded-2xl border transition-all flex flex-col items-center gap-2", activePreset === 'comida' ? "bg-amber-50 border-amber-200 ring-2 ring-amber-400/30" : "bg-white border-slate-100 hover:bg-slate-50")}>
                                <Sun className={cn("w-5 h-5", activePreset === 'comida' ? "text-amber-500" : "text-slate-400")} />
                                <div className="text-[9px] font-bold text-slate-700">Comida</div>
                            </button>
                            <button onClick={() => applyPreset('cena')} aria-label="Preset Cena" className={cn("relative p-3 rounded-2xl border transition-all flex flex-col items-center gap-2", activePreset === 'cena' ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-400/30" : "bg-white border-slate-100 hover:bg-slate-50")}>
                                <Moon className={cn("w-5 h-5", activePreset === 'cena' ? "text-indigo-500" : "text-slate-400")} />
                                <div className="text-[9px] font-bold text-slate-700">Cena</div>
                            </button>
                            <button onClick={() => applyPreset('partido')} aria-label="Preset Partido" className={cn("relative p-3 rounded-2xl border transition-all flex flex-col items-center gap-2", activePreset === 'partido' ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-400/30" : "bg-white border-slate-100 hover:bg-slate-50")}>
                                <Split className={cn("w-5 h-5", activePreset === 'partido' ? "text-emerald-500" : "text-slate-400")} />
                                <div className="text-[9px] font-bold text-slate-700">Partido</div>
                            </button>
                            <button onClick={() => setActivePreset('clone_rider')} aria-label="Modo Clonar" className={cn("relative p-3 rounded-2xl border transition-all flex flex-col items-center gap-2", activePreset === 'clone_rider' ? "bg-purple-50 border-purple-200 ring-2 ring-purple-400/30" : "bg-white border-slate-100 hover:bg-slate-50")}>
                                <Users className={cn("w-5 h-5", activePreset === 'clone_rider' ? "text-purple-500" : "text-slate-400")} />
                                <div className="text-[9px] font-bold text-slate-700">Clonar</div>
                            </button>
                        </div>
                    </div>

                    {savedTemplates.length > 0 && (
                        <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Bookmark size={12} />
                                Plantillas Guardadas
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {savedTemplates.map((t, i) => (
                                    <button key={i} onClick={() => loadTemplate(t)}
                                        className="group flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
                                        <span>{t.name}</span>
                                        <div onClick={(e) => deleteTemplate(i, e)} className="p-0.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors">
                                            <X size={10} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                Patrón Horario
                                <button onClick={saveTemplate} className="ml-2 p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-all" title="Guardar como plantilla">
                                    <Save size={14} />
                                </button>
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {activePreset === 'clone_rider' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-purple-500 uppercase tracking-wider pl-1">Rider Origen</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none">
                                                <User size={14} />
                                            </div>
                                            <select className="w-full bg-purple-50/50 border-none rounded-xl pl-9 pr-4 py-3 text-sm font-semibold outline-none ring-1 ring-purple-100 focus:ring-2 focus:ring-purple-500/30 appearance-none"
                                                value={sourceRiderId} onChange={(e) => setSourceRiderId(e.target.value)} title="Seleccionar Rider Origen">
                                                <option value="">Seleccionar...</option>
                                                {riders.map(r => <option key={r.id} value={r.id}>{r.name || r.email || r.id}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Rider Destino</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                                                <User size={14} />
                                            </div>
                                            <select className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-3 text-sm font-semibold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/30 appearance-none"
                                                value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)} title="Seleccionar Rider Destino">
                                                <option value="">Seleccionar...</option>
                                                {riders.map(r => <option key={r.id} value={r.id}>{r.name || r.email || r.id}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2 sm:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 pl-1 block">Rider</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <User size={16} />
                                            </div>
                                            <select className="w-full bg-slate-50 hover:bg-white border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
                                                value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)} title="Seleccionar Rider">
                                                <option value="">Seleccionar Rider...</option>
                                                {riders.map(r => <option key={r.id} value={r.id}>{r.name || r.email || r.id}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 pl-1 block">Vehículo</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <Truck size={16} />
                                            </div>
                                            <select className="w-full bg-slate-50 hover:bg-white border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500/30 transition-all appearance-none cursor-pointer"
                                                value={selectedMotoId} onChange={(e) => setSelectedMotoId(e.target.value)} title="Seleccionar Vehículo">
                                                <option value="">Sin vehículo</option>
                                                {motos.map(m => <option key={m.id} value={m.id}>{m.licensePlate} - {m.model}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between pl-1">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em]">Días</label>
                                <div className="flex gap-2">
                                    <button onClick={selectWeekdays} className="text-[9px] font-bold text-slate-400 hover:text-indigo-500 bg-slate-100 px-2 py-1 rounded-lg transition-colors">Diario</button>
                                    <button onClick={selectWeekends} className="text-[9px] font-bold text-slate-400 hover:text-indigo-500 bg-slate-100 px-2 py-1 rounded-lg transition-colors">Finde</button>
                                    <button onClick={() => setSelectedDays(weekDays.map(d => d.isoDate))} className="text-[9px] font-bold text-slate-400 hover:text-indigo-500 bg-slate-100 px-2 py-1 rounded-lg transition-colors">Todos</button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {weekDays.map(day => {
                                    const isSelected = selectedDays.includes(day.isoDate);
                                    return (
                                        <button key={day.isoDate} onClick={() => toggleDay(day.isoDate)}
                                            className={cn("w-10 h-10 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center",
                                                isSelected ? "bg-slate-800 text-white border-slate-800 shadow-lg scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-indigo-200")}
                                        >
                                            {day.shortLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {activePreset !== 'partido' && activePreset !== 'clone_rider' && (
                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em] pl-1">Horario</label>
                                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <input type="time" title="Hora Inicio" value={startHour} onChange={(e) => { setStartHour(e.target.value); setActivePreset('custom'); }} className="flex-1 bg-white border-none rounded-xl py-2 text-center font-mono font-bold text-slate-700 ring-1 ring-slate-200" />
                                    <ArrowRight size={14} className="text-slate-300" />
                                    <input type="time" title="Hora Fin" value={endHour} onChange={(e) => { setEndHour(e.target.value); setActivePreset('custom'); }} className="flex-1 bg-white border-none rounded-xl py-2 text-center font-mono font-bold text-slate-700 ring-1 ring-slate-200" />
                                </div>
                            </div>
                        )}

                        <div onClick={() => setOverwrite(!overwrite)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                            {overwrite ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />}
                            <div>
                                <p className={cn("text-xs font-bold transition-colors", overwrite ? "text-indigo-600" : "text-slate-500")}>Sobrescribir turnos existentes</p>
                                <p className="text-[9px] text-slate-400">Si hay conflicto, se borrará el turno anterior.</p>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center rounded-b-3xl">
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedDays.length === 0 || !selectedRiderId || isProcessing}
                        className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-30"
                    >
                        <Trash2 size={14} />
                        Borrar
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleClonePreviousWeek}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 bg-white transition-all"
                            title="Importar S. Ant"
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={selectedDays.length === 0 || !selectedRiderId || isProcessing}
                            className={cn(
                                "px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                activePreset === 'clone_rider' && "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                            )}
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                            {activePreset === 'clone_rider' ? 'Clonar' : 'Generar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickFillModal;
