import React, { useEffect, useState, useRef } from 'react';
import { useBanner, AnimationStyle, BannerSize } from '../../hooks/useBanner';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Star, Zap, Gift, Megaphone } from 'lucide-react';

const colorSchemes = {
    indigo: {
        bg: 'bg-indigo-950/40',
        border: 'border-indigo-500/20',
        hoverBorder: 'group-hover:border-indigo-500/40',
        glow: 'from-indigo-500/20',
        iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        text: 'text-indigo-50',
        accentText: 'text-indigo-400',
        button: 'bg-indigo-500 text-white hover:bg-indigo-400',
        marqueeText: 'text-indigo-200'
    },
    emerald: {
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/20',
        hoverBorder: 'group-hover:border-emerald-500/40',
        glow: 'from-emerald-500/20',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: 'text-emerald-50',
        accentText: 'text-emerald-400',
        button: 'bg-emerald-500 text-white hover:bg-emerald-400',
        marqueeText: 'text-emerald-200'
    },
    amber: {
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/20',
        hoverBorder: 'group-hover:border-amber-500/40',
        glow: 'from-amber-500/20',
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        text: 'text-amber-50',
        accentText: 'text-amber-400',
        button: 'bg-amber-500 text-white hover:bg-amber-400',
        marqueeText: 'text-amber-200'
    },
    rose: {
        bg: 'bg-rose-950/40',
        border: 'border-rose-500/20',
        hoverBorder: 'group-hover:border-rose-500/40',
        glow: 'from-rose-500/20',
        iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        text: 'text-rose-50',
        accentText: 'text-rose-400',
        button: 'bg-rose-500 text-white hover:bg-rose-400',
        marqueeText: 'text-rose-200'
    },
    slate: {
        bg: 'bg-slate-900/60',
        border: 'border-slate-500/20',
        hoverBorder: 'group-hover:border-slate-500/40',
        glow: 'from-slate-500/20',
        iconBg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
        text: 'text-slate-50',
        accentText: 'text-slate-300',
        button: 'bg-white text-slate-900 hover:bg-slate-200',
        marqueeText: 'text-slate-300'
    }
};

const sizeClasses: Record<BannerSize, string> = {
    compact: 'py-3 px-5',
    normal: 'py-5 px-6 sm:px-8',
    large: 'py-8 px-8 sm:px-10'
};

const speedClasses = {
    slow: { marquee: 'animate-[marquee_45s_linear_infinite]', pulse: 'animate-pulse duration-3000' },
    normal: { marquee: 'animate-[marquee_30s_linear_infinite]', pulse: 'animate-pulse duration-2000' },
    fast: { marquee: 'animate-[marquee_15s_linear_infinite]', pulse: 'animate-pulse duration-1000' }
};

const IconComponent = ({ style, className }: { style: AnimationStyle, className?: string }) => {
    switch (style) {
        case 'marquee': return <Megaphone className={className} strokeWidth={2} />;
        case 'wave': return <Zap className={className} strokeWidth={2} />;
        case 'glow': return <Star className={className} strokeWidth={2} />;
        case 'static': return <Gift className={className} strokeWidth={2} />;
        default: return <Sparkles className={className} strokeWidth={2} />;
    }
};

const DynamicBanner: React.FC = () => {
    const { banner, loading } = useBanner();
    const navigate = useNavigate();
    const bannerRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const updateMousePosition = (ev: MouseEvent) => {
            if (!bannerRef.current) return;
            const { left, top } = bannerRef.current.getBoundingClientRect();
            setMousePosition({ x: ev.clientX - left, y: ev.clientY - top });
        };

        if (isHovered && bannerRef.current) {
            window.addEventListener('mousemove', updateMousePosition);
            return () => window.removeEventListener('mousemove', updateMousePosition);
        }
    }, [isHovered]);

    if (loading) {
        return (
            <div className="mb-6 h-20 rounded-2xl bg-slate-900/20 border border-slate-200/50 dark:border-white/5 animate-pulse" />
        );
    }

    if (!banner.isActive) {
        return null;
    }

    const theme = colorSchemes[banner.bgColor] || colorSchemes.indigo;
    const padding = sizeClasses[banner.bannerSize] || sizeClasses.normal;
    const speed = speedClasses[banner.animationSpeed] || speedClasses.normal;

    const handleClick = () => {
        let url = banner.linkUrl.trim();
        const isExternal = url.startsWith('http') || url.startsWith('www.') || url.includes('.com') || url.includes('.es');

        if (isExternal) {
            if (!url.startsWith('http')) {
                url = `https://${url}`;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            navigate(url);
        }
    };

    const hasParticles = banner.showParticles;
    const isMarquee = banner.animationStyle === 'marquee';

    return (
        <div
            ref={bannerRef}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                group relative mb-6 w-full overflow-hidden rounded-2xl cursor-pointer
                bg-[#0A0A0B] ${theme.border} border
                transition-all duration-500 ease-out shadow-sm hover:shadow-xl
                ${theme.hoverBorder}
            `}
        >
            {/* Spotlight Hover Effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`
                }}
            />

            {/* Subtle Gradient Glow in background */}
            <div className={`absolute top-0 right-0 -m-32 h-64 w-64 rounded-full bg-gradient-to-bl ${theme.glow} to-transparent opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-60`} />

            {/* Optional Subtle Noise / Particles Replacement */}
            {hasParticles && (
                <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
            )}

            {isMarquee ? (
                // Marquee Layout
                <div className={`relative z-10 flex items-center overflow-hidden ${padding}`}>
                    <div className={`flex gap-16 whitespace-nowrap ${speed.marquee}`}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-6">
                                {banner.showIcon && (
                                    <IconComponent style="marquee" className={`w-5 h-5 ${theme.accentText} opacity-80`} />
                                )}
                                <span className={`text-sm sm:text-base font-semibold tracking-tight ${theme.marqueeText}`}>
                                    {banner.title}
                                </span>
                                {banner.subtitle && (
                                    <>
                                        <span className="text-white/20 px-2">•</span>
                                        <span className="text-sm sm:text-base text-white/60 tracking-tight">
                                            {banner.subtitle}
                                        </span>
                                    </>
                                )}
                                <span className={`text-sm font-bold ml-4 ${theme.accentText} group-hover:underline decoration-1 underline-offset-4`}>
                                    {banner.linkText}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Standard Layout
                <div className={`relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 ${padding}`}>
                    <div className="flex items-center gap-4 sm:gap-5">
                        {banner.showIcon && (
                            <div className={`
                                flex items-center justify-center shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border
                                ${theme.iconBg} backdrop-blur-md relative
                            `}>
                                <IconComponent style={banner.animationStyle} className="w-5 h-5" />
                                {banner.animationStyle === 'pulse' && (
                                    <div className={`absolute top-0 right-0 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] ${speed.pulse}`} />
                                )}
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            <h3 className={`text-base sm:text-lg font-semibold tracking-tight ${theme.text} ${banner.animationStyle === 'glow' ? 'animate-pulse' : ''} ${banner.animationStyle === 'wave' ? 'translate-y-0 group-hover:-translate-y-0.5 transition-transform duration-300' : ''}`}>
                                {banner.title}
                            </h3>
                            {banner.subtitle && (
                                <p className="text-sm text-slate-400 font-medium leading-snug max-w-2xl line-clamp-2">
                                    {banner.subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <button className={`
                        shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full
                        text-xs sm:text-sm font-semibold transition-all duration-300
                        ${theme.button} shadow-sm group-hover:shadow-md
                    `}>
                        {banner.linkText}
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default DynamicBanner;
