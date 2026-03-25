import React from 'react';
import { Outlet } from 'react-router-dom';
import { RiderBottomNav } from './components/RiderBottomNav';

export const RiderLayout: React.FC = () => {
    return (
        <div className="flex flex-col h-[100dvh] w-full bg-[#f4f7fb] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 overflow-hidden relative selection:bg-cyan-500/30 transition-colors duration-300">
            {/* Safe Area Top Spacer */}
            <div className="h-safe w-full bg-[#f4f7fb]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-[60]" />

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden hide-scrollbar z-10">
                <div className="max-w-md mx-auto w-full min-h-full px-0">
                    {/* pb-32 = espacio para nav flotante (~5rem nav + 3rem gap), mb-safe = home indicator dinámico */}
                    <div className="pb-32 mb-safe">
                        <Outlet />
                    </div>
                </div>
            </main>

            <RiderBottomNav />
        </div>
    );
};
