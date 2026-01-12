import React, { useState } from 'react';
import { Truck, AlertCircle, Edit2, Copy, Trash2, Move, RefreshCw, Check, CheckCircle, Clock } from 'lucide-react';
import { getRiderColor, getShiftDuration, getRiderInitials } from '../../utils/colorPalette';
import { cn } from '../../lib/utils';
import { shiftService } from '../../services/shiftService';

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
    startAt: string; // ISO
    endAt: string;   // ISO
    visualStart: Date;
    visualEnd: Date;
    isConfirmed?: boolean;
    swapRequested?: boolean;
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
    isRiderMode?: boolean;
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
    isRiderMode = false
}) => {
    const { riderName, riderId, visualStart, visualEnd, motoAssignments, startAt, endAt, isConfirmed: propConfirmed, swapRequested: propRequested } = event;
    const [showActions, setShowActions] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync local state with props for immediate feedback
    const [localConfirmed, setLocalConfirmed] = useState(propConfirmed || false);
    const [localRequested, setLocalRequested] = useState(propRequested || false);

    // Effective state (prefer prop if available, fallback to local for optimistic update)
    const isConfirmed = propConfirmed !== undefined ? propConfirmed : localConfirmed;
    const swapRequested = propRequested !== undefined ? propRequested : localRequested;

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
        setLocalConfirmed(true); // Optimistic
        try {
            await shiftService.confirmShift(event.shiftId);
        } catch (err) {
            console.error("Failed to confirm shift:", err);
            setLocalConfirmed(false);
            alert("No se pudo confirmar el turno.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSwapRequest = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isProcessing) return;

        const newRequested = !swapRequested;
        setIsProcessing(true);
        setLocalRequested(newRequested); // Optimistic
        try {
            await shiftService.requestSwap(event.shiftId, newRequested);
        } catch (err) {
            console.error("Failed to swap shift:", err);
            setLocalRequested(!newRequested);
            alert("Error al procesar la solicitud.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Determine if drag is allowed
    const canDrag = !readOnly && !isRiderMode && !hasConflict;

    // --- RENDER FOR RIDER MODE (Modern Timeline Card) ---
    if (isRiderMode) {
        return (
            <div
                className={cn(
                    "relative overflow-hidden rounded-lg border transition-all duration-300",
                    isConfirmed
                        ? "bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border-emerald-500/30 shadow-[0_2px_10px_-5px_rgba(16,185,129,0.15)]"
                        : swapRequested
                            ? "bg-gradient-to-br from-amber-950/40 to-slate-900/60 border-amber-500/30 shadow-[0_2px_10px_-5px_rgba(245,158,11,0.15)]"
                            : "bg-slate-900/60 backdrop-blur-md border-slate-800 shadow-sm"
                )}
            >
                {/* Status Stripe */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    isConfirmed ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-indigo-500"
                )} />

                <div className="p-2 pl-3">
                    {/* Header Row: Time & Duration */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="bg-slate-800/80 p-1 rounded-md text-indigo-400">
                                <Clock size={12} />
                            </div>
                            <span className="text-sm font-bold text-white tracking-tight">
                                {startTime} <span className="text-slate-600 mx-0.5">-</span> {endTime}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                            {duration}h
                        </span>
                    </div>

                    {/* Secondary Row: Moto & Status */}
                    <div className="flex items-center gap-2 mb-2">
                        {moto ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                                <Truck size={10} className="text-indigo-400" />
                                <span className="font-mono tracking-wide truncate max-w-[60px]">{moto.plate}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/30 px-1.5 py-0.5 rounded border border-slate-800">
                                <Truck size={10} />
                                <span>Sin Moto</span>
                            </div>
                        )}

                        {isConfirmed && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/50">
                                <CheckCircle size={9} />
                                <span>LISTO</span>
                            </div>
                        )}
                        {swapRequested && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/50">
                                <RefreshCw size={9} className="animate-spin-slow" />
                                <span>SOLICITADO</span>
                            </div>
                        )}
                    </div>

                    {/* Actions Row - Conditional */}
                    <div className="mt-2">
                        {!isConfirmed ? (
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
                                aria-label={isProcessing ? "Procesando confirmación" : "Confirmar Asistencia"}
                            >
                                <Check size={14} strokeWidth={3} />
                                {isProcessing ? "Procesando..." : "Confirmar Asistencia"}
                            </button>
                        ) : (
                            <button
                                onClick={handleSwapRequest}
                                disabled={isProcessing}
                                className={cn(
                                    "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all active:scale-95 border disabled:opacity-50",
                                    swapRequested
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                                        : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700"
                                )}
                                aria-label={swapRequested ? "Cancelar solicitud de cambio" : "Solicitar cambio de turno"}
                            >
                                <RefreshCw size={12} strokeWidth={2} className={swapRequested ? "animate-spin-reverse" : ""} />
                                {swapRequested ? "Cancelar Solicitud" : "Solicitar Cambio"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER FOR ADMIN MODE (Original Card) ---
    return (
        <div
            draggable={canDrag}
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
                canDrag && "active:scale-[0.98] active:cursor-grabbing"
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

            {/* Drag Handle Icon - Only on Hover (ADMIN MODE) */}
            {!readOnly && !hasConflict && !isRiderMode && (
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

            {/* Quick Actions Overlay (Glass) - ADMIN ONLY */}
            {showActions && !hasConflict && !readOnly && !isRiderMode && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-30 flex items-center justify-center gap-2 animate-in fade-in duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(e); }}
                        className="p-1.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-full shadow-md border border-slate-100 transition-all hover:scale-110"
                        title="Editar"
                        aria-label="Editar turno"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClone(event, e); }}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-full shadow-md border border-slate-100 transition-all hover:scale-110"
                        title="Duplicar"
                        aria-label="Duplicar turno"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(event.shiftId, e); }}
                        className="p-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-full shadow-md border border-slate-100 transition-all hover:scale-110"
                        title="Eliminar"
                        aria-label="Eliminar turno"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Content Container (Padded from left bar) */}
            <div className="pl-3.5 flex flex-col h-full justify-between">

                {/* Rider Info */}
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
                        {/* Time Range */}
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                {startTime} - {endTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Info: Moto & Status (Hide if RiderMode because we show actions footer) */}
                {!isRiderMode && (
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
                )}
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
