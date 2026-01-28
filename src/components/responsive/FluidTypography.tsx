/**
 * Fluid Typography Helpers
 *
 * Helper components and utilities for fluid typography using clamp()
 * and responsive sizing based on viewport width.
 */



export const FluidText = ({ as: Component = 'p', className, style, children, ...props }: any) => {
    return (
        <Component
            className={className}
            style={{
                ...style,
                fontSize: 'clamp(var(--font-size-sm), 2vw + 0.5rem, var(--font-size-base))',
                ...props.style
            }}
            {...props}
        >
            {children}
        </Component>
    );
};

export const FluidHeading = ({ as: Component = 'h1', className, style, children, level = 1, ...props }: any) => {
    const fontSizeLevel = {
        1: 'clamp(var(--font-size-2xl), 5vw + 1rem, var(--font-size-4xl))',
        2: 'clamp(var(--font-size-xl), 4vw + 1rem, var(--font-size-3xl))',
        3: 'clamp(var(--font-size-lg), 3vw + 1rem, var(--font-size-2xl))',
        4: 'clamp(var(--font-size-base), 2.5vw + 1rem, var(--font-size-xl))',
        5: 'clamp(var(--font-size-sm), 2vw + 0.5rem, var(--font-size-lg))',
        6: 'clamp(var(--font-size-xs), 1.5vw + 0.5rem, var(--font-size-base))'
    };

    return (
        <Component
            className={className}
            style={{
                ...style,
                fontSize: fontSizeLevel[level as keyof typeof fontSizeLevel],
                lineHeight: 'clamp(1.1, 0.5vw + 0.9, 1.3)',
                ...props.style
            }}
            {...props}
        >
            {children}
        </Component>
    );
};

export const FluidContainer = ({ className, style, children, ...props }: any) => {
    return (
        <div
            className={className}
            style={{
                ...style,
                padding: 'clamp(var(--space-4), 2vw + var(--space-2), var(--space-8))',
                ...props.style
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export const FluidGrid = ({ className, style, children, gap = 4, ...props }: any) => {
    return (
        <div
            className={className}
            style={{
                ...style,
                display: 'grid',
                gap: `var(--space-${gap})`,
                gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, clamp(250px, 20vw, 350px)), 1fr))`,
                ...props.style
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export const FluidFlex = ({ className, style, children, ...props }: any) => {
    return (
        <div
            className={className}
            style={{
                ...style,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'clamp(var(--space-2), 2vw + var(--space-1), var(--space-6))',
                ...props.style
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export const FluidButton = ({ className, style, children, ...props }: any) => {
    return (
        <button
            className={className}
            style={{
                ...style,
                padding: 'clamp(var(--space-2), 2vw + var(--space-1), var(--space-4))',
                fontSize: 'clamp(var(--font-size-sm), 1.5vw + 0.5rem, var(--font-size-base))',
                ...props.style
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export const FluidInput = ({ className, style, ...props }: any) => {
    return (
        <input
            className={className}
            style={{
                ...style,
                padding: 'clamp(var(--space-2), 2vw + var(--space-1), var(--space-4))',
                fontSize: 'clamp(var(--font-size-sm), 1.5vw + 0.5rem, var(--font-size-base))',
                ...props.style
            }}
            {...props}
        />
    );
};

export const ResponsiveSpacing = ({ className, style, children, multiplier = 1, ...props }: any) => {
    return (
        <div
            className={className}
            style={{
                ...style,
                padding: `calc(clamp(var(--space-4), 4vw, var(--space-12)) * ${multiplier})`,
                ...props.style
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export const useResponsiveFontSize = () => {
    const getFontSize = (min: number, preferred: number, max: number) => {
        return `clamp(var(--font-size-${min}), calc(100vw - ${preferred}px), var(--font-size-${max}))`;
    };

    const getH1 = () => getFontSize(4, 48, 5);
    const getH2 = () => getFontSize(3, 40, 4);
    const getH3 = () => getFontSize(3, 36, 3);
    const getH4 = () => getFontSize(2, 32, 2);
    const getH5 = () => getFontSize(1, 24, 1);
    const getH6 = () => getFontSize(1, 20, 1);
    const getBody = () => getFontSize(1, 16, 1);
    const getSmall = () => getFontSize(1, 14, 1);
    const getTiny = () => getFontSize(1, 12, 1);

    return {
        h1: getH1,
        h2: getH2,
        h3: getH3,
        h4: getH4,
        h5: getH5,
        h6: getH6,
        body: getBody,
        small: getSmall,
        tiny: getTiny
    };
};

export const useFluidSpacing = () => {
    const getSpacing = (min: number, multiplier: number, max: number) => {
        return `clamp(var(--space-${min}), ${multiplier}vw, var(--space-${max}))`;
    };

    return {
        xs: getSpacing(1, 0.5, 2),
        sm: getSpacing(2, 1, 4),
        md: getSpacing(4, 2, 6),
        lg: getSpacing(6, 3, 8),
        xl: getSpacing(8, 4, 12),
        '2xl': getSpacing(12, 6, 16)
    };
};