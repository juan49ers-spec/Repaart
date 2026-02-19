import { useState, useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';

/* ─── Easing: easeOutExpo para "aterrizaje" suave ─── */
const easeOutExpo = (t: number): number =>
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/* ─── Hook: useAnimatedCounter ─── */
interface UseAnimatedCounterOptions {
    end: number;
    duration?: number;
    decimals?: number;
    start?: number;
    delay?: number;
}

function getInitialValue(end: number, decimals: number): number {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return Number(end.toFixed(decimals));
    }
    return 0;
}

export function useAnimatedCounter({
    end,
    duration = 1200,
    decimals = 0,
    start = 0,
    delay = 0,
}: UseAnimatedCounterOptions): number {
    const [value, setValue] = useState(() => getInitialValue(end, decimals));
    const prefersReducedMotion = useRef(
        typeof window !== 'undefined'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false
    );

    useEffect(() => {
        if (prefersReducedMotion.current) return;

        let rafId: number;
        let startTime: number | null = null;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (end - start) * easeOutExpo(progress);
            setValue(Number(current.toFixed(decimals)));

            if (progress < 1) {
                rafId = requestAnimationFrame(step);
            }
        };

        const timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(step);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [end, duration, decimals, start, delay]);

    return value;
}

/* ─── Componente: AnimatedCounter ─── */
interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    decimals?: number;
    delay?: number;
    formatted?: boolean;
    className?: string;
}

const formatNumber = (num: number, decimals: number): string => {
    const fixed = num.toFixed(decimals);
    const [integer, decimal] = fixed.split('.');
    const withSeparator = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimal ? `${withSeparator},${decimal}` : withSeparator;
};

export const AnimatedCounter = ({
    value,
    prefix = '',
    suffix = '',
    duration = 1200,
    decimals = 0,
    delay = 0,
    formatted = true,
    className,
}: AnimatedCounterProps) => {
    const animatedValue = useAnimatedCounter({
        end: value,
        duration,
        decimals,
        delay,
    });

    const displayValue = formatted
        ? formatNumber(animatedValue, decimals)
        : animatedValue.toFixed(decimals);

    return (
        <span className={cn('tabular-nums', className)}>
            {prefix}{displayValue}{suffix}
        </span>
    );
};

export default AnimatedCounter;
