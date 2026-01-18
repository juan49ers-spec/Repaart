import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAcademyStore } from '../store/academyStore';
import { Maximize2 } from 'lucide-react';

// Safe Player Type for TS
const RP = ReactPlayer as unknown as React.ComponentType<any>;

interface CinemaPlayerProps {
    url: string;
    title?: string;
    thumbnail?: string;
    chapters?: { time: number; label: string }[];
}

export const CinemaPlayer = ({ url, thumbnail, chapters = [] }: CinemaPlayerProps) => {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '-100px 0px 0px 0px'
    });

    const { setPlayerFloating, seekTarget, setSeekTarget, setCurrentTime, currentTime } = useAcademyStore();
    const playerRef = useRef<any>(null);
    const [isFloating, setIsFloating] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Sync floating state global
    useEffect(() => {
        setIsFloating(!inView && isReady);
        setPlayerFloating(!inView && isReady);
    }, [inView, isReady, setPlayerFloating]);

    // Handle Time Hops
    useEffect(() => {
        if (seekTarget !== null && playerRef.current) {
            playerRef.current.seekTo(seekTarget, 'seconds');
            setSeekTarget(null);
        }
    }, [seekTarget, setSeekTarget]);

    const activeChapterIndex = chapters.reduce((prev, curr, idx) => {
        return currentTime >= curr.time ? idx : prev;
    }, -1);

    const handleChapterClick = (time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time, 'seconds');
            setCurrentTime(time);
        }
    };

    return (
        <div className="relative w-full mb-16 select-none group" ref={ref}>
            {/* AMBILIGHT GLOW (Hero Only) */}
            <motion.div
                className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-[3rem] -z-10"
                animate={{ opacity: isFloating ? 0 : 0.6 }}
                transition={{ duration: 1 }}
            />

            {/* HERO CONTAINER */}
            <div className={`
                relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/20 bg-black
                transition-all duration-500 ease-in-out
                ${isFloating ? 'opacity-0 scale-95 pointer-events-none h-0' : 'opacity-100 scale-100 aspect-video'}
            `}>
                {!isFloating && (
                    <>
                        <RP
                            ref={playerRef}
                            url={url}
                            width="100%"
                            height="100%"
                            controls
                            light={thumbnail || true}
                            onReady={() => setIsReady(true)}
                            onProgress={(state: { playedSeconds: number }) => setCurrentTime(state.playedSeconds)}
                            config={{
                                youtube: { playerVars: { modestbranding: 1 } }
                            }}
                        />
                        {/* HERO CHAPTERS OVERLAY (Show on hover if desired, or below) */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none md:pointer-events-auto">
                            {/* Only show simplistic markers inside video for cleaner look, or nothing. 
                                 Let's actually put markers OUTSIDE logic for clarity below. */}
                        </div>
                    </>
                )}
            </div>

            {/* CHAPTERS BAR (Below Hero) */}
            {!isFloating && chapters.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                    {chapters.map((chapter, idx) => {
                        const isActive = idx === activeChapterIndex;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleChapterClick(chapter.time)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                    ${isActive
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30 scale-105'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-indigo-300'
                                    }
                                `}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                                {chapter.label}
                                <span className={`text-[10px] ml-1 opacity-60 font-mono`}>
                                    {Math.floor(chapter.time / 60)}:{String(Math.floor(chapter.time % 60)).padStart(2, '0')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* FLOATING PLAYER (PiP) */}
            <AnimatePresence>
                {isFloating && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                        className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-black rounded-xl shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/20 flex flex-col"
                    >
                        {/* Header / Drag Handle */}
                        <div className="absolute top-0 right-0 z-20 p-2 flex gap-2 w-full justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                            <span className="text-[10px] font-bold text-white/80 px-2 py-1 bg-black/40 backdrop-blur rounded pointer-events-auto">
                                {chapters[activeChapterIndex]?.label || "Reproduciendo"}
                            </span>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="p-1.5 bg-black/60 text-white rounded-full hover:bg-indigo-600 transition backdrop-blur-sm pointer-events-auto"
                                title="Volver arriba (Modo Cine)"
                            >
                                <Maximize2 className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="aspect-video w-full bg-slate-900">
                            <RP
                                ref={playerRef}
                                url={url}
                                width="100%"
                                height="100%"
                                playing={true}
                                controls
                                light={false}
                                onProgress={(state: { playedSeconds: number }) => setCurrentTime(state.playedSeconds)}
                            />
                        </div>

                        {/* Mini Chapter Progress */}
                        {chapters.length > 0 && (
                            <div className="h-1 w-full bg-slate-800 flex">
                                {chapters.map((chapter, idx) => {
                                    // Logic to show progress segments if we wanted. 
                                    // For now simple active indicator bar
                                    const nextChapterTime = chapters[idx + 1] ? chapters[idx + 1].time : 99999;
                                    const isPast = currentTime >= chapter.time;
                                    const isCurrent = currentTime >= chapter.time && currentTime < nextChapterTime;

                                    return (
                                        <div
                                            key={idx}
                                            className={`h-full flex-1 border-r border-black/50 transition-colors ${isCurrent ? 'bg-indigo-500' : isPast ? 'bg-indigo-900' : 'bg-slate-700'}`}
                                            title={chapter.label}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
