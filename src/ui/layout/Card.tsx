import { type FC, type ReactNode, type HTMLAttributes } from 'react';

type CardVariant = 'flat' | 'low' | 'medium' | 'high' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    interactive?: boolean;
    noPadding?: boolean;
    children: ReactNode;
}

/**
 * Card Component - Professional surface container
 * 
 * @param {string} variant - Card elevation: 'flat' | 'low' | 'medium' | 'high' | 'elevated'
 * @param {string} className - Additional Tailwind classes
 * @param {boolean} interactive - Adds hover lift effect
 * @param {boolean} noPadding - Removes default padding
 * @param {React.ReactNode} children
 */
const Card: FC<CardProps> = ({
    variant = 'medium',
    interactive = false,
    noPadding = false,
    className = '',
    children,
    ...props
}) => {
    // Elevation mapping to utility classes
    const elevationClasses: Record<CardVariant, string> = {
        flat: 'elevation-none',
        low: 'elevation-sm',
        medium: 'elevation-md',
        high: 'elevation-lg',
        elevated: 'elevation-xl'
    };

    const baseClasses = 'surface-raised rounded-xl transition-all duration-200';
    const elevationClass = elevationClasses[variant] || elevationClasses.medium;
    const interactiveClass = interactive ? 'hover-lift cursor-pointer' : '';
    const paddingClass = noPadding ? '' : 'p-6';

    return (
        <div
            className={`${baseClasses} ${elevationClass} ${interactiveClass} ${paddingClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
