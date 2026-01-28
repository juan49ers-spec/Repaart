import React from 'react';

export interface RiderTab {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
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
            <div className="sticky top-0 z-10 py-4 bg-gradient-to-b from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95">
                <nav className="glass-premium rounded-full p-1.5 border border-white/20 dark:border-white/10 shadow-2xl">
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
                                        relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full 
                                        transition-all duration-300 font-black uppercase tracking-tighter text-[10px]
                                        ${isActive
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-[1.02]'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <Icon size={14} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {hasNotification && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center shadow-lg animate-pulse">
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