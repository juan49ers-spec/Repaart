import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import NavigationSidebar from './components/NavigationSidebar';
import BottomTabBar from './components/BottomTabBar';
import ChatAssistant from './components/ChatAssistant';
import PageHelpModal from '../components/ui/modals/PageHelpModal';
import CommandPalette from '../components/ui/CommandPalette';
import { pageHelpData, PageHelpContent } from '../constants/pageHelpData';

// Define explicit types for props
import { useAppStore } from '../store/useAppStore';

// Define explicit types for props
interface DashboardLayoutProps {
    children?: React.ReactNode;
    isAdmin: boolean;
    isFranchise: boolean;
    viewMode?: string;
    setViewMode?: (mode: string) => void;
    franchiseView?: string;
    setFranchiseView?: (view: string) => void;
    targetFranchiseName?: string | null;

    // Data Control Props
    // selectedMonth & onMonthChange REMOVED (Handled by Store)
    // viewPeriod?: string; -> REMOVED
    // setViewPeriod?: (period: string) => void; -> REMOVED

    // Actions
    onExport: () => void;
    onPrint?: () => void;
    saving?: boolean;

    chatData?: { report: unknown };
    outletContext?: unknown;
}

import ImpersonationBanner from '../components/ImpersonationBanner';

/**
 *  DashboardLayout
 * Wrapper for the main dashboard shell (Sidebar + Header + Bottom Tab Bar).
 * Handles persistent layout state like isSidebarOpen.
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    // Navigation / View Props
    isAdmin,
    isFranchise,
    viewMode,
    setViewMode,
    franchiseView,
    setFranchiseView,
    targetFranchiseName,

    // Actions
    onExport,
    onPrint,
    saving = false,

    // Chat Props
    chatData,
    outletContext
}) => {
    const {
        isSidebarOpen,
        toggleSidebar: setIsSidebarOpen,
        isChatOpen,
        toggleChat: setIsChatOpen
    } = useAppStore();

    // const [isSidebarOpen, setIsSidebarOpen] = useState(false); -> REMOVED
    const [helpContent, setHelpContent] = useState<PageHelpContent | null>(null);

    // Mobile Chat Toggle
    // const handleToggleChat = () => setIsChatOpen(!isChatOpen); -> REMOVED

    const openHelp = (id: string) => {
        const content = pageHelpData[id] || null;
        setHelpContent(content);
    };

    // Header Props Bundle
    const headerProps = {
        isAdmin, isFranchise, viewMode, setViewMode, franchiseView, setFranchiseView,
        // isSidebarOpen, setIsSidebarOpen, selectedMonth, -> REMOVED
        // viewPeriod, setViewPeriod, -> REMOVED
        targetFranchiseName: targetFranchiseName || undefined,
        saving,
        onExport, onPrint,
        // onMonthChange, -> REMOVED
        onOpenHelp: openHelp
    };

    return (
        <div className="print:hidden min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans relative transition-colors duration-300">
            {/* Sidebar Overlay (All Screens) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 z-[90] backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Navigation Sidebar (Mobile Only - Drawer) */}
            <NavigationSidebar isAdmin={isAdmin} isFranchise={isFranchise} />

            {/* Main Content Area - Full width */}
            <div className={`flex-1 flex flex-col transition-all duration-300 w-full xl:pl-20 2xl:pl-72`}>
                <ImpersonationBanner />
                <Header {...headerProps} />

                {/* Content Injection with correct mobile padding */}
                <main className="flex-1 overflow-y-auto w-full relative z-0 content-safe-bottom">
                    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-5 animate-slide-up">
                        {/* Pass context to Outlet */}
                        {outletContext ? <Outlet context={{ ...outletContext }} /> : children}
                    </div>
                </main>
            </div>

            {/* Bottom Tab Bar (Mobile Only) */}
            <BottomTabBar
                isAdmin={isAdmin}
                isFranchise={isFranchise}
            // Legacy view props might be ignored by new BottomTabBar with NavLinks, 
            // but kept for interface compatibility if needed transiently
            />

            {/* Controlled Chat Assistant */}
            <ChatAssistant
                contextData={chatData?.report}
                isOpen={isChatOpen || false}
                onClose={() => setIsChatOpen(false)}
            />

            <PageHelpModal
                isOpen={!!helpContent}
                content={helpContent}
                onClose={() => setHelpContent(null)}
            />

            <CommandPalette />
        </div >
    );
};

export default React.memo(DashboardLayout);
