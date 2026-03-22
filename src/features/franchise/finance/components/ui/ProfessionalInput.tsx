import { cn } from '../../../../../lib/utils';

interface ProfessionalInputProps {
    label: string;
    value: number | string | undefined;
    onChange: (value: number) => void;
    prefix?: string;
    suffix?: string;
    type?: string;
    className?: string;
    placeholder?: string;
    size?: 'small' | 'medium' | 'default';
    readOnly?: boolean;
    disabled?: boolean;
    taxType?: 'standard' | 'exempt' | 'none';
}

export const ProfessionalInput: React.FC<ProfessionalInputProps> = ({
    label,
    value,
    onChange,
    prefix,
    suffix,
    type = "number",
    className,
    placeholder,
    size = "default",
    readOnly = false,
    disabled = false,
    taxType = 'none'
}) => {
    const heightClass = size === 'small' ? 'h-8' : size === 'medium' ? 'h-9' : 'h-10';

    const getTaxColors = () => {
        if (readOnly || disabled) return 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800';
        
        switch (taxType) {
            case 'standard':
                return 'bg-blue-50/50 dark:bg-blue-900/20 border-slate-200 dark:border-slate-700 border-l-[3px] border-l-blue-500 dark:border-l-blue-500 hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 text-blue-900 dark:text-blue-100';
            case 'exempt':
                return 'bg-amber-50/50 dark:bg-amber-900/20 border-slate-200 dark:border-slate-700 border-l-[3px] border-l-amber-400 dark:border-l-amber-500 hover:border-amber-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 text-amber-900 dark:text-amber-100';
            default:
                return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10';
        }
    };

    return (
        <div className={cn("group flex flex-col gap-0.5", className)}>
            <div className="flex items-center justify-between">
                <label className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-none truncate">
                    {label}
                </label>
            </div>
            <div className={cn(
                "flex items-center rounded-lg overflow-hidden transition-all duration-150 border",
                heightClass,
                getTaxColors()
            )}>
                {prefix && (
                    <span className={cn(
                        "pl-2.5 pr-1.5 text-[11px] font-semibold select-none shrink-0",
                        (readOnly || disabled) ? "text-slate-400 dark:text-slate-500" :
                        taxType === 'standard' ? "text-blue-500 dark:text-blue-400" :
                        taxType === 'exempt' ? "text-amber-500 dark:text-amber-400" :
                        "text-slate-400 dark:text-slate-500"
                    )}>
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={e => {
                        if (readOnly || disabled) return;
                        onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value as unknown as number);
                    }}
                    placeholder={placeholder || "0"}
                    readOnly={readOnly}
                    disabled={disabled}
                    className={cn(
                        "w-full min-w-0 bg-transparent border-none font-mono font-medium focus:ring-0 placeholder-slate-300 dark:placeholder-slate-600",
                        prefix ? 'pl-0 pr-2.5' : 'px-2.5',
                        size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-sm',
                        (readOnly || disabled) ? 'cursor-default text-slate-500 dark:text-slate-400' : (
                            taxType === 'standard' ? 'text-blue-900 dark:text-blue-100' :
                            taxType === 'exempt' ? 'text-amber-900 dark:text-amber-100' :
                            'text-slate-900 dark:text-white'
                        )
                    )}
                />
                {suffix && (
                    <span className={cn(
                        "pr-2.5 pl-1.5 text-[11px] font-semibold select-none shrink-0",
                        (readOnly || disabled) ? "text-slate-400 dark:text-slate-500" :
                        taxType === 'standard' ? "text-blue-500 dark:text-blue-400" :
                        taxType === 'exempt' ? "text-amber-500 dark:text-amber-400" :
                        "text-slate-400 dark:text-slate-500"
                    )}>
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
};
