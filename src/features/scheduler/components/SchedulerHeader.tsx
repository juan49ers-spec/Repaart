import React from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon, BadgeCheck, Save, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../../lib/utils';

interface SchedulerHeaderProps {
    selectedDate: Date;
    viewMode: 'day' | 'week';
    setViewMode: (mode: 'day' | 'week') => void;
    onChangeWeek: (direction: number) => void;
    showLunch: boolean;
    setShowLunch: (show: boolean) => void;
    showDinner: boolean;
    setShowDinner: (show: boolean) => void;
    showPrime: boolean;
    setShowPrime: (show: boolean) => void;
    sheriffResult: any; // Type this properly if possible
    onAudit: () => void;
    hasUnsavedChanges: boolean;
    isPublishing: boolean;
    onPublish: () => void;
    onCreateShift: () => void;
    readOnly?: boolean;
}

export const SchedulerHeader: React.FC<SchedulerHeaderProps> = ({
    selectedDate,
    viewMode,
    setViewMode,
    onChangeWeek,
    showLunch,
    setShowLunch,
    showDinner,
    setShowDinner,
    showPrime,
    setShowPrime,
    sheriffResult,
    onAudit,
    hasUnsavedChanges,
    isPublishing,
    onPublish,
    onCreateShift,
    readOnly
}) => {
    return (
        <div className="bg-white border-b border-slate-200 shadow-sm z-30 flex-none">
            <div className="px-6 py-3 flex items-center justify-between">
                {/* Left: Navigation */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => onChangeWeek(-1)}
                            title={viewMode === 'day' ? "Día anterior" : "Semana anterior"}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-3 text-sm font-medium text-slate-600 capitalize min-w-[140px] text-center">
                            {format(selectedDate, viewMode === 'day' ? 'd MMMM yyyy' : 'MMMM yyyy', { locale: es })}
                        </span>
                        <button
                            onClick={() => onChangeWeek(1)}
                            title={viewMode === 'day' ? "Día siguiente" : "Siguiente semana"}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    {/* View Toggles */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button
                            onClick={() => setViewMode('day')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-medium uppercase rounded-md transition-all",
                                viewMode === 'day' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Día
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-medium uppercase rounded-md transition-all",
                                viewMode === 'week' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {!readOnly && (
                        <button
                            onClick={onCreateShift}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                            title="Crear nuevo turno"
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Crear Turno</span>
                        </button>
                    )}

                    {viewMode === 'day' && (
                        <button
                            onClick={() => {
                                const next = !showPrime;
                                setShowPrime(next);
                                if (next) {
                                    setShowLunch(true);
                                    setShowDinner(true);
                                }
                            }}
                            title="Modo PRIME: Resalta horas punta y muestra todos los turnos"
                            className={cn(
                                "px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-2 transition-all tracking-wide uppercase",
                                showPrime
                                    ? "bg-indigo-600 border-indigo-700 text-white shadow-lg scale-105"
                                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            <BadgeCheck size={14} className={showPrime ? "text-amber-400" : ""} />
                            <span>PRIME</span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowLunch(!showLunch)}
                        title="Filtrar Turno Mediodía (12:00 - 16:30)"
                        className={cn(
                            "px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-1.5 transition-all text-slate-500",
                            showLunch ? "bg-amber-100 border-amber-300 text-amber-700 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <Sun size={16} className={showLunch ? "fill-amber-500 text-amber-600" : ""} />
                        <span className="hidden sm:inline">Mediodía</span>
                    </button>

                    <button
                        onClick={() => setShowDinner(!showDinner)}
                        title="Filtrar Turno Noche (20:00 - 24:00)"
                        className={cn(
                            "px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-1.5 transition-all text-slate-500",
                            showDinner ? "bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <Moon size={16} className={showDinner ? "fill-indigo-500 text-indigo-600" : ""} />
                        <span className="hidden sm:inline">Noche</span>
                    </button>

                    <div className="h-6 w-px bg-slate-200 mx-1" />

                    {!readOnly && (
                        <>
                            <button
                                onClick={onAudit}
                                className={cn("px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-1.5 transition-all",
                                    sheriffResult
                                        ? (sheriffResult.status === 'optimal' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600")
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <BadgeCheck size={14} />
                                {sheriffResult ? `Sheriff: ${sheriffResult.score}` : "Auditar"}
                            </button>

                            {hasUnsavedChanges && (
                                <button
                                    onClick={onPublish}
                                    disabled={isPublishing}
                                    className="ml-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-medium rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    PUBLICAR
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
