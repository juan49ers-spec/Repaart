import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header, { HeaderProps } from './components/Header';
import BottomTabBar from './components/BottomTabBar';
import PageHelpModal from '../components/ui/modals/PageHelpModal';
import CommandPalette from '../components/ui/CommandPalette';
import { pageHelpData, PageHelpContent } from '../constants/pageHelpData';
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
    // chatData,
    outletContext,
    isRider
}) => {

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
        <div className="print:hidden viewport-fixed pt-safe bg-[#F8FAFC] dark:bg-[#0B0F19] font-sans relative transition-colors duration-300">
            <ImpersonationBanner />
            <Header {...headerProps} />

            {/* Main Content Area - Fixed Viewport with independent scroll */}
            <main className="scrollable-area w-full relative z-0 content-safe-bottom @container">
                <div className="content-wrapper py-2 md:pt-4 md:pb-8 animate-slide-up mx-auto">
                    {/* Pass context to Outlet */}
                    {children ? children : <Outlet context={outletContext || {}} />}
                </div>
            </main>

            {/* Bottom Tab Bar (Mobile Only) */}
            <BottomTabBar
                isAdmin={isAdmin}
                isFranchise={isFranchise}
            />

            {/* Page Help Modal */}
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
