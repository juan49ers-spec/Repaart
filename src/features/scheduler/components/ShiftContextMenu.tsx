import React, { useLayoutEffect, useEffect, useRef } from 'react';
import { Check, Copy, Trash2, Edit, X, Repeat } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ContextMenuShift {
    id: string;
    isConfirmed?: boolean;
    changeRequested?: boolean;
    isDraft?: boolean;
    startAt: string;
    endAt: string;
    [key: string]: unknown;
}

interface ShiftContextMenuProps {
    x: number;
    y: number;
    shift: ContextMenuShift;
    onClose: () => void;
    onValidate: (shift: ContextMenuShift) => void;
    onDuplicate: (shift: ContextMenuShift) => void;
    onEdit: (shift: ContextMenuShift) => void;
    onDelete: (shift: ContextMenuShift) => void;
    onMakeRecurring?: (shift: ContextMenuShift) => void;
}

export const ShiftContextMenu: React.FC<ShiftContextMenuProps> = ({
    x,
    y,
    shift,
    onClose,
    onValidate,
    onDuplicate,
    onEdit,
    onDelete,
    onMakeRecurring
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Adjust position to keep within viewport
    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let finalX = x;
            let finalY = y;

            if (x + rect.width > vw) finalX = x - rect.width;
            if (y + rect.height > vh) finalY = y - rect.height;

            // Prevent going off left/top if viewport is too small
            finalX = Math.max(10, finalX);
            finalY = Math.max(10, finalY);

            // Directly apply styles to DOM to avoid React inline-style lint
            menuRef.current.style.top = `${finalY}px`;
            menuRef.current.style.left = `${finalX}px`;
        }
    }, [x, y]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-100"
        >
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones Rápidas</span>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title="Cerrar menú"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="p-1.5 space-y-0.5">
                {!shift.isConfirmed && (
                    <button
                        onClick={() => { onValidate(shift); onClose(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-left"
                    >
                        <Check size={16} />
                        Validar Turno
                    </button>
                )}

                <button
                    onClick={() => { onDuplicate(shift); onClose(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                >
                    <Copy size={16} />
                    Duplicar (Día Siguiente)
                </button>

                {onMakeRecurring && (
                    <button
                        onClick={() => { onMakeRecurring(shift); onClose(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors text-left"
                    >
                        <Repeat size={16} />
                        Hacer Recurrente
                    </button>
                )}

                <button
                    onClick={() => { onEdit(shift); onClose(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                >
                    <Edit size={16} />
                    Editar
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

                <button
                    onClick={() => {
                        if (confirm('¿Seguro que quieres eliminar este turno?')) {
                            onDelete(shift);
                            onClose();
                        }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                >
                    <Trash2 size={16} />
                    Eliminar
                </button>
            </div>
        </div>,
        document.body
    );
};
