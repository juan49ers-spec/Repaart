import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-white dark:bg-slate-900 
                border border-slate-200 dark:border-slate-800 
                rounded-xl 
                shadow-sm 
                transition-all duration-200 
                relative overflow-hidden group
                w-full
                ${noPadding ? '' : 'p-4'}
                ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
                ${className}
            `}
        >
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </div>
    );
};

/**
 * ResponsiveCard - Card component with container queries support
 * 
 * Features:
 * - @container: Enables container queries for child elements
 * - Responsive padding: Adapts padding based on container size
 * - No hardcoded max-width: Adapts to parent container
 * - Fluid typography support
 * 
 * Breakpoints:
 * - @xs (300px): Compact padding (p-3)
 * - @sm (480px): Small padding (p-4)
 * - @md (768px): Medium padding (p-5)
 * - @lg (1024px+): Large padding (p-6)
 */
interface ResponsiveCardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    onClick?: () => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({ 
    children, 
    className = '', 
    noPadding = false, 
    onClick 
}) => {
    return (
        <div
            onClick={onClick}
            className={`
                @container
                bg-white dark:bg-slate-900 
                border border-slate-200 dark:border-slate-800 
                rounded-xl 
                shadow-sm 
                transition-all duration-200 
                relative overflow-hidden group
                w-full
                ${noPadding ? '' : 'p-3 @xs:p-2.5 @sm:p-3 @md:p-3.5 @lg:p-4'}
                ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
                ${className}
            `}
        >
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </div>
    );
};
