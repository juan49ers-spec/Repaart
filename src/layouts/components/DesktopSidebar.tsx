import React from 'react';
import { NavLink } from 'react-router-dom';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';
import { Shield, Briefcase, Zap } from 'lucide-react';

interface DesktopSidebarProps {
    isAdmin: boolean;
    isFranchise: boolean;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ isAdmin, isFranchise }) => {
    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : [];

    // Group items by semantic domain (inspired by Flyder OS)
    const strategicItems = navItems.filter(item => ['Finanzas', 'Kanban'].includes(item.label));
    const operationalItems = navItems.filter(item => ['Academia', 'Recursos', 'Operativa'].includes(item.label));
    const supportItems = navItems.filter(item => ['Soporte', 'Configuración'].includes(item.label));

    return (
        <aside className="hidden xl:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">

                {/* Section: Dirección / Estratégico */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 mb-4">
                        <Shield className="w-3 h-3 text-ruby-600" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dirección</h4>
                    </div>
                    {strategicItems.map((item) => (
                        <SidebarItem key={item.path} {...item} />
                    ))}
                </div>

                {/* Section: Operativa / Negocio */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 mb-4">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operación</h4>
                    </div>
                    {operationalItems.map((item) => (
                        <SidebarItem key={item.path} {...item} />
                    ))}
                </div>

                {/* Section: Soporte / Ajustes */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 mb-4">
                        <Briefcase className="w-3 h-3 text-indigo-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Soporte</h4>
                    </div>
                    {supportItems.map((item) => (
                        <SidebarItem key={item.path} {...item} />
                    ))}
                </div>
            </div>

            {/* Bottom Brand Badge */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[18px] border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-ruby-600 flex items-center justify-center text-white font-black text-xs">R</div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 dark:text-white">Admin Hub</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Premium Build</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const SidebarItem = ({ path, label, icon: Icon }: any) => (
    <NavLink
        to={path}
        className={({ isActive }) => `
            group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
            ${isActive
                ? 'bg-ruby-50 dark:bg-ruby-900/10 text-ruby-600 shadow-sm ring-1 ring-ruby-600/20'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }
        `}
    >
        <Icon className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
        <span className="text-xs font-bold tracking-tight">{label}</span>
    </NavLink>
);

export default DesktopSidebar;
