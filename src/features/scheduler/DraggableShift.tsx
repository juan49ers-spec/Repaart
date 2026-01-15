import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { differenceInMinutes } from 'date-fns';

interface DraggableShiftProps {
    shift: any;
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

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 999 : undefined,
    };

    const sStart = new Date(shift.startAt);
    const sEnd = new Date(shift.endAt);
    const duration = differenceInMinutes(sEnd, sStart) / 60;

    // Determine Phase: Night if starts >= 20:00
    const startHour = sStart.getHours();
    const isNight = startHour >= 20;

    // Status Logic
    const isConfirmed = shift.isConfirmed;
    const isChangeRequested = shift.changeRequested;
    const isDraft = shift.isDraft;

    // Base Styles
    let bgClass = "";
    if (isDraft) {
        bgClass = "bg-white/90 border-2 border-slate-300 text-slate-700 border-dashed backdrop-blur-none";
    } else if (isChangeRequested) {
        bgClass = "bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-300/50 shadow-amber-500/20 animate-zigzag scale-[1.02] shadow-lg z-20";
    } else if (isNight) {
        bgClass = "bg-gradient-to-r from-rose-600 to-rose-500 border border-rose-500/50 shadow-rose-500/20"; // Night = Red
    } else {
        bgClass = "bg-gradient-to-r from-sky-500 to-sky-400 border border-sky-400/50 shadow-sky-500/20"; // Day = Blue
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onContextMenu={onContextMenu}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className={cn(
                "relative h-7 rounded-md text-[10px] font-bold text-white flex items-center shadow-sm transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing hover:shadow-lg select-none backdrop-blur-sm ring-1 ring-black/5",
                bgClass,
                isConfirmed && !isDraft && !isChangeRequested ? "pl-1" : "px-2.5", // Adjustment for the border indicator
                isDragging ? "opacity-90 scale-105 shadow-2xl rotate-2 z-50 pointer-events-none ring-2 ring-indigo-500/50" : ""
            )}
        >
            {/* Accepted Indicator (Green Piece) */}
            {isConfirmed && !isDraft && !isChangeRequested && (
                <div className="h-full w-5 bg-emerald-500 rounded-l-md mr-1.5 shadow-sm border-r border-black/10 flex items-center justify-center relative -ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
            )}

            <div className="flex justify-between w-full items-center pointer-events-none relative z-10">
                <div className="flex items-center gap-1.5">
                    {/* Optional Icon could go here, but keeping it clean for now */}
                    <span className="tracking-tight font-mono opacity-90">{format(sStart, 'HH:mm')}</span>
                </div>

                {duration > 1.5 && <span className="opacity-40 mx-1 w-px h-3 bg-current" />}

                {duration > 1.5 && (
                    <div className="flex items-center gap-1.5">
                        <span className="tracking-tight font-mono opacity-90">{format(sEnd, 'HH:mm')}</span>
                    </div>
                )}
            </div>

            {/* Glossy overlay for pro feel */}
            {!shift.isDraft && <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />}
        </div>
    );
};
