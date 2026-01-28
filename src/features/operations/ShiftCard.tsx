import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, AlertCircle, Edit2, Copy, Trash2, Move, RefreshCw, Check } from 'lucide-react';
import { getRiderColor, getShiftDuration, getRiderInitials } from '../../utils/colorPalette';
import { cn } from '../../lib/utils';
import { shiftService } from '../../services/shiftService';
import { notificationService } from '../../services/notificationService';

// Helper for native touch feedback
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30]
        };
        navigator.vibrate(patterns[style]);
    }
};

export interface MotoAssignment {
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
    isDraft?: boolean;
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
    isManagerView?: boolean;
    className?: string;
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
    isManagerView = false,
    className
}) => {
    const { riderName, riderId, visualStart, visualEnd, motoAssignments, startAt, endAt, isConfirmed: propConfirmed } = event;
    // Check if shift is currently active
    const now = new Date();
    const isCurrent = now >= new Date(startAt) && now <= new Date(endAt);

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

    // Color-Coding Logic (Agenda 2.0)
    const startHour = new Date(visualStart).getHours();
    const isMidday = startHour >= 12 && startHour < 18; // 12:00 - 18:00
    const isNight = startHour >= 20 || startHour < 5;   // 20:00 - 05:00

    // Priority: Night (Red) > Midday (Blue) > Default (Indigo)
    let themeLabel = "Mañana";
    let ringClass = "ring-indigo-500/10";

    if (isMidday) {
        themeLabel = "Mediodía";
        ringClass = "ring-blue-500/10";
    } else if (isNight) {
        themeLabel = "Noche";
        ringClass = "ring-rose-500/10";
    }

    if (isCurrent) ringClass = "ring-2 ring-white/20";
    // Change Request accent
    if (changeRequested) ringClass = "ring-1 ring-amber-500/30";
    // Confirmed accent
    if (isConfirmed) ringClass = "ring-1 ring-emerald-500/30";

    // Get rider color
    const riderColor = getRiderColor(riderId || '');

    // Calculate duration
    const duration = getShiftDuration(startAt, endAt);

    // Formatting times
    const startTime = new Date(visualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(visualEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(event));

        // Create ghost image for a more professional feel
        const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px'; // Offscreen
        ghost.style.opacity = '1';
        ghost.style.transform = 'scale(1.05) rotate(2deg)';
        ghost.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
        ghost.style.width = `${e.currentTarget.offsetWidth}px`;
        ghost.style.height = `${e.currentTarget.offsetHeight}px`;
        document.body.appendChild(ghost);

        // Center the drag image on mouse
        e.dataTransfer.setDragImage(ghost, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);

        // Cleanup ghost after the drag has started
        setTimeout(() => {
            document.body.removeChild(ghost);
            setIsDragging(true); // Now we hide the original
        }, 0);

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
        triggerHaptic('medium');
        const nextState = !isConfirmed;
        setLocalConfirmed(nextState); // Optimistic

        // Debugging logs
        console.log('[ShiftCard] Attempting to confirm shift:', {
            shiftId: event.shiftId,
            riderId: event.riderId,
            isConfirmed,
            nextState
        });

        try {
            await shiftService.confirmShift(event.shiftId);
            console.log('[ShiftCard] Shift confirmed successfully');
        } catch (err) {
            console.error('[ShiftCard] Error confirming shift:', err);
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
        triggerHaptic('light');
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
                            message: `El rider ${riderName} solicita cambio para el turno del ${new window.Date(event.startAt).toLocaleDateString()}. Motivo: ${reason || 'N/A'}`,
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
                "group relative px-3 py-3 sm:px-4 sm:py-4 rounded-[32px] transition-all duration-500 overflow-hidden select-none mb-3",
                // Base state
                isDragging ? 'opacity-40 cursor-grabbing scale-95 ring-2 ring-indigo-400 ring-offset-2' : 'cursor-grab',
                // Priority States (Admin & Common)
                hasConflict
                    ? 'bg-red-50/90 border border-red-200 shadow-sm'
                    : changeRequested
                        ? 'bg-amber-50/90 border border-amber-200 shadow-sm'
                        : !isRiderMode && isConfirmed
                            ? 'bg-emerald-50/40 border-emerald-100/80 shadow-sm'
                            : isRiderMode
                                ? cn("bg-[#1c1c1e] shadow-2xl shadow-black/60", ringClass)
                                : cn(
                                    "bg-white border text-left",
                                    "border-slate-200/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]",
                                    "hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 hover:border-indigo-200/50"
                                ),
                canDrag && "touch-feedback-subtle active:cursor-grabbing",
                isExpanded && isRiderMode && "ring-1 ring-white/20",
                className
            )}
            style={style}
            onClick={onClick}
            onContextMenu={handleRightClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {isRiderMode ? (
                // --- ULTRA-PREMIUM RIDER CONTENT (AGENDA 2.0) ---
                <div className="flex flex-col gap-3.5">

                    {/* ROW 1: HEADER (Visual Theme Indicators) */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2.5">
                            {/* THE "CUADRITO" (Square Indicator) */}
                            <div className={cn(
                                "w-4 h-4 rounded-md shadow-lg shrink-0 flex items-center justify-center transition-all duration-300",
                                changeRequested ? "bg-amber-500 shadow-amber-500/40" :
                                    isNight ? "bg-rose-500 shadow-rose-500/40" :
                                        isMidday ? "bg-blue-500 shadow-blue-500/40" :
                                            "bg-indigo-500 shadow-indigo-500/40"
                            )}>
                                {isConfirmed && <Check size={10} strokeWidth={4} className="text-white" />}
                            </div>

                            {/* Status Pill */}
                            {isConfirmed ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Confirmado</span>
                                </div>
                            ) : changeRequested ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tight">Cambio Solicitado</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{themeLabel}</span>
                                </div>
                            )}

                            {isCurrent && (
                                <div className="px-2 py-0.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Ahora</span>
                                </div>
                            )}
                        </div>

                        {/* MANAGER VIEW EXTRA: Rider Name Badge */}
                        {isManagerView && (
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 ml-auto mr-1 max-w-[50%]">
                                <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0", riderColor.bg || 'bg-slate-500', riderColor.text)}>
                                    {getRiderInitials(riderName)}
                                </div>
                                <span className="text-[9px] font-bold text-zinc-300 truncate">{riderName}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {moto && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                    <Truck size={10} className={cn("text-white/40", isCurrent && (isConfirmed ? "text-emerald-400" : "text-white"))} />
                                    <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-tighter">{moto.plate}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ROW 2: PAYLOAD (Time focus) */}
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col gap-1 w-full mr-3">
                            {/* Time Text */}
                            <div className="flex items-baseline gap-1.5 sm:gap-2">
                                <span className="text-xl sm:text-3xl font-light text-white tracking-tighter">{startTime}</span>
                                <span className="text-zinc-700 text-lg sm:text-xl font-thin">—</span>
                                <span className="text-lg sm:text-2xl font-light text-zinc-500 tracking-tighter">{endTime}</span>
                            </div>

                            {/* Visual Timeline Bar */}
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full relative overflow-hidden mt-0.5">
                                {/* Track Markers (Optional, e.g. every 3h) */}
                                <div className="absolute left-[33%] top-0 bottom-0 w-[1px] bg-zinc-700/50" />
                                <div className="absolute left-[66%] top-0 bottom-0 w-[1px] bg-zinc-700/50" />

                                {/* The Shift Bar */}
                                {(() => {
                                    // Calculate position relative to 12:00 - 01:00 (13h window)
                                    // Start: 12:00 (0%), End: 01:00 (100%)
                                    const baseHour = 12;
                                    const totalWindowHours = 13;

                                    const s = new Date(visualStart);
                                    const e = new Date(visualEnd);

                                    let startH = s.getHours() + (s.getMinutes() / 60);
                                    let endH = e.getHours() + (e.getMinutes() / 60);

                                    // Adjust for hours after midnight (e.g. 00:30 becomes 24.5)
                                    if (startH < 12) startH += 24;
                                    if (endH < 12) endH += 24;
                                    if (endH < startH) endH += 24; // Handle wrap around just in case

                                    const startPct = Math.max(0, Math.min(100, ((startH - baseHour) / totalWindowHours) * 100));
                                    const widthPct = Math.max(5, Math.min(100, ((endH - startH) / totalWindowHours) * 100));

                                    return (
                                        <div
                                            className={cn(
                                                "absolute top-0 bottom-0 rounded-full bg-gradient-to-r",
                                                isConfirmed ? "from-emerald-500 to-emerald-400" :
                                                    changeRequested ? "from-amber-500 to-amber-400" :
                                                        isNight ? "from-rose-500 to-rose-400" : "from-indigo-500 to-blue-400"
                                            )}
                                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                                        />
                                    );
                                })()}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{duration}H</span>
                                {isConfirmed && <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-tighter uppercase">OK</div>}
                            </div>
                        </div>

                        {/* Actions Right (Apple Style Buttons) */}
                        <div className="flex items-center gap-2.5">
                            {!isConfirmed && (
                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={handleRequestChange}
                                    disabled={isProcessing}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border",
                                        changeRequested
                                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                            : "bg-zinc-800/80 border-white/5 text-zinc-500"
                                    )}
                                    title="Solicitar cambio"
                                >
                                    <RefreshCw size={20} className={cn(changeRequested && "animate-spin-slow")} />
                                </motion.button>
                            )}

                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={handleConfirm}
                                disabled={isProcessing || isConfirmed}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border",
                                    isConfirmed
                                        ? "bg-emerald-500 border-none text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                )}
                                title={isConfirmed ? "Confirmado" : "Confirmar turno"}
                            >
                                <Check size={24} strokeWidth={isConfirmed ? 3 : 2} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            ) : (
                // --- ADMIN/STANDARD CONTENT (Modern Pill Layout) ---
                <div className="relative h-full">
                    {/* Left Color Indicator Pill */}
                    <div className={cn(
                        "absolute left-1.5 top-1.5 bottom-1.5 w-1 rounded-full opacity-80",
                        hasConflict ? "bg-red-500" : (riderColor.bg || 'bg-slate-400')
                    )} />

                    {/* Quick Actions Overlay (Glass) */}
                    {showActions && !hasConflict && !readOnly && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-30 flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
                            <button
                                onClick={(e) => { e.stopPropagation(); onClick(e); }}
                                className="p-1.5 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-full shadow-sm border border-slate-100 transition-all hover:scale-110"
                                title="Editar"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClone(event, e); }}
                                className="p-1.5 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-full shadow-sm border border-slate-100 transition-all hover:scale-110"
                                title="Duplicar"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(event.shiftId, e); }}
                                className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full shadow-sm border border-slate-100 transition-all hover:scale-110"
                                title="Eliminar"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Admin Content Container */}
                    <div className="pl-3.5 flex flex-col items-start justify-center h-full gap-0.5">
                        {/* Header: Rider Name + Status Badge */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0",
                                    riderColor.bg || 'bg-slate-100',
                                    riderColor.text || 'text-slate-500'
                                )}>
                                    {getRiderInitials(riderName)}
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 truncate">{riderName}</span>
                            </div>

                            {/* Status and info layout */}
                            <div className="flex items-center gap-1.5">
                                {isConfirmed && !changeRequested && (
                                    <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8px] font-black tracking-tighter uppercase">
                                        Confirmado
                                    </div>
                                )}
                                {changeRequested && (
                                    <div className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-700 text-[8px] font-black tracking-tighter uppercase animate-pulse">
                                        Modificación
                                    </div>
                                )}
                                <div className={cn(
                                    "text-[9px] font-bold px-1 rounded-md",
                                    hasConflict ? "text-red-600 bg-red-100" : "text-slate-400 bg-slate-50"
                                )}>
                                    {duration}h
                                </div>
                            </div>
                        </div>

                        {/* Footer: Time + Moto */}
                        <div className="flex items-center justify-between w-full pl-[22px]">
                            <span className="text-[10px] font-medium text-slate-500 tracking-tight">
                                {startTime} - {endTime}
                            </span>

                            {moto && (
                                <div className="flex items-center gap-1 opacity-70" title={`Moto: ${moto.plate}`}>
                                    <Truck className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="text-[9px] font-mono text-slate-400">{moto.plate}</span>
                                </div>
                            )}
                        </div>

                        {/* Conflict/Status Text Overlays */}
                        {hasConflict && (
                            <div className="absolute inset-x-0 bottom-0 bg-red-50/90 text-[8px] font-bold text-red-500 text-center border-t border-red-100 py-0.5">
                                CONFLICTO
                            </div>
                        )}
                        {changeRequested && !hasConflict && (
                            <div className="absolute inset-x-0 bottom-0 bg-amber-500/10 text-[7px] font-black text-amber-600 text-center border-t border-amber-200/50 py-0.2 uppercase tracking-widest">
                                Rider solicita cambio
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* Drag Handle Icon - Only on Hover (ADMIN MODE & NO CONFLICT) */}
            {
                !readOnly && !hasConflict && !isRiderMode && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Move className="w-3 h-3 text-slate-400/70" />
                    </div>
                )
            }

            {/* Conflict Warning Badge (Admin Top Right) */}
            {
                hasConflict && !isRiderMode && (
                    <div className="absolute -top-1 -right-1 bg-red-100 ring-2 ring-white rounded-full p-0.5 shadow-sm animate-pulse z-20">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                    </div>
                )
            }
        </div >
    );
};

export default ShiftCard;
