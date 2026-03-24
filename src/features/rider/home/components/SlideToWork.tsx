import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, CheckCircle2, Flame } from 'lucide-react';
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
            setCelebrationPhase(0);
        } else {
            // Trigger completion
            setCompleted(true);
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
                        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-emerald-500 rounded-full animate-ping" {...({ style: { animationDelay: '0s' } })} />
                        <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-indigo-500 rounded-full animate-ping" {...({ style: { animationDelay: '0.1s' } })} />
                        <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-purple-500 rounded-full animate-ping" {...({ style: { animationDelay: '0.2s' } })} />
                        <div className="absolute bottom-1/3 right-1/3 w-10 h-10 bg-rose-500 rounded-full animate-ping" {...({ style: { animationDelay: '0.3s' } })} />
                    </>
                )}
            </div>

            <div
                ref={containerRef}
                className={cn(
                    "relative h-20 w-full rounded-full overflow-hidden transition-all duration-500 shadow-inner",
                    completed
                        ? "bg-cyan-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                        : disabled
                            ? "bg-slate-100 opacity-50"
                            : "bg-slate-100 border border-slate-200"
                )}
            >
                {/* Animated Background Gradient */}
                {!completed && !disabled && (
                    <div className="absolute inset-0 opacity-10">
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 transition-all duration-500",
                            isDragging && "from-cyan-500/20 via-cyan-500/50 to-cyan-500/20"
                        )} />
                    </div>
                )}

                {/* Track Background Text */}
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
                    completed || isDragging ? "opacity-0" : "opacity-100"
                )}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            {label}
                        </span>
                    </div>
                </div>

                {/* Glowing Track Path */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 right-3 h-[calc(100%-6px)] bg-transparent rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cyan-100/50 transition-all duration-100 ease-out rounded-full"
                        {...({ style: { width: `${Math.max(4, position + 32)}px` } })}
                    />
                </div>

                {/* Premium Handle */}
                <div
                    ref={handleRef}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing select-none touch-target-lg",
                        completed
                            ? "left-2 bg-white shadow-sm"
                            : "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-slate-100"
                    )}
                    {...({ style: { transform: `translateX(${position ? position + 4 : 4}px)` } })}
                >
                    {completed ? (
                        <div className="relative">
                            <CheckCircle2 size={24} className="text-cyan-500 animate-in zoom-in-95" strokeWidth={3} />
                        </div>
                    ) : (
                        <>
                            <ChevronRight 
                                size={28} 
                                strokeWidth={3}
                                className={cn(
                                    "text-cyan-500 transition-all duration-100",
                                    isDragging && "animate-pulse"
                                )}
                            />
                            {/* Glow Ring */}
                            <div className={cn(
                                "absolute inset-0 rounded-full transition-all duration-300",
                                isDragging 
                                    ? "bg-cyan-500/10 animate-ping scale-110" 
                                    : "bg-cyan-500/0"
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
                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                <CheckCircle2 size={48} className="text-white animate-in zoom-in-95 mb-3" />
                                <span className="text-2xl font-black text-white uppercase tracking-widest">
                                    SISTEMA CONECTADO
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlideToWork;
