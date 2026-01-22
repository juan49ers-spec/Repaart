import React from 'react';
import { NavLink } from 'react-router-dom';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';

interface NavigationSidebarProps {
    isAdmin: boolean;
    isFranchise: boolean;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ isAdmin, isFranchise }) => {
    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : [];

    // Mapeo semántico inspirado en Flyder OS
    const sections = [
        {
            id: 'direccion',
            label: 'dirección',
            items: navItems.filter(i => ['Finanzas', 'Kanban'].includes(i.label))
        },
        {
            id: 'operacion',
            label: 'operación',
            items: navItems.filter(i => ['Operativa', 'Academia', 'Recursos'].includes(i.label))
        },
        {
            id: 'soporte',
            label: 'soporte',
            items: navItems.filter(i => ['Soporte', 'Configuración'].includes(i.label))
        }
    ];

    return (
        <aside className="hidden xl:flex flex-col w-[240px] h-screen sticky top-0 py-8 pl-8 pr-4 z-40">
            <div className="glass-premium rounded-[32px] h-full flex flex-col border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="flex-1 overflow-y-auto py-8 px-4 space-y-9 scrollbar-hide">

                    {sections.map((section) => section.items.length > 0 && (
                        <div key={section.id} className="space-y-4">
                            {/* Header semántico: minúsculas + wide tracking */}
                            <h4 className="text-[9px] font-black text-slate-400/80 uppercase tracking-[0.3em] pl-4 lowercase">
                                {section.label}
                            </h4>

                            <nav className="space-y-1.5">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) => `
                                            group flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300
                                            ${isActive
                                                ? 'bg-ruby-50 dark:bg-ruby-900/10 text-ruby-600 shadow-sm ring-1 ring-ruby-600/20'
                                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" strokeWidth={2.5} />
                                        <span className="text-[11px] font-extrabold tracking-tight">{item.label}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Footer del Sidebar con branding minimalista */}
                <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-ruby-500/20">
                            R
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">REPAART OS</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Admin Terminal</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default NavigationSidebar;
