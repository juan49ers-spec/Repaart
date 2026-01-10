
import { type FC } from 'react';
import { LayoutDashboard, Calendar, Truck, Users, DollarSign, type LucideIcon } from 'lucide-react';

type TabId = 'summary' | 'scheduler' | 'finance' | 'motos' | 'riders';

interface Tab {
    id: TabId;
    label: string;
    icon: LucideIcon;
}

interface OperationsTabsProps {
    activeTab: TabId;
    onTabChange: (tabId: TabId) => void;
}

const OperationsTabs: FC<OperationsTabsProps> = ({ activeTab, onTabChange }) => {
    const tabs: Tab[] = [
        { id: 'summary', label: 'Resumen', icon: LayoutDashboard },
        { id: 'scheduler', label: 'Planificador', icon: Calendar },
        { id: 'finance', label: 'Finanzas', icon: DollarSign }, // Nuevo Tab 💰
        { id: 'motos', label: 'Flota', icon: Truck },
        { id: 'riders', label: 'Riders', icon: Users },
    ];

    return (
        <div className="px-6 border-b border-slate-200 bg-white flex gap-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap outline-none px-2
                            ${isActive
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 rounded-t-lg'
                            }
                        `}
                    >
                        <Icon size={16} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default OperationsTabs;
