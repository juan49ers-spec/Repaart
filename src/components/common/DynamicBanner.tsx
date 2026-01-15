import React from 'react';
import { useBanner, AnimationStyle, BannerSize } from '../../hooks/useBanner';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Star, Zap, Gift, Megaphone } from 'lucide-react';

const colorSchemes = {
    indigo: {
        gradient: 'from-indigo-600 via-purple-600 to-indigo-800',
        aurora1: 'bg-indigo-400',
        aurora2: 'bg-purple-400',
        aurora3: 'bg-blue-400',
        glow: 'shadow-indigo-500/50',
        particle: 'bg-indigo-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(129,140,248,0.6)]'
    },
    emerald: {
        gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
        aurora1: 'bg-emerald-400',
        aurora2: 'bg-teal-400',
        aurora3: 'bg-green-400',
        glow: 'shadow-emerald-500/50',
        particle: 'bg-emerald-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]'
    },
    amber: {
        gradient: 'from-amber-500 via-orange-500 to-amber-700',
        aurora1: 'bg-amber-400',
        aurora2: 'bg-orange-400',
        aurora3: 'bg-yellow-400',
        glow: 'shadow-amber-500/50',
        particle: 'bg-amber-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]'
    },
    rose: {
        gradient: 'from-rose-600 via-pink-600 to-rose-800',
        aurora1: 'bg-rose-400',
        aurora2: 'bg-pink-400',
        aurora3: 'bg-red-400',
        glow: 'shadow-rose-500/50',
        particle: 'bg-rose-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(251,113,133,0.6)]'
    },
    slate: {
        gradient: 'from-slate-700 via-slate-600 to-slate-800',
        aurora1: 'bg-slate-400',
        aurora2: 'bg-slate-500',
        aurora3: 'bg-slate-300',
        glow: 'shadow-slate-500/50',
        particle: 'bg-slate-300',
        textGlow: 'drop-shadow-[0_0_15px_rgba(148,163,184,0.6)]'
    }
};

const sizeClasses: Record<BannerSize, string> = {
    compact: 'py-3',
    normal: 'py-4 sm:py-5',
    large: 'py-6 sm:py-8'
};

const speedClasses = {
    slow: { marquee: 'animate-[marquee_40s_linear_infinite]', pulse: 'animate-[pulse_3s_ease-in-out_infinite]' },
    normal: { marquee: 'animate-[marquee_25s_linear_infinite]', pulse: 'animate-[pulse_2s_ease-in-out_infinite]' },
    fast: { marquee: 'animate-[marquee_12s_linear_infinite]', pulse: 'animate-[pulse_1s_ease-in-out_infinite]' }
};

const IconComponent = ({ style }: { style: AnimationStyle }) => {
    switch (style) {
        case 'marquee': return <Megaphone className="w-5 h-5 text-white" />;
        case 'wave': return <Zap className="w-5 h-5 text-white" />;
        case 'glow': return <Star className="w-5 h-5 text-white" />;
        case 'static': return <Gift className="w-5 h-5 text-white" />;
        default: return <Sparkles className="w-5 h-5 text-white" />;
    }
};

const DynamicBanner: React.FC = () => {
    const { banner, loading } = useBanner();
    const navigate = useNavigate();

    // Generate particles only once using state lazy init to avoid impure render calls
    const [particles] = React.useState<Array<{ left: number; top: number; duration: number; delay: number }>>(() => {
        return [...Array(6)].map(() => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            duration: 3 + Math.random() * 4,
            delay: Math.random() * 2
        }));
    });

    if (loading) {
        return (
            <div className="mb-6 h-16 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 animate-pulse" />
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
                return 'animate-[glow_2s_ease-in-out_infinite_alternate]';
            case 'wave':
                return 'animate-[wave_1.5s_ease-in-out_infinite]';
            case 'pulse':
                return speed.pulse;
            default:
                return '';
        }
    };

    return (
        <div
            className={`mb-6 relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-500 hover:scale-[1.01] shadow-2xl ${colors.glow}`}
            onClick={handleClick}
        >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} ${banner.animationStyle === 'glow' ? 'animate-[gradient-shift_4s_ease_infinite]' : ''}`} />

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
                            className={`absolute w-1 h-1 ${colors.particle} rounded-full opacity-60`}
                            style={{
                                left: `${p.left}%`,
                                top: `${p.top}%`,
                                animation: `float ${p.duration}s ease-in-out infinite`,
                                animationDelay: `${p.delay}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

            {/* Top Shine Line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            {/* Content - Static or Marquee */}
            {banner.animationStyle === 'marquee' ? (
                // Marquee Mode
                <div className={`relative z-10 ${size} overflow-hidden`}>
                    <div className={`flex gap-16 whitespace-nowrap ${speed.marquee}`}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-8 px-6">
                                {banner.showIcon && (
                                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                                        <IconComponent style={banner.animationStyle} />
                                    </div>
                                )}
                                <span className={`text-xl sm:text-2xl font-black text-white tracking-tight ${colors.textGlow}`}>
                                    {banner.title}
                                </span>
                                <span className="text-white/60 font-light text-2xl">•</span>
                                <span className="text-base sm:text-lg text-white/90 font-medium">
                                    {banner.subtitle}
                                </span>
                                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-bold">
                                    {banner.linkText}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Static/Pulse/Wave/Glow Mode
                <div className={`relative z-10 px-6 ${size} flex items-center justify-between`}>
                    {/* Left: Icon + Text */}
                    <div className="flex items-center gap-4">
                        {banner.showIcon && (
                            <div className={`relative ${banner.animationStyle === 'pulse' ? speed.pulse : ''}`}>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                    <IconComponent style={banner.animationStyle} />
                                </div>
                                {banner.animationStyle !== 'static' && (
                                    <>
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                            <span className={`text-lg sm:text-2xl font-black text-white tracking-tight ${colors.textGlow} ${banner.animationStyle === 'wave' ? 'animate-[wave-text_2s_ease-in-out_infinite]' : ''}`}>
                                {banner.title}
                            </span>
                            <span className="hidden sm:block text-white/40 font-light text-xl">|</span>
                            <span className="text-sm sm:text-base text-white/80 font-medium max-w-md">
                                {banner.subtitle}
                            </span>
                        </div>
                    </div>

                    {/* Right: CTA Button */}
                    <button className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-sm transition-all group-hover:bg-white/20 group-hover:scale-105 shrink-0">
                        <span className="hidden sm:inline">{banner.linkText}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}

            {/* Bottom Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Hover Shimmer */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
                    50% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
                }
                @keyframes wave-text {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes gradient-shift {
                    0%, 100% { filter: hue-rotate(0deg) brightness(1); }
                    50% { filter: hue-rotate(15deg) brightness(1.1); }
                }
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default DynamicBanner;
