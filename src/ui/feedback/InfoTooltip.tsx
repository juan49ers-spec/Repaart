import { type FC } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
    text: string;
    className?: string;
}

const InfoTooltip: FC<InfoTooltipProps> = ({ text, className = "" }) => (
    <div className={`group relative inline-flex ml-2 z-20 ${className}`}>
        <Info className="w-4 h-4 text-slate-300 hover:text-indigo-500 cursor-help transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block min-w-[200px] max-w-xs bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 pointer-events-none whitespace-normal break-words z-[110]">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
    </div>
);

export default InfoTooltip;
