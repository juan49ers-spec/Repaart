import React from 'react';
import { useBanner, AnimationStyle, BannerSize } from '../../hooks/useBanner';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Star, Zap, Gift, Megaphone } from 'lucide-react';

const colorSchemes = {
    indigo: {
        gradient: 'from-indigo-600 via-indigo-500 to-purple-600',
        aurora1: 'bg-indigo-400',
        aurora2: 'bg-purple-400',
        aurora3: 'bg-blue-400',
        glow: 'shadow-indigo-500/30',
        particle: 'bg-indigo-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(129,140,248,0.4)]'
    },
    emerald: {
        gradient: 'from-emerald-600 via-emerald-500 to-teal-600',
        aurora1: 'bg-emerald-400',
        aurora2: 'bg-teal-400',
        aurora3: 'bg-green-400',
        glow: 'shadow-emerald-500/30',
        particle: 'bg-emerald-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]'
    },
    amber: {
        gradient: 'from-amber-500 via-orange-400 to-amber-600',
        aurora1: 'bg-amber-400',
        aurora2: 'bg-orange-400',
        aurora3: 'bg-yellow-400',
        glow: 'shadow-amber-500/30',
        particle: 'bg-amber-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]'
    },
    rose: {
        gradient: 'from-rose-600 via-pink-500 to-rose-700',
        aurora1: 'bg-rose-400',
        aurora2: 'bg-pink-400',
        aurora3: 'bg-red-400',
        glow: 'shadow-rose-500/30',
        particle: 'bg-rose-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(251,113,133,0.4)]'
    },
    slate: {
        gradient: 'from-slate-800 via-slate-700 to-slate-900',
        aurora1: 'bg-slate-400',
        aurora2: 'bg-slate-500',
        aurora3: 'bg-slate-300',
        glow: 'shadow-slate-500/30',
        particle: 'bg-slate-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(148,163,184,0.4)]'
    }
};

const sizeClasses: Record<BannerSize, string> = {
    compact: 'py-2.5',
    normal: 'py-4 sm:py-6',
    large: 'py-8 sm:py-12'
};

const speedClasses = {
    slow: { marquee: 'animate-[marquee_45s_linear_infinite]', pulse: 'animate-[pulse_4s_ease-in-out_infinite]' },
    normal: { marquee: 'animate-[marquee_30s_linear_infinite]', pulse: 'animate-[pulse_3s_ease-in-out_infinite]' },
    fast: { marquee: 'animate-[marquee_15s_linear_infinite]', pulse: 'animate-[pulse_2s_ease-in-out_infinite]' }
};

const IconComponent = ({ style }: { style: AnimationStyle }) => {
    switch (style) {
        case 'marquee': return <Megaphone className="w-5 h-5 text-white stroke-[2]" />;
        case 'wave': return <Zap className="w-5 h-5 text-white stroke-[2]" />;
        case 'glow': return <Star className="w-5 h-5 text-white stroke-[2]" />;
        case 'static': return <Gift className="w-5 h-5 text-white stroke-[2]" />;
        default: return <Sparkles className="w-5 h-5 text-white stroke-[2]" />;
    }
};

const DynamicBanner: React.FC = () => {
    const { banner, loading } = useBanner();
    const navigate = useNavigate();

    // Generate particles only once using state lazy init to avoid impure render calls
    const [particles] = React.useState<Array<{ left: number; top: number; duration: number; delay: number; size: number }>>(() => {
        return [...Array(8)].map(() => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            duration: 4 + Math.random() * 6,
            delay: Math.random() * 3,
            size: 2 + Math.random() * 4
        }));
    });

    if (loading) {
        return (
            <div className="mb-6 h-20 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 animate-pulse" />
        );
    }

    if (!banner.isActive) {
        return null;
    }

    const colors = colorSchemes[banner.bgColor] || colorSchemes.indigo;
    const size = sizeClasses[banner.bannerSize] || sizeClasses.normal;
    const speed = speedClasses[banner.animationSpeed] || speedClasses.normal;

    const handleClick = () => {
        let url = banner.linkUrl.trim();

        // Detectar si es una URL externa (http, https o empieza por www.)
        const isExternal = url.startsWith('http') || url.startsWith('www.') || url.includes('.com') || url.includes('.es');

        if (isExternal) {
            // Asegurar que tiene protocolo si le falta
            if (!url.startsWith('http')) {
                url = `https://${url}`;
            }
            window.open(url, '_blank');
        } else {
            navigate(url);
        }
    };

    // Animation-specific classes
    const getAnimationClasses = () => {
        switch (banner.animationStyle) {
            case 'glow':
                return 'animate-[glow_3s_ease-in-out_infinite_alternate]';
            case 'wave':
                return 'animate-[wave_2s_ease-in-out_infinite]';
            case 'pulse':
                return speed.pulse;
            default:
                return '';
        }
    };

    return (
        <div
            className={`mb-6 relative overflow-hidden rounded-[2rem] cursor-pointer group transition-all duration-700 hover:scale-[1.015] hover:-translate-y-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] ${colors.glow} perspective-1000`}
            onClick={handleClick}
        >
            {/* Gradient Background Layer */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} ${banner.animationStyle === 'glow' ? 'animate-[gradient-shift_10s_ease_infinite]' : ''} opacity-95 transition-opacity duration-700 group-hover:opacity-100`} />

            {/* Animated Aurora Orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -top-10 -left-10 w-32 h-32 ${colors.aurora1} rounded-full blur-3xl opacity-40 ${getAnimationClasses()}`} />
                <div className={`absolute -top-5 right-20 w-24 h-24 ${colors.aurora2} rounded-full blur-2xl opacity-30 ${getAnimationClasses()} delay-300`} />
                <div className={`absolute -bottom-5 right-10 w-28 h-28 ${colors.aurora3} rounded-full blur-3xl opacity-30 ${getAnimationClasses()} delay-700`} />
            </div>

            {/* Floating Particles */}
            {banner.showParticles && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {particles.map((p, i) => (
                        <div
                            key={i}
                            className={`absolute bg-white/30 rounded-full blur-[1px]`}
                            style={{
                                left: `${p.left}%`,
                                top: `${p.top}%`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                animation: `float ${p.duration}s ease-in-out infinite`,
                                animationDelay: `${p.delay}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Grid Pattern Overlay - More Subtle */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 38.59V40h1.41l.59-.59.59.59H40V38.59l-.59-.59.59-.59V0h-1.41l-.59.59-.59-.59H0v1.41l.59.59-.59.59v35.18l.59.59-.59.59zM1.41 38l.59.59.59-.59h34.82l.59.59.59-.59V1.41l-.59-.59-.59.59H2.59l-.59-.59-.59.59V38zM2.59 2h34.82l.59.59.59-.59v34.82l-.59.59-.59-.59H2.59l-.59.59-.59-.59V2.59l.59-.59.59.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

            {/* Top Shine Flare */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/20 to-transparent pointer-events-none opacity-50" />

            {/* Content - Static or Marquee */}
            {banner.animationStyle === 'marquee' ? (
                // Marquee Mode
                <div className={`relative z-10 ${size} overflow-hidden flex items-center`}>
                    <div className={`flex gap-32 whitespace-nowrap ${speed.marquee}`}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-10 px-8">
                                {banner.showIcon && (
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-2xl border border-white/30 flex items-center justify-center shrink-0 shadow-lg">
                                        <IconComponent style={banner.animationStyle} />
                                    </div>
                                )}
                                <span className={`text-2xl sm:text-3xl font-black text-white tracking-tighter ${colors.textGlow}`}>
                                    {banner.title}
                                </span>
                                <span className="text-white/30 font-thin text-3xl">/</span>
                                <span className="text-lg sm:text-xl text-white/90 font-medium tracking-tight">
                                    {banner.subtitle}
                                </span>
                                <div className="px-6 py-2 bg-white text-indigo-600 rounded-full text-sm font-black shadow-xl ring-4 ring-white/10 group-hover:scale-105 transition-transform">
                                    {banner.linkText}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Static/Pulse/Wave/Glow Mode
                <div className={`relative z-10 px-8 ${size} flex items-center justify-between gap-6`}>
                    {/* Left: Icon + Text */}
                    <div className="flex items-center gap-6">
                        {banner.showIcon && (
                            <div className={`relative ${banner.animationStyle === 'pulse' ? speed.pulse : ''}`}>
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.25rem] bg-indigo-500/20 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-inner">
                                    <IconComponent style={banner.animationStyle} />
                                </div>
                                {banner.animationStyle !== 'static' && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center p-1">
                                        <div className="w-full h-full bg-indigo-500 rounded-full animate-pulse" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col">
                            <h3 className={`text-xl sm:text-3xl font-black text-white tracking-tighter leading-tight ${colors.textGlow} ${banner.animationStyle === 'wave' ? 'animate-[wave-text_2.5s_ease-in-out_infinite]' : ''}`}>
                                {banner.title}
                            </h3>
                            <p className="text-sm sm:text-lg text-white/80 font-medium max-w-xl line-clamp-2 mt-0.5 tracking-tight">
                                {banner.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Right: CTA Button */}
                    <button className="flex items-center gap-2 group/btn px-6 sm:px-8 py-3 rounded-2xl bg-white text-indigo-700 font-black text-sm transition-all hover:bg-indigo-50 hover:shadow-[0_10px_30px_-5px_theme(colors.indigo.500/40)] active:scale-95 shrink-0">
                        <span>{banner.linkText}</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}

            {/* Glass Flare */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />

            {/* Bottom Glow */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent opacity-50" />

            {/* CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
                    50% { transform: translateY(-30px) translateX(15px) scale(1.2); opacity: 0.2; }
                }
                @keyframes wave-text {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-5px) scale(1.02); }
                }
                @keyframes gradient-shift {
                   0%, 100% { background-position: 0% 50%; }
                   50% { background-position: 100% 50%; }
                }
            `}</style>
        </div>
    );
};

export default DynamicBanner;
