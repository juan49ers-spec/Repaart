import React, { useState, useEffect } from 'react';
import { Truck, AlertCircle, Edit2, Copy, Trash2, Move, RefreshCw, Check } from 'lucide-react';
import { getRiderColor, getShiftDuration, getRiderInitials } from '../../utils/colorPalette';
import { cn } from '../../lib/utils';
import { shiftService } from '../../services/shiftService';
import { notificationService } from '../../services/notificationService';

interface MotoAssignment {
    motoId: string;
    plate: string;
    startAt: string;
    endAt: string;
}

export interface ShiftEvent {
    shiftId: string;
    riderId: string | null;
    riderName: string;
    startAt: string; // ISO string
    endAt: string;   // ISO string
    visualStart: Date;
    visualEnd: Date;
    isConfirmed?: boolean;
    swapRequested?: boolean;
    changeRequested?: boolean;
    changeReason?: string | null;
    franchiseId?: string;
    motoAssignments?: MotoAssignment[];
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
    isExpanded?: boolean;
    isRiderMode?: boolean;
    dateLabel?: string;
    intelIcons?: React.ReactNode;
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
    readOnly = false,
    isExpanded = false,
    isRiderMode = false,
    dateLabel,
    intelIcons
}) => {
    const { riderName, riderId, visualStart, visualEnd, motoAssignments, startAt, endAt, isConfirmed: propConfirmed } = event;
    const [showActions, setShowActions] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync local state with props
    const [localConfirmed, setLocalConfirmed] = useState(propConfirmed || false);
    const [localRequested, setLocalRequested] = useState(event.changeRequested || false);

    useEffect(() => {
        setLocalConfirmed(propConfirmed || false);
    }, [propConfirmed]);

    useEffect(() => {
        setLocalRequested(event.changeRequested || false);
    }, [event.changeRequested]);

    // Effective state
    const isConfirmed = localConfirmed;
    const changeRequested = localRequested;

    // Get rider color
    const riderColor = getRiderColor(riderId || '');

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
        if (readOnly || isRiderMode) return;
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

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isProcessing) return;
        setIsProcessing(true);
        const nextState = !isConfirmed;
        setLocalConfirmed(nextState); // Optimistic
        try {
            await shiftService.confirmShift(event.shiftId);
        } catch (err) {
            console.error("Error confirming shift:", err);
            setLocalConfirmed(!nextState); // Revert
            alert("Error al guardar la confirmación. Por favor, verifica tu conexión.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRequestChange = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isProcessing) return;
        setIsProcessing(true);
        const nextState = !changeRequested;

        let reason = "";
        if (nextState) {
            reason = window.prompt("¿Cuál es el motivo del cambio? (Opcional)") || "";
        }

        setLocalRequested(nextState); // Optimistic
        try {
            await shiftService.requestChange(event.shiftId, nextState, reason);
            if (nextState) {
                // Generate notification for franchise
                if (!event.franchiseId) {
                    console.warn("Missing franchiseId for notification");
                } else {
                    await notificationService.notifyRiderAction(
                        event.franchiseId,
                        riderId || '',
                        {
                            type: 'shift_change_request',
                            title: 'Solicitud de Cambio de Turno',
                            message: `El rider ${riderName} solicita cambio para el turno del ${new window.Date(event.startAt).toLocaleDateString()}.Motivo: ${reason || 'N/A'} `,
                            relatedShiftId: event.shiftId
                        }
                    );
                }
            }
        } catch (err) {
            console.error("Error requesting change:", err);
            setLocalRequested(!nextState); // Revert
            alert("Error al solicitar el cambio. Por favor, intenta de nuevo.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Determine if drag is allowed
    const canDrag = !readOnly && !isRiderMode && !hasConflict;

    return (
        <div
            draggable={canDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
                "group relative px-4 py-3 rounded-[24px] transition-all duration-300 overflow-hidden select-none mb-3",
                // Base state
                isDragging ? 'opacity-40 cursor-grabbing scale-95 ring-2 ring-indigo-400 ring-offset-2' : 'cursor-grab',
                // Conflict State
                hasConflict
                    ? 'bg-red-900/20 backdrop-blur-md border border-red-500/30'
                    : changeRequested
                        ? 'bg-amber-900/20 border border-amber-500/30'
                        : isRiderMode
                            // ULTRA PREMIUM RIDER MODE (ZINC)
                            ? "bg-[#18181b] ring-1 ring-white/5 shadow-xl shadow-black/40"
                            // ADMIN STANDARD MODE
                            : cn(
                                "hover:z-50 shadow-sm hover:shadow-xl hover:-translate-y-1 border",
                                "bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60",
                                "border-slate-100"
                            ),
                canDrag && "active:scale-[0.98] active:cursor-grabbing",
                isExpanded && isRiderMode && "ring-1 ring-white/10"
            )}
            style={style}
            onClick={onClick}
            onContextMenu={handleRightClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {isRiderMode ? (
                // --- ULTRA-DENSE RIDER CONTENT (50% REDUCTION) ---
                <div className="flex flex-col gap-1.5">

                    {/* ROW 1: HEADER (Date, Status, Moto) */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 h-6">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {dateLabel && (
                                <span className={cn(
                                    "text-[10px] font-black tracking-tight uppercase whitespace-nowrap",
                                    dateLabel.includes('HOY') ? "text-emerald-400" : "text-zinc-500"
                                )}>
                                    {dateLabel}
                                </span>
                            )}
                            {/* Status Indicator (Compact Pill) */}
                            {isConfirmed ? (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-bold text-emerald-400 uppercase">OK</span>
                                </div>
                            ) : changeRequested ? (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[8px] font-bold text-amber-400 uppercase">REQ</span>
                                </div>
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" title="Pendiente" />
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {intelIcons && <div className="flex gap-0.5 scale-75 origin-right">{intelIcons}</div>}
                            {moto && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5">
                                    <Truck size={8} className="text-indigo-400" />
                                    <span className="text-[8px] font-bold text-zinc-400 font-mono">{moto.plate}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ROW 2: PAYLOAD (Time + Actions) */}
                    <div className="flex items-center justify-between h-10">
                        {/* Time Left */}
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-light text-white tracking-tighter">{startTime}</span>
                            <span className="text-zinc-700 text-lg mx-0.5">—</span>
                            <span className="text-zinc-500 text-lg font-light tracking-tighter">{endTime}</span>
                            <span className="ml-2 px-1 py-0.5 rounded bg-white/5 text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">{duration}h</span>
                        </div>

                        {/* Actions Right (Compact Icons) */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRequestChange}
                                disabled={isProcessing}
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 border",
                                    changeRequested
                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                        : "bg-zinc-800/50 border-white/5 text-zinc-500 hover:text-white"
                                )}
                                title="Solicitar cambio"
                            >
                                <RefreshCw size={14} className={cn(changeRequested && "animate-spin-slow")} />
                            </button>

                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing || isConfirmed}
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg",
                                    isConfirmed
                                        ? "bg-zinc-800/50 border border-emerald-500/30 text-emerald-500"
                                        : "bg-white text-black hover:bg-zinc-200"
                                )}
                                title="Confirmar turno"
                            >
                                {isConfirmed ? <Check size={16} /> : <Check size={18} strokeWidth={3} />}
                            </button>
                        </div>
                    </div>

                    {/* Conflict Banner */}
                    {hasConflict && (
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500/50" />
                    )}
                </div>
            ) : (
                // --- ADMIN/STANDARD CONTENT ---
                <>
                    {/* Left Color Indicator Pill */}
                    <div className={cn(
                        "absolute left-1 top-1 bottom-1 w-1 rounded-full opacity-60",
                        hasConflict ? "bg-red-500" : (riderColor.bg?.replace('bg-', 'bg-') || 'bg-slate-400')
                    )} />

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

                    {/* Admin Content Container */}
                    <div className="pl-3.5 flex flex-col h-full justify-between">
                        <div className="flex items-start gap-2.5 mb-1 transition-all">
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
                                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                        {startTime} - {endTime}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info: Moto */}
                        <div className="flex items-center justify-between pl-0.5 fade-in duration-200">
                            {moto ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-slate-50/80 px-2 py-0.5 rounded-full border border-slate-100">
                                    <Truck className="w-3 h-3 text-indigo-400" />
                                    <span className="truncate max-w-[80px]">{moto.plate}</span>
                                </div>
                            ) : (
                                <div className="h-5" />
                            )}
                        </div>

                        {/* Conflict Banner (Admin Bottom) */}
                        {hasConflict && (
                            <div className="absolute inset-x-0 bottom-0 bg-red-100/50 backdrop-blur-sm p-0.5 flex items-center justify-center gap-1">
                                <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Conflicto</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Drag Handle Icon - Only on Hover (ADMIN MODE & NO CONFLICT) */}
            {!readOnly && !hasConflict && !isRiderMode && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Move className="w-3 h-3 text-slate-400/70" />
                </div>
            )}

            {/* Conflict Warning Badge (Admin Top Right) */}
            {hasConflict && !isRiderMode && (
                <div className="absolute -top-1 -right-1 bg-red-100 ring-2 ring-white rounded-full p-0.5 shadow-sm animate-pulse z-20">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                </div>
            )}
        </div>
    );
};

export default ShiftCard;
