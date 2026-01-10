

// --- Premium SVG Weather Icons ---

const SunIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="sunGradient" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FBbf24" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <circle cx="32" cy="32" r="14" fill="url(#sunGradient)" filter="url(#glow)">
            <animate attributeName="r" values="14;15;14" dur="4s" repeatCount="indefinite" />
        </circle>
        <g stroke="url(#sunGradient)" strokeWidth="4" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <line key={i} x1="32" y1="12" x2="32" y2="6" transform={`rotate(${angle} 32 32)`}>
                    <animate attributeName="y2" values="6;4;6" dur="2s" begin={`${i * 0.1}s`} repeatCount="indefinite" />
                </line>
            ))}
        </g>
    </svg>
);

const CloudIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cloudGradient" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#64748B" floodOpacity="0.3" />
            </filter>
        </defs>
        <path d="M46 44H18C13.5817 44 10 40.4183 10 36C10 31.5817 13.5817 28 18 28C18.5 28 19 28.1 19.5 28.2C20.5 22.5 25.5 18 31.5 18C38.4 18 44 23.6 44 30.5V31H46C50.4183 31 54 34.5817 54 39C54 43.4183 50.4183 44 46 44Z" fill="url(#cloudGradient)" filter="url(#softShadow)">
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-1; 0,0" dur="4s" repeatCount="indefinite" />
        </path>
    </svg>
);

const PartlyCloudyIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="sunGradientSmall" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="cloudGradientWhite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
        </defs>
        <circle cx="38" cy="26" r="10" fill="url(#sunGradientSmall)">
            <animate attributeName="r" values="10;11;10" dur="3s" repeatCount="indefinite" />
        </circle>
        <path d="M44 46H20C16.6863 46 14 43.3137 14 40C14 36.6863 16.6863 34 20 34C20.4 34 20.8 34.1 21.1 34.2C21.9 29.9 25.6 26.5 30.1 26.5C35.3 26.5 39.5 30.7 39.5 35.9V36.2H41C44.3137 36.2 47 38.8863 47 42.2C47 45.5137 44.3137 46 41 46H44Z" fill="url(#cloudGradientWhite)" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.1))">
            <animateTransform attributeName="transform" type="translate" values="-1,0; 1,0; -1,0" dur="5s" repeatCount="indefinite" />
        </path>
    </svg>
);

const RainIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="rainCloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
        </defs>
        <path d="M46 40H18C13.5817 40 10 36.4183 10 32C10 27.5817 13.5817 24 18 24C18.5 24 19 24.1 19.5 24.2C20.5 18.5 25.5 14 31.5 14C38.4 14 44 19.6 44 26.5V27H46C50.4183 27 54 30.5817 54 35C54 39.4183 50.4183 40 46 40Z" fill="url(#rainCloud)" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.2))" />
        <g stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
            <line x1="22" y1="44" x2="18" y2="52" opacity="0.6">
                <animate attributeName="y1" values="44;48" dur="1s" repeatCount="indefinite" />
                <animate attributeName="y2" values="52;56" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
            </line>
            <line x1="32" y1="44" x2="28" y2="52" opacity="0.8">
                <animate attributeName="y1" values="44;48" dur="1s" begin="0.2s" repeatCount="indefinite" />
                <animate attributeName="y2" values="52;56" dur="1s" begin="0.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.2s" repeatCount="indefinite" />
            </line>
            <line x1="42" y1="44" x2="38" y2="52" opacity="0.6">
                <animate attributeName="y1" values="44;48" dur="1s" begin="0.4s" repeatCount="indefinite" />
                <animate attributeName="y2" values="52;56" dur="1s" begin="0.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.4s" repeatCount="indefinite" />
            </line>
        </g>
    </svg>
);

const StormIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="stormCloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
        </defs>
        <path d="M46 38H18C13.5817 38 10 34.4183 10 30C10 25.5817 13.5817 22 18 22C18.5 22 19 22.1 19.5 22.2C20.5 16.5 25.5 12 31.5 12C38.4 12 44 17.6 44 24.5V25H46C50.4183 25 54 28.5817 54 33C54 37.4183 50.4183 38 46 38Z" fill="url(#stormCloud)" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
        <path d="M36 34L28 46H34L30 54L38 42H32L36 34Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" strokeLinejoin="round">
            <animate attributeName="opacity" values="0;1;0;1;0" dur="2s" repeatCount="indefinite" />
        </path>
    </svg>
);

const SnowIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="snowCloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
        </defs>
        <path d="M46 40H18C13.5817 40 10 36.4183 10 32C10 27.5817 13.5817 24 18 24C18.5 24 19 24.1 19.5 24.2C20.5 18.5 25.5 14 31.5 14C38.4 14 44 19.6 44 26.5V27H46C50.4183 27 54 30.5817 54 35C54 39.4183 50.4183 40 46 40Z" fill="url(#snowCloud)" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.1))" />
        <g fill="#BAE6FD">
            <circle cx="22" cy="48" r="2">
                <animate attributeName="cy" values="44;54" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="48" r="2.5">
                <animate attributeName="cy" values="44;54" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="42" cy="48" r="2">
                <animate attributeName="cy" values="44;54" dur="2.2s" begin="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="0.6s" repeatCount="indefinite" />
            </circle>
        </g>
    </svg>
);


export const getWeatherIcon = (code: number, className: string = "w-10 h-10") => {
    // WMO Weather interpretation codes (WW)
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog
    // 51, 53, 55: Drizzle
    // 61, 63, 65: Rain
    // 71, 73, 75: Snow
    // 80, 81, 82: Rain showers
    // 95, 96, 99: Thunderstorm

    switch (true) {
        case code === 0:
            return <SunIcon className={className} />;
        case code === 1:
            return <SunIcon className={className} />;
        case code === 2:
        case code === 3:
            return <PartlyCloudyIcon className={className} />;
        case code >= 45 && code <= 48:
            return <CloudIcon className={className} />; // Fog
        case code >= 51 && code <= 55:
            return <RainIcon className={className} />; // Drizzle
        case code >= 61 && code <= 65:
            return <RainIcon className={className} />; // Rain
        case code >= 71 && code <= 77:
            return <SnowIcon className={className} />; // Snow
        case code >= 80 && code <= 82:
            return <RainIcon className={className} />; // Showers
        case code >= 95 && code <= 99:
            return <StormIcon className={className} />; // Thunderstorm
        default:
            return <SunIcon className={className} />;
    }
};
