import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { differenceInMinutes } from 'date-fns';
import { Shift } from '../../schemas/scheduler';

interface DraggableShiftProps {
    shift: Shift;
    gridId: string;
    onContextMenu?: (e: React.MouseEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
    isOverlay?: boolean;
}

export const DraggableShift: React.FC<DraggableShiftProps> = ({
    shift,
    gridId,
    onContextMenu,
    onClick,
    onDoubleClick,
    isOverlay
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging: isDraggableDragging } = useDraggable({
        id: gridId,
        data: { shift }
    });

    const isDragging = isDraggableDragging || isOverlay;
    const isGhost = isDraggableDragging && !isOverlay;

    const style = {
        transform: isGhost ? undefined : CSS.Translate.toString(transform),
        zIndex: isDragging ? 999 : undefined,
    };

    const sStart = new Date(shift.startAt);
    const sEnd = new Date(shift.endAt);
    const duration = differenceInMinutes(sEnd, sStart) / 60;

    const startHour = sStart.getHours();
    const isMidday = startHour >= 12 && startHour < 20;
    const isNight = startHour >= 20;

    // Status Logic
    const isConfirmed = shift.isConfirmed;
    const isChangeRequested = shift.changeRequested;
    const isDraft = shift.isDraft;

    // Premium Linear/Vercel inspired styles
    let bgClass = "";
    if (isDraft) {
        bgClass = "bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 shadow-sm";
    } else if (isChangeRequested) {
        bgClass = "bg-gradient-to-br from-orange-500/90 to-amber-600/90 backdrop-blur-xl border-t border-white/20 shadow-md text-white ring-1 ring-inset ring-white/10 dark:ring-white/5";
    } else if (isNight) {
        // Noche: Rojo (Request del usuario)
        bgClass = "bg-gradient-to-br from-rose-500/90 to-red-600/90 backdrop-blur-xl border-t border-white/20 shadow-md text-white ring-1 ring-inset ring-white/10 dark:ring-white/5";
    } else if (isMidday) {
        // Mediodía: Azul intenso (Request del usuario)
        bgClass = "bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-xl border-t border-white/20 shadow-md text-white ring-1 ring-inset ring-white/10";
    } else {
        // Mañana (Mantiene su color claro o pastel)
        bgClass = "bg-gradient-to-br from-sky-400/90 to-cyan-500/90 backdrop-blur-xl border-t border-white/30 shadow-md text-sky-950 ring-1 ring-inset ring-white/20";
    }

    return (
        <div
            ref={setNodeRef}
            {...({ style })}
            {...listeners}
            {...attributes}
            onContextMenu={onContextMenu}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className={cn(
                "relative h-full rounded-md text-[11px] font-semibold flex items-center px-2 select-none cursor-grab active:cursor-grabbing hover:brightness-110 transition-all overflow-hidden",
                bgClass,
                isGhost ? "opacity-30 grayscale-[0.5]" : "",
                isOverlay ? "opacity-100 scale-105 shadow-2xl z-[1000] pointer-events-none min-w-[180px]" : "",
                isConfirmed && !isDraft && "ring-2 ring-emerald-400 dark:ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
            )}
        >
            {/* Elegant Barber-pole for Drafts */}
            {isDraft && (
                 <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply dark:mix-blend-screen bg-barber-pole" />
            )}

            {/* Subtle Accepted Glow Line */}
            {isConfirmed && !isDraft && !isChangeRequested && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] z-20" />
            )}

            {/* Change Requested Label Overlay */}
            {isChangeRequested && (
                <div className="absolute top-0 right-0 bg-red-600/90 text-[9px] px-1.5 py-0.5 rounded-bl tracking-wider font-extrabold uppercase shadow-sm border-l border-b border-white/20">
                    Cambio
                </div>
            )}

            <div className="flex justify-between w-full items-center pointer-events-none relative z-10 pl-1.5">
                <div className="flex items-center gap-1.5 drop-shadow-sm font-bold tracking-tight">
                    {isConfirmed && !isDraft && !isChangeRequested && (
                        <CheckIcon />
                    )}
                    <span>{format(sStart, 'HH:mm')}</span>
                </div>

                {duration > 1.2 && <span className="opacity-40 mx-2 w-[3px] h-[3px] rounded-full bg-current" />}

                {duration > 1.2 && (
                    <div className="flex items-center gap-1.5 drop-shadow-sm font-bold tracking-tight">
                        <span>{format(sEnd, 'HH:mm')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300 drop-shadow-sm">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

