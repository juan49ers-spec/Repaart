import React from 'react';

const PremiumBanner: React.FC = () => {
    return (
        <div className="h-56 w-full relative overflow-hidden bg-slate-950 border-y border-white/10 shrink-0">
            {/* 🌌 Deep Space Base */}
            <div className="absolute inset-0 bg-[#020617]" />

            {/* 🌠 Animated Aurora Mesh - Higher Fidelity */}
            <div className="absolute inset-0 opacity-50 contrast-125">
                <div className="absolute top-[-40%] left-[-10%] w-[70%] h-[180%] bg-indigo-600/30 blur-[120px] animate-aurora-slow mix-blend-screen rounded-full" />
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[150%] bg-emerald-600/25 blur-[140px] animate-aurora-slower mix-blend-screen rounded-full" />
                <div className="absolute bottom-[-40%] left-[15%] w-[70%] h-[180%] bg-purple-600/20 blur-[120px] animate-aurora-reverse mix-blend-screen rounded-full" />
            </div>

            {/* ❄️ Frost Texture overlay for glass effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />

            {/* 💡 Vignette & Gradient Overlays - Deeper contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/60 via-transparent to-[#020617]/60" />

            {/* 📢 Scrolling Ticker (Marquee) - High Visibility Mode */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 overflow-hidden flex items-center h-24 z-30 pointer-events-none">
                <div className="flex gap-32 animate-marquee whitespace-nowrap min-w-max">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-20">
                            <span className="text-4xl font-bold tracking-tighter text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
                                POTENCIA TU NEGOCIO
                            </span>
                            <span className="text-xl font-medium tracking-[0.25em] text-emerald-400 uppercase flex items-center gap-5 bg-black/40 px-8 py-3 rounded-2xl backdrop-blur-md border border-emerald-500/20 shadow-2xl">
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#10b981]" />
                                <span className="opacity-90">Servicios Premium Disponibles</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ✨ Accent Lines (Subtle Tech Feel) */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5" />
        </div>
    );
};

export default PremiumBanner;
