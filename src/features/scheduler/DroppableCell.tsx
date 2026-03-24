import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

interface DroppableCellProps {
    dateIso: string;
    riderId: string;
    children?: React.ReactNode;
    onQuickAdd: (hour: number) => void;
    onDoubleClick: () => void;
    onClick?: (e: React.MouseEvent) => void;
    isToday: boolean;
    className?: string;
    activeDragShift?: { startAt: string | Date; endAt: string | Date; [key: string]: unknown };
    hour?: number;
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
    dateIso,
    riderId,
    children,
    onQuickAdd,
    onDoubleClick,
    onClick,
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
            top: '8%',
            bottom: '8%',
            zIndex: 5
        };
    }

    return (
        <div
            ref={setNodeRef}
            onDoubleClick={onDoubleClick}
            onClick={(e) => {
                // Allow "Tap to Create" on empty cells if no active drag
                if (!activeDragShift && onClick) {
                    onClick(e);
                }
            }}
            className={cn(
                "relative h-full transition-all duration-300 border-r border-slate-100 dark:border-slate-800/80 group/cell touch-manipulation",
                isToday && "bg-slate-50/50 dark:bg-slate-800/20",
                isOver ? "bg-indigo-50/40 dark:bg-indigo-900/20" : "bg-transparent",
                className
            )}
        >
            {/* Visual feedback for empty cell hover / Touch */}
            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover/cell:opacity-100 pointer-events-none transition-opacity z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); onQuickAdd(13); }}
                    className="w-5 h-5 flex items-center justify-center pointer-events-auto bg-amber-100 hover:bg-amber-200 text-amber-600 rounded-full shadow-sm transform md:scale-0 md:group-hover/cell:scale-100 transition-all active:scale-95 border border-amber-200"
                    title="Añadir Mediodía (13h-17h)"
                >
                    <Sun size={10} strokeWidth={3} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onQuickAdd(21); }}
                    className="w-5 h-5 flex items-center justify-center pointer-events-auto bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-full shadow-sm transform md:scale-0 md:group-hover/cell:scale-100 transition-all active:scale-95 border border-indigo-200"
                    title="Añadir Noche (21h-01h)"
                >
                    <Moon size={10} strokeWidth={3} />
                </button>
            </div>

            {/* Ghost Shift (Holo-Snap Preview) */}
            {isOver && activeDragShift && (
                <div
                    className="rounded-md ring-2 ring-indigo-400 dark:ring-indigo-500 bg-indigo-100/50 dark:bg-indigo-900/50 backdrop-blur-sm pointer-events-none transition-all duration-150 ease-out z-50 flex items-center justify-center opacity-100 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    {...({ style: ghostStyle })}
                />
            )}

            {children}
        </div>
    );
};

