import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

interface DroppableCellProps {
    dateIso: string;
    riderId: string;
    children?: React.ReactNode;
    onQuickAdd: () => void;
    onDoubleClick: () => void;
    isToday: boolean;
    className?: string;
    activeDragShift?: any;
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
    dateIso,
    riderId,
    children,
    onQuickAdd,
    onDoubleClick,
    isToday,
    className,
    activeDragShift
}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `cell-${riderId}-${dateIso}`,
        data: { dateIso, riderId }
    });

    // Calculate Ghost Width (Snap Preview)
    let ghostStyle: React.CSSProperties = {};
    if (isOver && activeDragShift) {
        const start = new Date(activeDragShift.startAt);
        const end = new Date(activeDragShift.endAt);
        const durationMin = (end.getTime() - start.getTime()) / 60000;
        const widthPct = (durationMin / 1440) * 100;

        // Ghost appears at the same time visual offset as the original shift
        const sHours = start.getHours();
        const sMinutes = start.getMinutes();
        const startMin = sHours * 60 + sMinutes;
        const leftPct = (startMin / 1440) * 100;

        ghostStyle = {
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            position: 'absolute',
            top: '10%',
            bottom: '10%',
            zIndex: 5
        };
    }

    return (
        <div
            ref={setNodeRef}
            onClick={onQuickAdd}
            onDoubleClick={onDoubleClick}
            className={cn(
                "relative h-full transition-colors border-r border-slate-100 dark:border-slate-800",
                isToday && "bg-slate-50/30",
                isOver ? "bg-indigo-50/50 dark:bg-indigo-900/20" : "bg-transparent",
                className
            )}
        >
            {/* Visual feedback for empty cell hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-10 pointer-events-none transition-opacity">
                {/* Optional subtle hover effect if desired, currently hidden via opacity logic or can be implemented here */}
            </div>

            {/* Ghost Shift */}
            {isOver && activeDragShift && (
                <div
                    className="rounded-md bg-indigo-500/30 border-2 border-indigo-400/50 border-dashed backdrop-blur-sm shadow-sm pointer-events-none animate-pulse"
                    style={ghostStyle}
                />
            )}

            {children}
        </div>
    );
};
