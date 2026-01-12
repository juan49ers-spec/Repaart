import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Zap } from 'lucide-react';

interface SlideToWorkProps {
    onComplete: () => void;
    label?: string;
    disabled?: boolean;
}

export const SlideToWork: React.FC<SlideToWorkProps> = ({
    onComplete,
    label = "Desliza para Iniciar",
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [completed, setCompleted] = useState(false);

    const handleStart = (_e: React.MouseEvent | React.TouchEvent) => {
        if (disabled || completed) return;
        setIsDragging(true);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !containerRef.current || completed) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const x = clientX - containerRect.left - 30; // 30 is half width of handle

        const maxPos = containerRect.width - 64; // handle width (60) + padding (4)
        const newPos = Math.max(0, Math.min(x, maxPos));

        setPosition(newPos);

        if (newPos >= maxPos * 0.95) {
            setCompleted(true);
            setIsDragging(false);
            setPosition(maxPos);
            onComplete();
        }
    };

    const handleEnd = () => {
        if (completed) return;
        setIsDragging(false);
        if (position < (containerRef.current?.getBoundingClientRect().width || 0) * 0.9) {
            setPosition(0);
        }
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className={`
                relative h-20 w-full rounded-full p-1.5 transition-all duration-500 overflow-hidden
                ${completed
                    ? 'bg-emerald-500 neon-glow-emerald'
                    : disabled
                        ? 'bg-slate-900/40 opacity-50 gray-scale'
                        : 'bg-slate-900/60 border border-white/10'}
            `}
        >
            {/* Background Track Text */}
            <div className={`
                absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300
                ${completed || isDragging ? 'opacity-0' : 'opacity-40'}
            `}>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
                    {label}
                </span>
            </div>

            {/* Glowing Path */}
            <div
                className="absolute left-1.5 top-1.5 bottom-1.5 bg-emerald-500/20 rounded-full transition-all duration-100"
                style={{ width: `${position + 60}px` }}
            />

            {/* Handle */}
            <div
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                className={`
                    absolute top-1.5 bottom-1.5 w-16 rounded-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing select-none
                    ${completed
                        ? 'bg-white text-emerald-600'
                        : 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'}
                `}
                style={{ transform: `translateX(${position}px)` }}
            >
                {completed ? (
                    <Zap size={24} className="fill-current animate-pulse" />
                ) : (
                    <ChevronRight size={28} strokeWidth={3} className={isDragging ? 'animate-pulse' : ''} />
                )}
            </div>

            {/* Completion Success Text */}
            {completed && (
                <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-500">
                    <span className="text-xl font-black text-white uppercase tracking-[0.2em] italic">
                        SYSTEM CONNECTED
                    </span>
                </div>
            )}
        </div>
    );
};
