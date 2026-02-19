import { type FC } from 'react';
import { type LucideIcon, BarChart3, Calendar, Truck, Inbox } from 'lucide-react';
import { cn } from '../../../lib/utils';
import Button from '../inputs/Button';

/* ─── Ilustraciones SVG inline minimalistas ─── */
const illustrations: Record<string, FC<{ className?: string }>> = {
    finance: ({ className }) => (
        <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="45" width="12" height="25" rx="3" className="fill-slate-200 dark:fill-slate-700" />
            <rect x="28" y="30" width="12" height="40" rx="3" className="fill-slate-300 dark:fill-slate-600" />
            <rect x="46" y="20" width="12" height="50" rx="3" className="fill-indigo-200 dark:fill-indigo-800" />
            <rect x="64" y="10" width="12" height="60" rx="3" className="fill-indigo-400 dark:fill-indigo-600" />
            <path d="M16 42 L34 28 L52 18 L70 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-indigo-500" />
        </svg>
    ),
    schedule: ({ className }) => (
        <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="15" width="60" height="55" rx="8" className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" />
            <rect x="10" y="15" width="60" height="16" rx="8" className="fill-indigo-100 dark:fill-indigo-900" />
            <circle cx="28" cy="48" r="4" className="fill-indigo-400" />
            <circle cx="40" cy="48" r="4" className="fill-slate-300 dark:fill-slate-600" />
            <circle cx="52" cy="48" r="4" className="fill-slate-300 dark:fill-slate-600" />
            <circle cx="28" cy="60" r="4" className="fill-slate-300 dark:fill-slate-600" />
            <circle cx="40" cy="60" r="4" className="fill-emerald-400" />
        </svg>
    ),
    fleet: ({ className }) => (
        <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="30" width="50" height="25" rx="6" className="fill-slate-200 dark:fill-slate-700" />
            <rect x="20" y="25" width="30" height="15" rx="4" className="fill-indigo-200 dark:fill-indigo-800" />
            <circle cx="28" cy="58" r="6" className="fill-slate-400 dark:fill-slate-500" />
            <circle cx="52" cy="58" r="6" className="fill-slate-400 dark:fill-slate-500" />
            <circle cx="28" cy="58" r="3" className="fill-white dark:fill-slate-900" />
            <circle cx="52" cy="58" r="3" className="fill-white dark:fill-slate-900" />
        </svg>
    ),
    generic: ({ className }) => (
        <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="15" width="50" height="50" rx="12" className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" />
            <path d="M30 45 L40 35 L50 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400" />
            <circle cx="40" cy="52" r="3" className="fill-indigo-400" />
        </svg>
    ),
};

const defaultIcons: Record<string, LucideIcon> = {
    finance: BarChart3,
    schedule: Calendar,
    fleet: Truck,
    generic: Inbox,
};

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    /** Ilustración SVG temática */
    illustration?: 'finance' | 'schedule' | 'fleet' | 'generic';
}

const EmptyState: FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = '',
    illustration = 'generic',
}) => {
    const IllustrationSvg = illustrations[illustration];
    const FallbackIcon = Icon || defaultIcons[illustration] || Inbox;

    return (
        <div className={cn(
            'flex flex-col items-center justify-center p-8 md:p-16 text-center',
            'bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl',
            'border border-dashed border-slate-200 dark:border-slate-700',
            'animate-fade-in-up',
            className
        )}>
            {/* Ilustración SVG o icono fallback */}
            {IllustrationSvg ? (
                <div className="w-20 h-20 md:w-24 md:h-24 mb-4 opacity-60">
                    <IllustrationSvg className="w-full h-full" />
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm mb-4 ring-4 ring-slate-50 dark:ring-slate-700">
                    <FallbackIcon className="w-8 h-8 md:w-10 md:h-10 text-slate-400 dark:text-slate-500" />
                </div>
            )}

            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
