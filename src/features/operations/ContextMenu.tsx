import React, { useEffect } from 'react';
import { Edit2, Copy, Trash2, User, LucideIcon } from 'lucide-react';

interface Shift {
    id: string;
    riderName: string;
    startAt: string | Date;
    endAt: string | Date;
    [key: string]: any;
}

interface ContextMenuProps {
    visible: boolean;
    position: { x: number; y: number };
    shift: Shift | null;
    onClose: () => void;
    onEdit: (shift: Shift) => void;
    onCopy: (shift: Shift) => void;
    onDelete: (shift: Shift) => void;
    onReassign: (shift: Shift) => void;
}

interface MenuItem {
    icon: LucideIcon;
    label: string;
    shortcut: string;
    action: (shift: Shift) => void;
    color: string;
    separator?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, position, shift, onClose, onEdit, onCopy, onDelete, onReassign }) => {
    useEffect(() => {
        const handleClick = () => onClose();
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (visible) {
            document.addEventListener('click', handleClick);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [visible, onClose]);

    if (!visible || !shift) return null;

    const menuItems: MenuItem[] = [
        {
            icon: Edit2,
            label: 'Editar Turno',
            shortcut: 'Click',
            action: onEdit,
            color: 'hover:bg-blue-500/20 hover:text-blue-400'
        },
        {
            icon: Copy,
            label: 'Duplicar',
            shortcut: 'Ctrl+D',
            action: onCopy,
            color: 'hover:bg-emerald-500/20 hover:text-emerald-400'
        },
        {
            icon: User,
            label: 'Reasignar Rider',
            shortcut: '',
            action: onReassign,
            color: 'hover:bg-purple-500/20 hover:text-purple-400'
        },
        {
            icon: Trash2,
            label: 'Eliminar',
            shortcut: 'Del',
            action: onDelete,
            color: 'hover:bg-red-500/20 hover:text-red-400',
            separator: true
        }
    ];

    // Adjust position to stay on screen
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 220),
        y: Math.min(position.y, window.innerHeight - (menuItems.length * 40))
    };

    return (
        <div
            className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-fade-in"
            style={{
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`,
                minWidth: '200px'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700">
                <div className="text-xs font-bold text-slate-300">{shift.riderName}</div>
                <div className="text-[10px] text-slate-500">
                    {new Date(shift.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(shift.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
                {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <React.Fragment key={idx}>
                            {item.separator && <div className="border-t border-slate-700 my-1" />}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    item.action(shift);
                                    onClose();
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${item.color}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    <span className="text-slate-300">{item.label}</span>
                                </div>
                                {item.shortcut && (
                                    <span className="text-[10px] text-slate-500 font-mono">{item.shortcut}</span>
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default ContextMenu;
