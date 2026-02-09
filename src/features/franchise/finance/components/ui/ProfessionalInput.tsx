export const ProfessionalInput = ({
    label,
    value,
    onChange,
    prefix,
    suffix,
    type = "number",
    className,
    placeholder,
    size = "default",
    readOnly = false
}: any) => (
    <div className={`group relative ${className}`}>
        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-indigo-600 truncate">
            {label}
        </label>
        <div className={`
            flex items-center rounded-xl overflow-hidden transition-all duration-200
            ${readOnly
                ? 'bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10'
            }
            ${size === 'small' ? 'h-9' : 'h-11'}
        `}>
            {prefix && (
                <div className={`
                    pl-3 pr-2.5 text-[11px] font-bold select-none h-full flex items-center
                    ${readOnly
                        ? 'bg-transparent text-slate-400'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 border-r border-slate-100 dark:border-slate-700'
                    }
                `}>
                    {prefix}
                </div>
            )}
            <input
                type={type}
                value={value || ''}
                onChange={e => !readOnly && onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                placeholder={placeholder || "0"}
                readOnly={readOnly}
                className={`
                    w-full bg-transparent border-none text-slate-900 dark:text-white font-mono font-medium focus:ring-0 placeholder-slate-300 px-3
                    ${size === 'small' ? 'text-sm py-1' : 'text-base py-2'}
                    ${readOnly ? 'cursor-default text-slate-500' : ''}
                `}
            />
            {suffix && (
                <div className={`
                    pr-3 pl-2.5 text-[11px] font-bold select-none h-full flex items-center
                    ${readOnly
                        ? 'bg-transparent text-slate-400'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 border-l border-slate-100 dark:border-slate-700'
                    }
                `}>
                    {suffix}
                </div>
            )}
        </div>
    </div>
);
