import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/design-tokens.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ui/feedback/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { registerServiceWorker, checkConnectivity } from './services/pwaService';

// --- SERVICE WORKER REGISTRATION ---

const PWAWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        const registerPWA = async () => {
            await registerServiceWorker();
            const { cleanup } = checkConnectivity();
            return cleanup;
        };

        registerPWA().then(cleanup => {
            if (cleanup && typeof cleanup === 'function') {
                return cleanup;
            }
        }).catch(console.error);
    }, []);

    return <>{children}</>;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection, formerly cacheTime)
            refetchOnWindowFocus: false, // Prevent too many re-fetches
            retry: 1
        }
    }
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <PWAWrapper>
            <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <ToastProvider>
                            <ThemeProvider>
                                <BrowserRouter>
                                    <App />
                                </BrowserRouter>
                            </ThemeProvider>
                        </ToastProvider>
                    </AuthProvider>
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
            </ErrorBoundary>
        </PWAWrapper>
    </React.StrictMode>,
);
