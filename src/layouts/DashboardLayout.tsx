import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import InputSidebar from './components/InputSidebar';
import BottomTabBar from './components/BottomTabBar';
import ChatAssistant from './components/ChatAssistant';
import PageHelpModal from '../ui/modals/PageHelpModal';
import { pageHelpData, PageHelpContent } from '../constants/pageHelpData';

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

    selectedMonth: string;
    onMonthChange: (month: string) => void;
    viewPeriod?: string;
    setViewPeriod?: (period: string) => void;

    onLogout: () => void;
    onExport: () => void;
    onPrint?: () => void;
    onCalculate?: (values: any) => void; // Using any for now, refine with proper SidebarData type if available

    sidebarData?: any; // Replace with concrete FinancialData type
    readOnly?: boolean;
    saving?: boolean;

    isChatOpen?: boolean;
    setIsChatOpen?: (isOpen: boolean) => void;
    chatData?: { report: any };
    outletContext?: any; // Allow flexible context for now, or define a specific interface
}

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

    // Data Control Props
    selectedMonth,
    onMonthChange,
    viewPeriod,
    setViewPeriod,

    // Actions
    onLogout,
    onExport,
    onPrint,
    onCalculate,

    // Sidebar Data
    sidebarData,
    readOnly = false,
    saving = false,

    // Chat Props
    isChatOpen,
    setIsChatOpen,
    chatData,
    outletContext // <--- NEW PROP for Router Context
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [helpContent, setHelpContent] = useState<PageHelpContent | null>(null);

    // Mobile Chat Toggle
    const handleToggleChat = () => setIsChatOpen && setIsChatOpen(!isChatOpen);

    const openHelp = (id: string) => {
        const content = pageHelpData[id] || null;
        setHelpContent(content);
    };

    // Header Props Bundle
    const headerProps = {
        isAdmin, isFranchise, viewMode, setViewMode, franchiseView, setFranchiseView,
        isSidebarOpen, setIsSidebarOpen, selectedMonth, viewPeriod, setViewPeriod,
        targetFranchiseName: targetFranchiseName || undefined,
        saving, onLogout,
        onExport, onPrint,
        onMonthChange,
        onOpenHelp: openHelp
    };

    return (
        <div className="print:hidden min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans relative transition-colors duration-300">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Input Panel) */}
            <InputSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                initialData={sidebarData}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
                onCalculate={onCalculate || (() => { })}
                readOnly={readOnly}
                onToggleChat={handleToggleChat}
                onOpenHelp={openHelp}
            />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${isSidebarOpen ? 'md:ml-96' : 'ml-0'}`}>
                <Header {...headerProps} />

                {/* Content Injection with bottom padding for tab bar */}
                <main className="flex-1 overflow-y-auto w-full" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 6rem))' }}>
                    {/* Pass context to Outlet so child routes can access data AND layout controls */}
                    {outletContext ? <Outlet context={{ ...outletContext, setIsSidebarOpen, isSidebarOpen }} /> : children}
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
                onClose={() => setIsChatOpen && setIsChatOpen(false)}
            />

            <PageHelpModal
                isOpen={!!helpContent}
                content={helpContent}
                onClose={() => setHelpContent(null)}
            />
        </div >
    );
};

export default React.memo(DashboardLayout);
