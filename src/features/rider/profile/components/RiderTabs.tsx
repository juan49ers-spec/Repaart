import React from 'react';

export interface RiderTab {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    path?: string;
    notificationCount?: number;
}

export interface RiderTabsProps {
    tabs: RiderTab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

const RiderTabs: React.FC<RiderTabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="rider-tabs">
            <div className="sticky top-0 z-10 py-4 bg-gradient-to-b from-white via-white/95 to-transparent">
                <nav className="bg-slate-50/80 backdrop-blur-xl rounded-full p-1.5 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const hasNotification = tab.notificationCount && tab.notificationCount > 0;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`
                                        relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full 
                                        transition-all duration-300 font-bold text-[11px] uppercase tracking-wider
                                        ${isActive
                                            ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border border-slate-200/50 scale-[1.02]'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                        }
                                    `}
                                >
                                    <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} strokeWidth={2.5} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {hasNotification && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                                            {tab.notificationCount! > 9 ? '9+' : tab.notificationCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
};

export default RiderTabs;