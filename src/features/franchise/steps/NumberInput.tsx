import React from 'react';

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    min?: number;
    max?: number;
    step?: number;
}

/**
 * Validated number input with automatic safeguards:
 * - Prevents negative numbers (min=0 by default)
 * - Handles empty input gracefully
 * - Euro symbol suffix
 * - Proper decimal handling
 */
const NumberInput: React.FC<NumberInputProps> = ({
    value,
    onChange,
    placeholder = "0.00",
    className = "w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-3 pr-8 text-white focus:ring-1 focus:ring-rose-500 font-mono text-right",
    min = 0,
    max,
    step = 0.01
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Allow empty string for user to clear input
        if (val === '') {
            onChange(0);
            return;
        }

        const parsed = parseFloat(val);

        // Validate number
        if (isNaN(parsed)) {
            return; // Don't update if invalid
        }

        // Apply min/max constraints
        let finalValue = parsed;
        if (min !== undefined && finalValue < min) finalValue = min;
        if (max !== undefined && finalValue > max) finalValue = max;

        onChange(finalValue);
    };

    return (
        <div className="relative">
            <input
                type="number"
                value={value || ''}
                onChange={handleChange}
                className={className}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">€</span>
        </div>
    );
};

export default NumberInput;
