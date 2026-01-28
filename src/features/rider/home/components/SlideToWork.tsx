import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Zap, CheckCircle2, Flame } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface SlideToWorkProps {
    onComplete: () => void;
    label?: string;
    disabled?: boolean;
}

const SlideToWork: React.FC<SlideToWorkProps> = ({
    onComplete,
    label = "Desliza para iniciar",
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [celebrationPhase, setCelebrationPhase] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    // Haptic vibration effect
    useEffect(() => {
        if (isDragging && 'vibrate' in navigator) {
            const interval = setInterval(() => {
                navigator.vibrate(10);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [isDragging]);

    const handleStart = (_e: React.MouseEvent | React.TouchEvent) => {
        if (disabled || completed) return;
        setIsDragging(true);
        setCelebrationPhase(0);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !containerRef.current || completed) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const x = clientX - containerRect.left - 32; // 32 is half of handle width

        const maxPos = containerRect.width - 64; // handle width (60) + padding (4)
        const newPos = Math.max(0, Math.min(x, maxPos));

        setPosition(newPos);
        setProgress((newPos / maxPos) * 100);

        // Visual haptic feedback
        if (newPos >= maxPos * 0.9) {
            setCelebrationPhase(1);
        }
    };

    const handleEnd = () => {
        if (completed) return;
        setIsDragging(false);
        if (position < (containerRef.current?.getBoundingClientRect().width || 0) * 0.9) {
            setPosition(0);
            setProgress(0);
            setCelebrationPhase(0);
        } else {
            // Trigger completion
            setCompleted(true);
            setProgress(100);
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

    // Completion animation
    useEffect(() => {
        if (completed && celebrationPhase === 1) {
            const timer = setTimeout(() => {
                setCelebrationPhase(2);
            }, 200);
            const timer2 = setTimeout(() => {
                setCelebrationPhase(3);
                onComplete();
            }, 600);
            return () => {
                clearTimeout(timer);
                clearTimeout(timer2);
            };
        }
    }, [completed, celebrationPhase, onComplete]);

    return (
        <div className="relative w-full">
            {/* Particles Effect Background */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                {celebrationPhase >= 2 && (
                    <>
                        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-emerald-500 rounded-full animate-ping" style={{ animationDelay: '0s' }} />
                        <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-indigo-500 rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
                        <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                        <div className="absolute bottom-1/3 right-1/3 w-10 h-10 bg-rose-500 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                    </>
                )}
            </div>

            <div
                ref={containerRef}
                className={cn(
                    "relative h-28 w-full rounded-[2rem] overflow-hidden transition-all duration-500",
                    completed
                        ? "bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.5)]"
                        : disabled
                            ? "bg-slate-900/20 opacity-50"
                            : "bg-slate-900/60 border-2 border-slate-700/50"
                )}
            >
                {/* Animated Background Gradient */}
                {!completed && !disabled && (
                    <div className="absolute inset-0 opacity-30">
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 transition-all duration-500",
                            isDragging && "from-emerald-500/20 via-emerald-500/50 to-emerald-500/20"
                        )} />
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 transition-all duration-500",
                            progress > 50 && "from-indigo-500/20 via-indigo-500/40 to-indigo-500/20"
                        )} />
                    </div>
                )}

                {/* Track Background Text */}
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
                    completed || isDragging ? "opacity-0" : "opacity-100"
                )}>
                    <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={20} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                COCKPIT
                            </span>
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            {label}
                        </span>
                    </div>
                </div>

                {/* Glowing Track Path */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 right-4 h-1 bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 transition-all duration-100 ease-out rounded-full"
                        style={{ width: `${Math.max(4, position + 32)}px` }}
                    />
                </div>

                {/* Premium Handle */}
                <div
                    ref={handleRef}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing select-none touch-target-lg",
                        completed
                            ? "left-4 bg-white shadow-lg"
                            : "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                    )}
                    style={{ transform: `translateX(${position}px)` }}
                >
                    {completed ? (
                        <div className="relative">
                            <CheckCircle2 size={28} className="text-emerald-500 animate-in zoom-in-95" />
                            <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping" />
                        </div>
                    ) : (
                        <>
                            <ChevronRight 
                                size={32} 
                                strokeWidth={3}
                                className={cn(
                                    "text-white transition-all duration-100",
                                    isDragging && "animate-pulse"
                                )}
                            />
                            {/* Glow Ring */}
                            <div className={cn(
                                "absolute inset-0 rounded-full transition-all duration-300",
                                isDragging 
                                    ? "bg-emerald-500/30 animate-ping scale-110" 
                                    : "bg-emerald-500/20"
                            )} />
                        </>
                    )}
                </div>

                {/* Completion Celebration Text */}
                {completed && celebrationPhase >= 2 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-95">
                        {celebrationPhase === 2 && (
                            <div className="text-center">
                                <Flame size={40} className="text-white animate-pulse mb-3" />
                                <span className="text-3xl font-black text-white uppercase tracking-widest">
                                    ¡TURNO INICIADO!
                                </span>
                                <p className="text-lg font-medium text-white/90 mt-2">
                                    Buen servicio
                                </p>
                            </div>
                        )}
                        {celebrationPhase === 3 && (
                            <div className="text-center">
                                <CheckCircle2 size={48} className="text-white animate-in zoom-in-95 mb-3" />
                                <span className="text-2xl font-black text-white uppercase tracking-widest">
                                    SISTEMA CONECTADO
                                </span>
                                <div className="flex items-center gap-2 mt-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/20">
                                    <Zap size={20} className="text-emerald-400" />
                                    <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">
                                        COCKPIT V4
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlideToWork;
