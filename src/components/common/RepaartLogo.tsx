import { type FC } from 'react';
import logoFull from '../../assets/repaart-logo-full.png';

interface RepaartLogoProps {
    className?: string; // Standard className for sizing (e.g. h-10 w-auto)
    variant?: 'color' | 'white' | 'dark';
    animated?: boolean;    // Deprecated
    interactive?: boolean; // Controls cursor only
}

/**
 * RepaartLogo - User Custom Version
 * 
 * Renders the specific SVG file provided by the user: "LOGO REPAART.svg" (renamed).
 * Ignores variants as the user wants THIS specific image.
 */
export const RepaartLogo: FC<RepaartLogoProps> = ({
    className = "h-10 w-auto",
    interactive = false
}) => {
    return (
        <img
            src={logoFull}
            alt="Repaart"
            className={`${className} ${interactive ? 'cursor-pointer' : ''}`}
        />
    );
};
