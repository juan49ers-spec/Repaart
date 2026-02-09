import { type FC, type FocusEvent } from 'react';
import { useFormContext, type RegisterOptions } from 'react-hook-form';
import { evaluateFormula } from '../../../../utils/finance';

interface SmartFinanceInputProps {
    name: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    rules?: RegisterOptions;
}

const SmartFinanceInput: FC<SmartFinanceInputProps> = ({
    name,
    label,
    placeholder,
    disabled = false,
    rules
}) => {
    // 1. Hook Form Context
    const { register, formState: { errors }, setValue } = useFormContext();

    // 2. Safe Error Extraction
    const error = errors[name];

    // 3. Smart Handlers
    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        if (!rawValue) return;

        // Formula Evaluation (starts with '=')
        if (rawValue.startsWith('=')) {
            try {
                const result = evaluateFormula(rawValue);
                // Sync with RHF immediate value update
                setValue(name, result, { shouldValidate: true, shouldDirty: true });
                // Also update the DOM input directly ensuring visual sync if RHF lags
                e.target.value = String(result);
            } catch {
                // console.warn("Formula error handled internally");
                // We leave the bad formula in place so user can fix it
            }
        }
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            {/* Label: Strict String */}
            {label && (
                <label htmlFor={name} className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            <input
                id={name}
                type="text" // CHANGED to TEXT to allow "=" formulas
                inputMode="decimal" // Mobile numeric keyboard hints
                disabled={disabled}
                placeholder={placeholder}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? `${name}-error` : undefined}
                className={`
          border p-2 rounded-md transition-colors focus:outline-none focus:ring-2
          ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white text-slate-900'}
        `}
                {...register(name, {
                    // Custom Parser: Handle Formula on Submit or internal flows
                    setValueAs: (v: string | number) => {
                        if (typeof v === 'string' && v.startsWith('=')) {
                            try {
                                return evaluateFormula(v);
                            } catch {
                                return 0; // Fallback or NaN? Safe fallback to 0.
                            }
                        }
                        return v === "" ? null : typeof v === 'string' ? parseFloat(v) : v;
                    },
                    ...rules
                })}
                // Handler Interception
                onBlur={(e) => {
                    handleBlur(e);
                    register(name).onBlur(e);
                }}
            />

            {/* Safe Error Rendering */}
            {error && (
                <span id={`${name}-error`} className="text-xs text-red-500 animate-pulse" role="alert">
                    {error.message?.toString() || "Error inválido"}
                </span>
            )}
        </div>
    );
};

export default SmartFinanceInput;
