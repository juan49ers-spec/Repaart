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
    isRider?: boolean;
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
    isAdmin,
    isFranchise,
    targetFranchiseName,
    onExport,
    chatData,
    outletContext,
    isRider
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

    const headerProps: HeaderProps = {
        isAdmin,
        isFranchise,
        isRider,
        targetFranchiseName: targetFranchiseName || undefined,
        onExport,
        onOpenHelp: openHelp
    };

    return (
        <div className="print:hidden viewport-fixed bg-slate-50 dark:bg-slate-950 font-sans relative transition-colors duration-300">
            <ImpersonationBanner />
            <Header {...headerProps} />

            {/* Main Content Area - Fixed Viewport with independent scroll */}
            <main className="scrollable-area w-full relative z-0 content-safe-bottom @container">
                <div className="content-wrapper py-2 md:pt-4 md:pb-8 animate-slide-up mx-auto">
                    {/* Pass context to Outlet */}
                    {outletContext ? <Outlet context={{ ...outletContext }} /> : children}
                </div>
            </main>

            {/* Bottom Tab Bar (Mobile Only) */}
            <BottomTabBar
                isAdmin={isAdmin}
                isFranchise={isFranchise}
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
        </div>
    );
};

export default React.memo(DashboardLayout);
