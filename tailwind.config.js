/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./src/styles/design-tokens.css",
    ],
    darkMode: 'class',
    theme: {
        screens: {
            'xxs': '320px',        /* iPhone SE */
            'xxs-landscape': '568px', /* iPhone SE landscape */
            'xs': '375px',        /* iPhone 12 Mini */
            'sm': '640px',        /* Small tablets */
            'md': '768px',        /* Tablet portrait */
            'lg': '1024px',       /* Tablet landscape / small desktop */
            'xl': '1280px',       /* Desktop */
            '2xl': '1536px',      /* Large desktop */
            '3xl': '1920px',      /* Extra large desktop */
            '4xl': '2560px',      /* Ultra-wide monitors */
        },
        extend: {
            fontFamily: {
                display: ['Space Grotesk', 'system-ui', 'sans-serif'],
                body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            fontSize: {
                xs: 'var(--font-size-xs)',
                sm: 'var(--font-size-sm)',
                base: 'var(--font-size-base)',
                lg: 'var(--font-size-lg)',
                xl: 'var(--font-size-xl)',
                '2xl': 'var(--font-size-2xl)',
                '3xl': 'var(--font-size-3xl)',
                '4xl': 'var(--font-size-4xl)',
                '5xl': 'var(--font-size-5xl)',
                /* Fluid Font Sizes */
                'fluid-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
                'fluid-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
                'fluid-base': 'clamp(1rem, 3vw, 1.125rem)',
                'fluid-lg': 'clamp(1.125rem, 4vw, 1.25rem)',
                'fluid-xl': 'clamp(1.25rem, 5vw, 1.5rem)',
                'fluid-2xl': 'clamp(1.5rem, 6vw, 2rem)',
                'fluid-3xl': 'clamp(2rem, 7vw, 2.5rem)',
            },
            spacing: {
                0: 'var(--space-0)',
                px: 'var(--space-px)',
                0.5: 'var(--space-0-5)',
                1: 'var(--space-1)',
                2: 'var(--space-2)',
                3: 'var(--space-3)',
                4: 'var(--space-4)',
                5: 'var(--space-5)',
                6: 'var(--space-6)',
                7: 'var(--space-7)',
                8: 'var(--space-8)',
                9: 'var(--space-9)',
                10: 'var(--space-10)',
                12: 'var(--space-12)',
                14: 'var(--space-14)',
                16: 'var(--space-16)',
                20: 'var(--space-20)',
                24: 'var(--space-24)',
                28: 'var(--space-28)',
                32: 'var(--space-32)',
                36: 'var(--space-36)',
                40: 'var(--space-40)',
                44: 'var(--space-44)',
                48: 'var(--space-48)',
                52: 'var(--space-52)',
                56: 'var(--space-56)',
                60: 'var(--space-60)',
                64: 'var(--space-64)',
                72: 'var(--space-72)',
                80: 'var(--space-80)',
                96: 'var(--space-96)',
                /* Fluid Spacing */
                'fluid': 'clamp(1rem, 3vw, 2rem)',
            },
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary-500)',
                    50: 'var(--color-primary-50)',
                    100: 'var(--color-primary-100)',
                    200: 'var(--color-primary-200)',
                    300: 'var(--color-primary-300)',
                    400: 'var(--color-primary-400)',
                    500: 'var(--color-primary-500)',
                    600: 'var(--color-primary-600)',
                    700: 'var(--color-primary-700)',
                    800: 'var(--color-primary-800)',
                    900: 'var(--color-primary-900)',
                    950: 'var(--color-primary-950)',
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary-500)',
                    50: 'var(--color-secondary-50)',
                    100: 'var(--color-secondary-100)',
                    200: 'var(--color-secondary-200)',
                    300: 'var(--color-secondary-300)',
                    400: 'var(--color-secondary-400)',
                    500: 'var(--color-secondary-500)',
                    600: 'var(--color-secondary-600)',
                    700: 'var(--color-secondary-700)',
                    800: 'var(--color-secondary-800)',
                    900: 'var(--color-secondary-900)',
                    950: 'var(--color-secondary-950)',
                },
                accent: {
                    DEFAULT: 'var(--color-accent-500)',
                    50: 'var(--color-accent-50)',
                    100: 'var(--color-accent-100)',
                    200: 'var(--color-accent-200)',
                    300: 'var(--color-accent-300)',
                    400: 'var(--color-accent-400)',
                    500: 'var(--color-accent-500)',
                    600: 'var(--color-accent-600)',
                    700: 'var(--color-accent-700)',
                    800: 'var(--color-accent-800)',
                    900: 'var(--color-accent-900)',
                    950: 'var(--color-accent-950)',
                },
                success: {
                    DEFAULT: 'var(--color-success-500)',
                    50: 'var(--color-success-50)',
                    100: 'var(--color-success-100)',
                    500: 'var(--color-success-500)',
                    600: 'var(--color-success-600)',
                    700: 'var(--color-success-700)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning-500)',
                    50: 'var(--color-warning-50)',
                    100: 'var(--color-warning-100)',
                    500: 'var(--color-warning-500)',
                    600: 'var(--color-warning-600)',
                    700: 'var(--color-warning-700)',
                },
                error: {
                    DEFAULT: 'var(--color-error-500)',
                    50: 'var(--color-error-50)',
                    100: 'var(--color-error-100)',
                    500: 'var(--color-error-500)',
                    600: 'var(--color-error-600)',
                    700: 'var(--color-error-700)',
                },
                slate: {
                    50: 'var(--color-slate-50)',
                    100: 'var(--color-slate-100)',
                    200: 'var(--color-slate-200)',
                    300: 'var(--color-slate-300)',
                    400: 'var(--color-slate-400)',
                    500: 'var(--color-slate-500)',
                    600: 'var(--color-slate-600)',
                    700: 'var(--color-slate-700)',
                    800: 'var(--color-slate-800)',
                    900: 'var(--color-slate-900)',
                    950: 'var(--color-slate-950)',
                },
            },
            borderRadius: {
                none: 'var(--radius-none)',
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
                '3xl': 'var(--radius-3xl)',
                '4xl': '2.5rem',
                '5xl': '3rem',
                full: 'var(--radius-full)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                xl: 'var(--shadow-xl)',
                '2xl': 'var(--shadow-2xl)',
                /* Glow Effects */
                'glow-primary': '0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.1)',
                'glow-secondary': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)',
                'glow-success': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)',
                'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1)',
                /* Glass Effect */
                'glass': '0 4px 24px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            },
            backdropBlur: {
                'premium': '32px',
            },
            animationDuration: {
                instant: 'var(--duration-instant)',
                fast: 'var(--duration-fast)',
                normal: 'var(--duration-normal)',
                slow: 'var(--duration-slow)',
                slower: 'var(--duration-slower)',
                'super-slow': '30s',
                'ultra-slow': '20s',
            },
            container: {
                'xs': '20rem',      // 320px - iPhone SE
                'sm': '24rem',      // 384px - Small mobile
                'md': '28rem',      // 448px - Mobile
                'lg': '32rem',      // 512px - Large mobile
                'xl': '36rem',      // 576px - Tablet portrait
                '2xl': '42rem',     // 672px - Tablet landscape
                '3xl': '48rem',     // 768px - Small desktop
                '4xl': '56rem',     // 896px - Desktop
                '5xl': '64rem',     // 1024px - Large desktop
                '6xl': '72rem',     // 1152px - Extra large
                '7xl': '80rem',     // 1280px - Ultra wide
            },
            /* Touch Target Sizes */
            minWidth: {
                'touch': '44px',
                'touch-lg': '48px',
            },
            minHeight: {
                'touch': '44px',
                'touch-lg': '48px',
            },
            /* Safe Area Margins/Paddings */
            margin: {
                'safe-x': 'env(safe-area-inset-right) env(safe-area-inset-left)',
                'safe-y': 'env(safe-area-inset-bottom) env(safe-area-inset-top)',
                'safe-all': 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
            },
            padding: {
                'safe-x': 'env(safe-area-inset-right) env(safe-area-inset-left)',
                'safe-y': 'env(safe-area-inset-bottom) env(safe-area-inset-top)',
                'safe-all': 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
                'fluid': 'clamp(1rem, 3vw, 2rem)',
            },
            /* Aspect Ratios for Responsive Media */
            aspectRatio: {
                'video': '16/9',
                'square': '1/1',
                'portrait': '3/4',
            },
            /* Container Query Orientations */
            containerType: {
                'size': 'size',
                'inline-size': 'inline-size',
            },
        },
    },
    plugins: [
        require('@tailwindcss/container-queries'),
        // Plugin personalizado para orientaciones de container queries
        function({ addVariant }) {
            // Portrait: cuando el contenedor es más alto que ancho
            addVariant('@portrait', '@container (orientation: portrait)');
            // Landscape: cuando el contenedor es más ancho que alto
            addVariant('@landscape', '@container (orientation: landscape)');
            // Square: cuando el contenedor es casi cuadrado
            addVariant('@square', '@container (min-aspect-ratio: 0.9) and (max-aspect-ratio: 1.1)');
            // Wide: para contenedores muy anchos
            addVariant('@wide', '@container (min-aspect-ratio: 2/1)');
            // Tall: para contenedores muy altos
            addVariant('@tall', '@container (max-aspect-ratio: 1/2)');
        }
    ],
}
