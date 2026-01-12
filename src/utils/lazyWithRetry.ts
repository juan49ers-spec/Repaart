import { lazy, ComponentType } from 'react';

/**
 * A wrapper for React.lazy that detects failure to load a chunk (often due to new deployments)
 * and forces a full page reload to fetch the latest version of the app.
 */
export const lazyWithRetry = (
    componentImport: () => Promise<{ default: ComponentType<any> }>
) =>
    lazy(async () => {
        // Check if we already tried reloading in the last 10 seconds to prevent loops
        const lastRetry = window.sessionStorage.getItem('last-chunk-retry');
        const now = Date.now();
        const isRecentlyRetried = lastRetry && (now - parseInt(lastRetry)) < 10000;

        try {
            return await componentImport();
        } catch (error) {
            console.error("[LAZY RETRY] Failed to load component:", error);

            if (!isRecentlyRetried) {
                window.sessionStorage.setItem('last-chunk-retry', now.toString());
                console.warn("[LAZY RETRY] Outdated chunk detected. Forcing app reload...");
                window.location.reload();
                return { default: () => null } as any; // Temporary return while reloading
            }

            // If it still fails after a reload, throw the error to the ErrorBoundary
            throw error;
        }
    });
