import { type FC } from 'react';
import logoFull from '../../assets/repaart-logo-full.png';

interface RepaartLogoProps {
    className?: string; // Standard className for sizing (e.g. h-10 w-auto)
    variant?: 'color' | 'white' | 'dark';
    animated?: boolean;    // Deprecated
    interactive?: boolean; // Controls cursor only
    iconOnly?: boolean;    // New prop for Icon-only mode (Rail sidebar)
}

/**
 * RepaartLogo - User Custom Version
 * 
 * Renders the specific SVG file provided by the user: "LOGO REPAART.svg" (renamed).
 * Ignores variants as the user wants THIS specific image.
 */
export const RepaartLogo: FC<RepaartLogoProps> = ({
    className = "h-10 w-auto",
    interactive = false,
    iconOnly = false
}) => {
    return (
        <img
            src={logoFull}
            alt="Repaart"
            // If iconOnly, we might ideally swap src to a symbol. 
            // For now, we rely on the parent to crop or sizing, 
            // but we accept the prop to fix the TS error.
            className={`${className} ${interactive ? 'cursor-pointer' : ''} ${iconOnly ? 'object-left object-contain' : ''}`}
        />
    );
};
