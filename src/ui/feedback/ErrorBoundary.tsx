import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log Error silently
        console.error('[CRITICAL UI FAIL]:', error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="h-full w-full min-h-[150px] bg-white rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-6 text-center shadow-sm animate-in fade-in duration-300">
                    <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">Módulo no disponible</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-[200px]">
                        Ha ocurrido un problema temporal con este componente.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                        <RefreshCw className="w-3 h-3" /> Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
