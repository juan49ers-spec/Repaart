import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface PremiumDockProps {
    activeTab: string;
    onGuideOpen: () => void;
    onAuditClick: () => void;
}

const PremiumDock: React.FC<PremiumDockProps> = ({
    activeTab,
    onGuideOpen,
    onAuditClick
}) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 20;
            setIsScrolled(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const guideButtonStyle = activeTab === 'guide' 
        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-lg glow-primary' 
        : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-white/10';

    const auditButtonStyle = activeTab === 'audit'
        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-lg glow-primary'
        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-white/60 dark:hover:bg-white/10';

    return (
        <div className="flex justify-end items-center gap-3 mb-2 sticky top-20 z-20">
            <div className={cn(
                "glass-premium-v2 rounded-2xl p-1.5 border transition-all duration-500",
                isScrolled ? "shadow-2xl" : "shadow-lg"
            )}>
                <div className="flex items-center gap-1.5">
                    {/* Guide Button */}
                    <button
                        onClick={onGuideOpen}
                        className={cn(
                            "relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 touch-target",
                            guideButtonStyle
                        )}
                        aria-label="Guía del sistema"
                    >
                        Guía
                    </button>

                    {/* Audit Button */}
                    <button
                        onClick={onAuditClick}
                        className={cn(
                            "relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 touch-target flex items-center gap-2",
                            auditButtonStyle
                        )}
                        aria-label="Auditoría del sistema"
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Auditoría
                    </button>

                    {/* Theme Toggle Placeholder */}
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-500" />
                    </div>
                </div>
            </div>

            {/* Bottom Glow Line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />
        </div>
    );
};

export default PremiumDock;
