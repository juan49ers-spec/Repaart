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
        // If it's the ghost (original item in grid), don't transform it.
        // The DragOverlay will handle the moving visual.
        transform: isGhost ? undefined : CSS.Translate.toString(transform),
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
        bgClass = "bg-white border-2 border-slate-300 text-slate-700 border-dashed";
    } else if (isChangeRequested) {
        bgClass = "bg-amber-500 border border-amber-600 text-white z-20";
    } else if (isNight) {
        bgClass = "bg-rose-600 border border-rose-700 text-white"; // Night = Red
    } else {
        bgClass = "bg-sky-600 border border-sky-700 text-white"; // Day = Blue
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
                "relative h-full rounded text-[11px] font-semibold flex items-center px-2 select-none cursor-grab active:cursor-grabbing hover:brightness-110 transition-all",
                isConfirmed && !isDraft && !isChangeRequested && "pl-7",
                bgClass,
                isGhost ? "opacity-30 scale-100 rotate-0 grayscale-[0.5] border-dashed" : "",
                isOverlay ? "opacity-100 scale-105 shadow-xl z-[1000] pointer-events-none w-[180px] min-w-[180px]" : ""
            )}
        >
            {/* Accepted Indicator (Green Piece) - Flat */}
            {isConfirmed && !isDraft && !isChangeRequested && (
                <div className="absolute left-0 top-0 bottom-0 w-5 bg-emerald-600 rounded-l flex items-center justify-center z-20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
            )}

            <div className="flex justify-between w-full items-center pointer-events-none relative z-10">
                <div className="flex items-center gap-1.5">
                    <span className="tracking-tight font-medium leading-none">{format(sStart, 'HH:mm')}</span>
                </div>

                {duration > 1.5 && <span className="opacity-40 mx-1 w-px h-3 bg-current" />}

                {duration > 1.5 && (
                    <div className="flex items-center gap-1.5">
                        <span className="tracking-tight font-medium leading-none">{format(sEnd, 'HH:mm')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
