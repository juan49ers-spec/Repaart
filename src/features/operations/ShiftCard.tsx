import React, { useState } from 'react';
import { Truck, AlertCircle, Edit2, Copy, Trash2, Move } from 'lucide-react';
import { getRiderColor, getShiftDuration, getRiderInitials } from '../../utils/colorPalette';
import { cn } from '../../lib/utils';

interface MotoAssignment {
    motoId: string;
    plate: string;
    startAt: string;
    endAt: string;
}

interface ShiftEvent {
    shiftId: string;
    riderId: string;
    riderName: string;
    motoAssignments?: MotoAssignment[];
    startAt: string; // ISO string
    endAt: string;   // ISO string
    visualStart: Date;
    visualEnd: Date;
    hasConflict?: boolean;
}

interface ShiftCardProps {
    event: ShiftEvent;
    onClick: (e: React.MouseEvent) => void;
    onClone: (event: ShiftEvent, e: React.MouseEvent) => void;
    onDelete: (shiftId: string, e: React.MouseEvent) => void;
    style?: React.CSSProperties;
    hasConflict?: boolean;
    onContextMenu?: (e: React.MouseEvent, event: ShiftEvent) => void;
    onDragStart?: (event: ShiftEvent) => void;
    onDragEnd?: () => void;
    readOnly?: boolean;
}

const ShiftCard: React.FC<ShiftCardProps> = ({
    event,
    onClick,
    onClone,
    onDelete,
    style,
    hasConflict = false,
    onContextMenu,
    onDragStart,
    onDragEnd,
    readOnly = false
}) => {
    const { riderName, riderId, visualStart, visualEnd, motoAssignments, startAt, endAt } = event;
    const [showActions, setShowActions] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Get rider color
    const riderColor = getRiderColor(riderId);

    // Calculate duration
    const duration = getShiftDuration(startAt, endAt);

    // Formatting times
    const startTime = visualStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = visualEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Moto info
    const moto = motoAssignments && motoAssignments.length > 0
        ? motoAssignments[0]
        : null;

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onContextMenu) {
            onContextMenu(e, event);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (readOnly) return;
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(event));

        // Create ghost image
        const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
        ghost.style.opacity = '0.9';
        ghost.style.transform = 'scale(1.05) rotate(2deg)';
        ghost.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 50, 25);
        setTimeout(() => document.body.removeChild(ghost), 0);

        if (onDragStart) onDragStart(event);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (onDragEnd) onDragEnd();
    };

    return (
        <div
            draggable={!readOnly && !hasConflict}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
                "group relative p-3 rounded-2xl transition-all duration-300 overflow-hidden select-none border",
                // Base state
                isDragging ? 'opacity-40 cursor-grabbing scale-95 ring-2 ring-indigo-400 ring-offset-2' : 'cursor-grab',
                // Conflict State
                hasConflict
                    ? 'bg-red-50/90 backdrop-blur-md border-red-200 shadow-[0_8px_30px_rgb(239,68,68,0.15)] hover:border-red-300'
                    : cn(
                        "hover:z-50 shadow-sm hover:shadow-xl hover:-translate-y-1",
                        // Backdrops & Borders
                        "bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60",
                        riderColor.border ? riderColor.border.replace('border-', 'border-opacity-50 border-') : 'border-slate-100'
                    ),
                !readOnly && !hasConflict && "active:scale-[0.98] active:cursor-grabbing"
            )}
            style={style}
            onClick={onClick}
            onContextMenu={handleRightClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Left Color Indicator Pill */}
            <div className={cn(
                "absolute left-1 top-1 bottom-1 w-1 rounded-full opacity-60",
                hasConflict ? "bg-red-500" : (riderColor.bg?.replace('bg-', 'bg-') || 'bg-slate-400')
            )} />

            {/* Drag Handle Icon - Only on Hover */}
            {!readOnly && !hasConflict && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Move className="w-3 h-3 text-slate-400/70" />
                </div>
            )}

            {/* Conflict Warning */}
            {hasConflict && (
                <div className="absolute -top-1 -right-1 bg-red-100 ring-2 ring-white rounded-full p-0.5 shadow-sm animate-pulse z-20">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                </div>
            )}

            {/* Duration Badge - Floating Style */}
            <div className={cn(
                "absolute -top-2 -left-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full shadow-sm z-10 border",
                hasConflict
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-white text-slate-600 border-slate-100"
            )}>
                {duration}h
            </div>

            {/* Quick Actions Overlay (Glass) */}
            {showActions && !hasConflict && !readOnly && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-30 flex items-center justify-center gap-2 animate-in fade-in duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(e); }}
                        className="p-1.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-full shadow-md border border-slate-100 transition-all hover:scale-110"
                        title="Editar"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClone(event, e); }}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-full shadow-md border border-slate-100 transition-all hover:scale-110"
                        title="Duplicar"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(event.shiftId, e); }}
                        className="p-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-full shadow-md border border-slate-100 transition-all hover:scale-110"
                        title="Eliminar"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Content Container (Padded from left bar) */}
            <div className="pl-3.5 flex flex-col h-full justify-between">

                {/* Rider Info */}
                <div className="flex items-start gap-2.5 mb-1">
                    <div
                        className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ring-2 ring-white shrink-0 mt-0.5",
                            riderColor.bg || 'bg-slate-200',
                            riderColor.text || 'text-slate-600'
                        )}
                    >
                        {getRiderInitials(riderName)}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <div className="font-bold text-sm text-slate-800 truncate leading-snug tracking-tight group-hover:text-indigo-900 transition-colors">
                            {riderName}
                        </div>
                        {/* Time Range */}
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                {startTime} - {endTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Info: Moto & Status */}
                <div className="flex items-center justify-between pl-0.5">
                    {moto ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-slate-50/80 px-2 py-0.5 rounded-full border border-slate-100">
                            <Truck className="w-3 h-3 text-indigo-400" />
                            <span className="truncate max-w-[80px]">{moto.plate}</span>
                        </div>
                    ) : (
                        <div className="h-5" /> // Spacer
                    )}
                </div>
            </div>

            {/* Conflict Banner (Bottom) */}
            {hasConflict && (
                <div className="absolute inset-x-0 bottom-0 bg-red-100/50 backdrop-blur-sm p-0.5 flex items-center justify-center gap-1">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Conflicto</span>
                </div>
            )}
        </div>
    );
};

export default ShiftCard;
