import { useState, useRef, useEffect, type FC } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
    value: string | number;
    label: string;
}

interface GlassDropdownProps {
    options: DropdownOption[];
    value?: string | number;
    onChange: (e: { target: { value: string | number } }) => void;
    placeholder?: string;
    className?: string;
}

const GlassDropdown: FC<GlassDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (option: DropdownOption) => {
        onChange({ target: { value: option.value } }); // Mimic native event for compatibility
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between
                    px-4 py-2.5 rounded-xl
                    bg-slate-900/50 backdrop-blur-md
                    border border-slate-700
                    text-sm font-medium text-white
                    hover:bg-slate-800/60 hover:border-slate-600
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                    ${isOpen ? 'ring-2 ring-indigo-500/50 border-indigo-500/50' : ''}
                `}
            >
                <span className={selectedOption ? 'text-white' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 origin-top-right bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option)}
                                className={`
                                    w-full flex items-center justify-between px-4 py-2.5 text-sm text-left
                                    transition-colors duration-150
                                    ${value === option.value
                                        ? 'bg-indigo-600/20 text-indigo-300'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <span>{option.label}</span>
                                {value === option.value && (
                                    <Check className="w-4 h-4 text-indigo-400" />
                                )}
                            </button>
                        ))}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                                No hay opciones
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlassDropdown;
