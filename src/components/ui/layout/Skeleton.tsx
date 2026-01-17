import { type FC, type HTMLAttributes } from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: SkeletonVariant;
}

/**
 * Skeleton Component
 * Renders a pulsing placeholder to simulate content loading.
 * 
 * @param {string} className - Additional classes for sizing and spacing
 * @param {string} variant - 'text', 'circular', 'rectangular'
 */
const Skeleton: FC<SkeletonProps> = ({ className = '', variant = 'rectangular', ...props }) => {
    const baseClasses = "animate-pulse bg-slate-200/80 rounded";

    const variantClasses: Record<SkeletonVariant, string> = {
        text: "h-4 w-full rounded",
        circular: "rounded-full",
        rectangular: "h-full w-full rounded-md",
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
            {...props}
        />
    );
};

export default Skeleton;
