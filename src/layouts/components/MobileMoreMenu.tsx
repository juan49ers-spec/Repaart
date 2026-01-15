import React from 'react';
import { LucideIcon, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface MenuItem {
    path: string;
    label: string;
    icon: LucideIcon;
}

interface MobileMoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
    items: MenuItem[];
}

const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({ isOpen, onClose, items }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex flex-end justify-end"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" />

            {/* Drawer */}
            <div
                className="relative w-full max-w-[280px] bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-right duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Más</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Cerrar menú">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-80px)]">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                                    flex items-center gap-4 p-4 rounded-2xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }
                                `}
                            >
                                <div className={`p-2.5 rounded-xl ${item.path.includes('support') ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    <Icon size={20} />
                                </div>
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>

                {/* Visual indicator at the bottom */}
                <div className="absolute bottom-10 left-0 right-0 p-6 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Repaart v4.1</p>
                </div>
            </div>
        </div>
    );
};

export default MobileMoreMenu;
