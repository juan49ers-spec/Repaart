import { type FC, type ReactNode, type ElementType } from 'react';
import { ArrowRight } from 'lucide-react';

interface BentoCardProps {
    title: string;
    subtitle?: string;
    value?: string | number;
    icon?: ElementType;
    children?: ReactNode;
    className?: string;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    onClick?: () => void;
    colSpan?: 1 | 2 | 3 | 4;
    rowSpan?: 1 | 2;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'purple';
}

const variantStyles = {
    default: 'from-white to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200 dark:border-slate-800',
    primary: 'from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900/50 border-blue-200 dark:border-blue-500/20',
    success: 'from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900/50 border-emerald-200 dark:border-emerald-500/20',
    warning: 'from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900/50 border-amber-200 dark:border-amber-500/20',
    purple: 'from-violet-50 to-white dark:from-violet-900/20 dark:to-slate-900/50 border-violet-200 dark:border-violet-500/20',
};

const iconColors = {
    default: 'text-slate-500 dark:text-slate-400',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    purple: 'text-violet-600 dark:text-violet-400',
};

const BentoCard: FC<BentoCardProps> = ({
    title,
    subtitle,
    value,
    icon: Icon,
    children,
    className = '',
    description,
    trend,
    trendValue,
    onClick,
    colSpan = 1,
    rowSpan = 1,
    variant = 'default',
}) => {
    const colClass = {
        1: 'col-span-1',
        2: 'col-span-1 md:col-span-2',
        3: 'col-span-1 md:col-span-3',
        4: 'col-span-1 md:col-span-2 lg:col-span-4',
    }[colSpan];

    const rowClass = {
        1: 'row-span-1',
        2: 'row-span-1 md:row-span-2',
    }[rowSpan];

    return (
        <div
            onClick={onClick}
            className={`
                ${colClass} ${rowClass}
                group relative overflow-hidden
                bg-gradient-to-br ${variantStyles[variant]}
                backdrop-blur-md border rounded-3xl p-6
                transition-all duration-300 hover:scale-[1.01] hover:shadow-xl dark:hover:shadow-2xl hover:border-opacity-100 dark:hover:border-opacity-50
                shadow-sm dark:shadow-none
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
        >
            {/* Background Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 dark:bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 ${iconColors[variant]} group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors shadow-inner`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-slate-900 dark:text-slate-200 font-bold text-sm tracking-wide transition-colors">{title}</h3>
                            {subtitle && <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">{subtitle}</p>}
                        </div>
                    </div>

                    {onClick && (
                        <div className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                            <ArrowRight className="w-5 h-5 text-slate-500" />
                        </div>
                    )}
                </div>

                {/* Main Value if present */}
                {value && (
                    <div className="mt-auto">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
                                {value}
                            </span>
                            {trendValue && (
                                <div className={`
                                    flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border
                                    ${trend === 'up' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                        trend === 'down' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' :
                                            'text-slate-400 border-slate-500/20 bg-slate-500/10'}
                                `}>
                                    {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '•'} {trendValue}
                                </div>
                            )}
                        </div>
                        {description && (
                            <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {/* Custom Content */}
                {children && <div className="mt-4 flex-1">{children}</div>}
            </div>
        </div>
    );
};

export default BentoCard;
