import React from 'react';
import { Micro } from './Typography';

interface DataRowProps {
    label: string;           // Ej: "IVA"
    value: string;           // Ej: "1.684,62€"
    color?: string;          // Clase de color para el punto (ej: "bg-indigo-500")
    secondaryText?: string;  // Ej: "31 ene 2026" (Opcional)
    icon?: React.ReactNode;  // Icono derecho (Opcional)
    className?: string;      // Para flexibilidad extra si es necesario
}

export const DataRow: React.FC<DataRowProps> = ({
    label,
    value,
    color = "bg-slate-400",
    secondaryText,
    icon,
    className = ""
}) => {
    return (
        <div className={`flex w-full items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 border border-slate-100 dark:border-slate-800 ${className}`}>

            {/* IZQUIERDA: Etiqueta (Wrap enabled) + Valor (Protected) */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} />
                    <Micro className="whitespace-normal leading-tight text-left min-w-0">{label}</Micro>
                </div>
                <span className="tabular-nums font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap flex-shrink-0">
                    {value}
                </span>
            </div>

            {/* DERECHA: Metadatos (Opcional) - Stack on mobile if needed via classes, but here we keep simple right align */}
            {(secondaryText || icon) && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 pl-2 flex-shrink-0">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    {secondaryText && (
                        <span className="tabular-nums whitespace-nowrap">
                            {secondaryText}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
