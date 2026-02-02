import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ShiftEvent {
    id: string;
    shiftId?: string;
    riderId: string;
    riderName: string;
    startAt: string;
    endAt: string;
    visualStart: Date;
    visualEnd: Date;
    visualStartPercent: number;
    visualWidthPercent: number;
    duration?: number;
    isConfirmed?: boolean;
    changeRequested?: boolean;
    changeReason?: string | null;
}

interface DayData {
    isoDate: string;
    shifts: ShiftEvent[];
    [key: string]: unknown;
}

interface RiderRowData {
    id: string;
    fullName: string;
    status: string;
    contractHours: number;
    workedHours?: number;
    days: DayData[];
}

interface VirtualizedRidersGridProps {
    ridersGrid: RiderRowData[];
    riderColorMap: Map<string, { bg: string; border: string; text: string }>;
    rowHeight?: number;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent, day: DayData) => void;
    handleColumnClick?: (e: React.MouseEvent, dayIsoDate: string) => void;
    handleEditShift?: (ev: ShiftEvent) => void;
    handleDeleteShift?: (shiftId: string, e: React.MouseEvent) => void;
    selectedShiftId?: string | null;
    hoveredShiftId?: string | null;
    setSelectedShiftId?: (id: string | null) => void;
    setHoveredShiftId?: (id: string | null) => void;
    readOnly?: boolean;
}

/**
 * Virtualized R Riders Grid - Optimized for large datasets
 * Renders only visible rider rows using @tanstack/react-virtual
 */
export const VirtualizedRidersGrid: React.FC<VirtualizedRidersGridProps> = ({
    ridersGrid,
    riderColorMap,
    rowHeight = 38,
    onDragOver,
    onDragLeave,
    onDrop,
    handleColumnClick,
    handleEditShift,
    handleDeleteShift,
    selectedShiftId,
    hoveredShiftId,
    setSelectedShiftId,
    setHoveredShiftId,
    readOnly = false
}) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: ridersGrid.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5
    });

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 @container" ref={parentRef}>
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative'
                }}
            >
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const row = ridersGrid[virtualRow.index];

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`
                            }}
                            className={virtualRow.index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                        >
                            <div className="flex h-full border-b border-slate-100/80 items-center transition-all duration-200 group/row">
                                {/* Rider Info Side */}
                                <div className="w-full @md:w-56 shrink-0 border-r border-slate-100/80 p-2 flex items-center gap-3 sticky left-0 z-30 bg-white/80 backdrop-blur-md min-w-0">
                                    <div className="relative">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover/row:scale-105
                                            ${riderColorMap.get(row.id)?.bg || 'bg-slate-200'}
                                        `}>
                                            {row.fullName?.substring(0, 2) || '??'}
                                        </div>
                                        {row.status === 'active' && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex flex-col flex-1">
                                        <div className="text-[11px] font-bold text-slate-700 truncate group-hover/row:text-indigo-600 transition-colors leading-tight mb-0.5">
                                            {row.fullName || row.id}
                                        </div>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-px rounded-full border border-slate-200/50 whitespace-nowrap">
                                                C: <span className="font-bold text-slate-600">{row.contractHours || 40}h</span>
                                            </span>
                                            <span className={`
                                                text-[9px] font-medium px-1.5 py-px rounded-full border whitespace-nowrap truncate
                                                ${(row.workedHours || 0) > (row.contractHours || 40) ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                    (row.workedHours || 0) < ((row.contractHours || 40) - 5) ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                                        "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                }
                                            `}>
                                                R: <span className="font-bold">{(row.workedHours || 0)}h</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Days Grid */}
                                <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100/80 h-full">
                                    {row.days.map((day: DayData, dIdx: number) => (
                                        <div
                                            key={dIdx}
                                            className="h-12 relative flex items-center px-1 overflow-hidden cursor-crosshair group/cell"
                                            onClick={(e) => handleColumnClick?.(e, day.isoDate)}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onDrop={(e) => onDrop?.(e, day)}
                                        >
                                            {/* Background Timeline */}
                                            <div className="absolute inset-0 flex justify-between px-0.5 opacity-[0.04] pointer-events-none">
                                                {Array.from({ length: 9 }).map((_, i: number) => (
                                                    <div key={i} className="w-[1px] h-full border-r border-dashed border-slate-900" />
                                                ))}
                                            </div>

                                            {/* Shifts Container */}
                                            <div className="relative w-full h-full flex items-center">
                                                {day.shifts?.map((ev: ShiftEvent) => {
                                                    const shiftStyle = {
                                                        left: `${ev.visualStartPercent}%`,
                                                        width: `${ev.visualWidthPercent}%`
                                                    };

                                                    return (
                                                        <div
                                                            key={ev.shiftId || ev.id}
                                                            className="absolute"
                                                            style={shiftStyle}
                                                        >
                                                            <ShiftPill
                                                                event={ev}
                                                                onClick={(e: React.MouseEvent) => {
                                                                    e.stopPropagation();
                                                                    setSelectedShiftId?.(ev.shiftId || ev.id || null);
                                                                    handleEditShift?.(ev);
                                                                }}
                                                                onDelete={handleDeleteShift}
                                                                isSelected={selectedShiftId === (ev.shiftId || ev.id)}
                                                                isHovered={hoveredShiftId === (ev.shiftId || ev.id)}
                                                                onMouseEnter={() => setHoveredShiftId?.((ev.shiftId || ev.id) || null)}
                                                                onMouseLeave={() => setHoveredShiftId?.(null)}
                                                                riderColor={riderColorMap.get(row.id)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Add Trigger */}
                                            {!readOnly && (
                                                <div className="absolute inset-0 bg-indigo-500/0 group-hover/cell:bg-indigo-500/[0.03] transition-colors pointer-events-none" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Helper component for individual shift pills
const ShiftPill: React.FC<{
    event: ShiftEvent;
    onClick: (e: React.MouseEvent) => void;
    onDelete?: (id: string, e: React.MouseEvent) => void;
    riderColor?: { bg: string; border: string; text: string };
    isSelected?: boolean;
    isHovered?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}> = ({ event, onClick, onDelete, isSelected, isHovered, onMouseEnter, onMouseLeave }) => {
    const duration = event.duration || 1;
    const startTime = new Date(event.startAt || event.visualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(event.endAt || event.visualEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isNight = new Date(event.startAt || event.visualStart).getHours() >= 19;
    const isConfirmed = event.isConfirmed;
    const changeRequested = event.changeRequested;

    return (
        <div
            onClick={onClick}
            className={`
                group/pill relative h-[26px] rounded-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center px-2 select-none
                hover:brightness-95 hover:scale-[1.01] hover:shadow-md hover:z-50 active:scale-95
                ${isSelected ? "ring-2 ring-indigo-500 ring-offset-1 z-50 shadow-lg" : ""}
                ${isHovered ? "brightness-95 scale-[1.01]" : ""}
                ${isNight
                    ? "bg-slate-800 border border-slate-700 text-slate-100 shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 shadow-sm"
                }
                ${changeRequested
                    ? "border-l-[3px] border-l-amber-400 border-t border-b border-r border-slate-200 text-slate-700 hover:bg-amber-50"
                    : ""
                }
            `}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title={`${event.riderName} | ${startTime} - ${endTime} (${duration}h)${changeRequested ? ` | MOTIVO: ${event.changeReason || 'Sin motivo'}` : ''}`}
        >
            <div className="flex items-center gap-1.5 min-w-0 w-full relative z-10">
                {changeRequested && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />}
                {isConfirmed && !changeRequested && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                <span className="text-[10px] font-bold tracking-tight truncate flex-1">
                    {startTime} - {endTime}
                </span>
                <span className="text-[9px] font-medium opacity-70 shrink-0">
                    {duration}h
                </span>
            </div>

            {onDelete && (
                <button
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDelete(event.shiftId || event.id || '', e);
                    }}
                    className="absolute right-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-rose-500"
                    title="Eliminar turno"
                    aria-label="Eliminar turno"
                >
                    ×
                </button>
            )}
        </div>
    );
};