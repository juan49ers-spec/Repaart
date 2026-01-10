import { useState, useCallback } from 'react';

export type ViewMode = 'dashboard' | 'franchise_detail' | string;

export interface AppNavigation {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    franchiseView: string;
    setFranchiseView: (view: string) => void;
    targetFranchiseId: string | null;
    targetFranchiseName: string | null;
    handleAdminSelectFranchise: (uid: string, name: string) => void;
    resetView: () => void;
    setTargetFranchiseId: (id: string | null) => void;
    setTargetFranchiseName: (name: string | null) => void;
}

export const useAppNavigation = (initialView: ViewMode = 'dashboard'): AppNavigation => {
    const [viewMode, setViewMode] = useState<ViewMode>(initialView);
    const [franchiseView, setFranchiseView] = useState<string>('cockpit');
    const [targetFranchiseId, setTargetFranchiseId] = useState<string | null>(null);
    const [targetFranchiseName, setTargetFranchiseName] = useState<string | null>(null);

    const handleAdminSelectFranchise = useCallback((uid: string, name: string) => {
        setTargetFranchiseId(uid);
        setTargetFranchiseName(name);
        setViewMode('franchise_detail');
    }, []);

    // Reset to default dashboard view
    const resetView = useCallback(() => {
        setViewMode('dashboard');
        setTargetFranchiseId(null);
        setTargetFranchiseName(null);
    }, []);

    return {
        viewMode,
        setViewMode,
        franchiseView,
        setFranchiseView,
        targetFranchiseId,
        targetFranchiseName,
        handleAdminSelectFranchise,
        resetView,
        setTargetFranchiseId, // Exposed if needed for direct manipulation
        setTargetFranchiseName
    };
};
