import { type FC } from 'react';
import { type LucideIcon } from 'lucide-react';
import Button from '../inputs/Button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

const EmptyState: FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ""
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 md:p-16 text-center bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed animate-fade-in-up ${className}`}>
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 ring-4 ring-slate-50">
                {Icon && <Icon className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
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
