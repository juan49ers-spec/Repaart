import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
    content: string;
    children?: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    const [visible, setVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                className="cursor-help"
            >
                {children || <HelpCircle className="w-4 h-4 text-slate-400 hover:text-indigo-500 transition-colors" />}
            </div>
            {visible && (
                <div className={`absolute z-50 ${positionClasses[position]} w-64 pointer-events-none`}>
                    <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg p-3 shadow-2xl border border-slate-700">
                        <p className="leading-relaxed">{content}</p>
                        {/* Arrow */}
                        <div className={`absolute w-2 h-2 bg-slate-900 dark:bg-slate-800 border-slate-700 rotate-45 ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b' :
                                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t' :
                                    position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' :
                                        'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l'
                            }`} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tooltip;
