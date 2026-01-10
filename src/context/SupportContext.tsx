import React, { createContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSupportManager } from '../hooks/useSupportManager';

// Define the shape of the context. 
// Since useSupportManager is what we are exposing, we can try to infer it 
// or use 'any' if useSupportManager is complex/not migrated yet. 
// Ideally we should import the return type from useSupportManager.
// For now, adhering to 'any' to unblock, but commenting for improvement.
export const SupportContext = createContext<any>(null);
SupportContext.displayName = 'SupportContext';

interface SupportProviderProps {
    children: ReactNode;
}

export const SupportProvider: React.FC<SupportProviderProps> = ({ children }) => {
    const { user } = useAuth();
    // Assuming useSupportManager handles user possibly being null
    const supportData = useSupportManager(user);

    return (
        <SupportContext.Provider value={supportData}>
            {children}
        </SupportContext.Provider>
    );
};
