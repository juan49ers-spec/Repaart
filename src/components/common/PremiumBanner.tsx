import React from 'react';

const PremiumBanner: React.FC = () => {
    return (
        <div className="h-48 w-full relative overflow-hidden bg-slate-900 border-b border-white/10 shrink-0">
            {/* 🌌 Deep Space Base */}
            <div className="absolute inset-0 bg-[#0B1120]" />

            {/* 🌠 Animated Aurora Mesh */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[200%] bg-indigo-500/30 blur-[100px] animate-aurora-slow mix-blend-screen rounded-full" />
                <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[200%] bg-emerald-500/20 blur-[120px] animate-aurora-slower mix-blend-screen rounded-full" />
                <div className="absolute bottom-[-50%] left-[20%] w-[80%] h-[200%] bg-purple-500/20 blur-[100px] animate-aurora-reverse mix-blend-screen rounded-full" />
            </div>

            {/* ❄️ Frost Texture overlay for glass effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

            {/* 💡 Vignette & Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/50 via-transparent to-[#0B1120]/50" />

            {/* 📢 Scrolling Ticker (Marquee) */}
            <div className="absolute top-8 left-0 right-0 overflow-hidden flex items-center h-12 z-20 mask-marquee opacity-90">
                <div className="flex gap-16 animate-marquee whitespace-nowrap min-w-max">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-16">
                            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white/80 drop-shadow-2xl">
                                POTENCIA TU NEGOCIO
                            </span>
                            <span className="text-xl font-light tracking-[0.2em] text-emerald-300 uppercase flex items-center gap-4">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Servicios Premium Disponibles
                            </span>
                            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-200 drop-shadow-2xl">
                                DESBLOQUEA HERRAMIENTAS EXCLUSIVAS
                            </span>
                            <span className="text-xl font-light tracking-[0.2em] text-rose-300 uppercase flex items-center gap-4">
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                                Soporte VIP 24/7
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ✨ Accent Lines (Subtle Tech Feel) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        </div>
    );
};

export default PremiumBanner;
