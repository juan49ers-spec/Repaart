import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface WidgetInfoTooltipProps {
    title: string;
    description: React.ReactNode;
}

const WidgetInfoTooltip: React.FC<WidgetInfoTooltipProps> = ({ title, description }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        // Position it somewhat to the bottom right of the icon, with some margins to stay in viewport
        let l = rect.left + rect.width / 2;
        const t = rect.bottom + 10;
        
        // Basic clamp
        if (l + 320 > window.innerWidth) {
            l = window.innerWidth - 330;
        }
        
        setCoords({ top: t, left: l });
    };

    const handleMouseEnter = () => {
        updatePosition();
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        } else {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block z-10" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                ref={triggerRef}
                type="button"
                className="p-1.5 rounded-full bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shadow-sm"
            >
                <Info className="w-3.5 h-3.5" />
            </button>
            {isOpen && createPortal(
                <div 
                    className="fixed z-[9999] w-72 sm:w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 overflow-hidden" 
                    style={{ top: coords.top, left: coords.left }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full mix-blend-screen pointer-events-none" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2 relative z-10">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        {title}
                    </h4>
                    <div className="text-[11px] leading-relaxed text-slate-300 relative z-10">
                        {description}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default WidgetInfoTooltip;
