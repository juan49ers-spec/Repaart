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
}) => {
    const heightClass = size === 'small' ? 'h-8' : size === 'medium' ? 'h-9' : 'h-10';

    return (
        <div className={cn("group flex flex-col gap-1", className)}>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none truncate">
                {label}
            </label>
            <div className={cn(
                "flex items-center rounded-lg overflow-hidden transition-all duration-150",
                heightClass,
                readOnly || disabled
                    ? 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10'
            )}>
                {prefix && (
                    <span className="pl-2.5 pr-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 select-none shrink-0">
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
                        "w-full min-w-0 bg-transparent border-none text-slate-900 dark:text-white font-mono font-medium focus:ring-0 placeholder-slate-300 dark:placeholder-slate-600",
                        prefix ? 'pl-0 pr-2.5' : 'px-2.5',
                        size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-sm',
                        (readOnly || disabled) && 'cursor-default text-slate-500 dark:text-slate-400'
                    )}
                />
                {suffix && (
                    <span className="pr-2.5 pl-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 select-none shrink-0">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
};
