import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary - Captura errores en componentes React
 * 
 * Prevents the entire app from crashing when a component fails.
 * Shows a user-friendly error message and allows recovery.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary onError={(error) => console.error(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          data-testid="error-boundary"
          className="min-h-[400px] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Algo salió mal
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left overflow-auto">
                <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
