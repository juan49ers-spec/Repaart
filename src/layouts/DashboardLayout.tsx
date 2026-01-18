import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header, { HeaderProps } from './components/Header';
import BottomTabBar from './components/BottomTabBar';
import ChatAssistant from './components/ChatAssistant';
import PageHelpModal from '../components/ui/modals/PageHelpModal';
import CommandPalette from '../components/ui/CommandPalette';
import { pageHelpData, PageHelpContent } from '../constants/pageHelpData';
import { useAppStore } from '../store/useAppStore';
import ImpersonationBanner from '../components/ImpersonationBanner';

interface DashboardLayoutProps {
    children?: React.ReactNode;
    isAdmin: boolean;
    isFranchise: boolean;
    viewMode?: string;
    setViewMode?: (mode: string) => void;
    franchiseView?: string;
    setFranchiseView?: (view: string) => void;
    targetFranchiseName?: string | null;
    onExport: () => void;
    onPrint?: () => void;
    saving?: boolean;
    chatData?: { report: unknown };
    outletContext?: unknown;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    // Navigation / View Props
    isAdmin,
    isFranchise,
    targetFranchiseName,

    // Actions
    onExport,

    // Chat Props
    chatData,
    outletContext
}) => {
    const {
        isChatOpen,
        toggleChat: setIsChatOpen
    } = useAppStore();

    const [helpContent, setHelpContent] = useState<PageHelpContent | null>(null);

    const openHelp = (id: string) => {
        const content = pageHelpData[id] || null;
        setHelpContent(content);
    };

    // Header Props Bundle - Only passing what Header actually uses
    const headerProps: HeaderProps = {
        isAdmin,
        isFranchise,
        targetFranchiseName: targetFranchiseName || undefined,
        onExport,
        onOpenHelp: openHelp
    };

    return (
        <div className="print:hidden min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans relative transition-colors duration-300">
            {/* Main Content Area - Full width */}
            <div className={`flex-1 flex flex-col transition-all duration-300 w-full`}>
                <ImpersonationBanner />
                <Header {...headerProps} />

                {/* Content Injection with correct mobile padding */}
                <main className="flex-1 overflow-y-auto w-full relative z-0 content-safe-bottom">
                    <div className="mx-auto w-full px-2 sm:px-4 lg:px-6 py-4 md:py-5 animate-slide-up">
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
