import { Component, ErrorInfo, ReactNode, useCallback } from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { ServiceError } from '../../utils/ServiceError';
import { useToast } from '../../hooks/useToast';

// =====================================================
// PROPS & STATE
// =====================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 'page' = fallback pantalla completa, 'widget' = fallback inline compact */
  level?: 'page' | 'widget';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Si true, muestra toast de error automáticamente */
  showToast?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// =====================================================
// CORE CLASS COMPONENT
// =====================================================

/**
 * ErrorBoundary mejorado — Captura errores en componentes React
 * con dos niveles de fallback (page/widget) y notificación toast.
 *
 * Integra con ServiceError para mensajes user-friendly.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { error } = this.state;
    const level = this.props.level ?? 'page';

    // Extraer mensaje user-friendly si es ServiceError
    const userMessage = error instanceof ServiceError
      ? error.userMessage
      : 'Ha ocurrido un error inesperado.';

    const isRecoverable = error instanceof ServiceError
      ? error.recoverable
      : true;

    const isNetworkError = error instanceof ServiceError && error.code === 'NETWORK';

    if (level === 'widget') {
      return <WidgetFallback
        message={userMessage}
        isRecoverable={isRecoverable}
        isNetwork={isNetworkError}
        onRetry={this.handleReset}
        devError={error}
      />;
    }

    return <PageFallback
      message={userMessage}
      isRecoverable={isRecoverable}
      isNetwork={isNetworkError}
      onRetry={this.handleReset}
      devError={error}
    />;
  }
}

// =====================================================
// FALLBACK UIs
// =====================================================

interface FallbackProps {
  message: string;
  isRecoverable: boolean;
  isNetwork: boolean;
  onRetry: () => void;
  devError: Error | null;
}

/** Fallback para nivel page — pantalla completa */
function PageFallback({ message, isRecoverable, isNetwork, onRetry, devError }: FallbackProps) {
  const ErrorIcon = isNetwork ? WifiOff : AlertTriangle;

  return (
    <div
      data-testid="error-boundary"
      className="min-h-[400px] flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ErrorIcon className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          {isNetwork ? 'Sin conexión' : 'Algo salió mal'}
        </h2>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {message}
        </p>

        {process.env.NODE_ENV === 'development' && devError && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left overflow-auto">
            <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
              {devError.message}
            </pre>
          </div>
        )}

        {isRecoverable && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}

/** Fallback para nivel widget — compacto, inline */
function WidgetFallback({ message, isRecoverable, isNetwork, onRetry }: FallbackProps) {
  const ErrorIcon = isNetwork ? WifiOff : AlertTriangle;

  return (
    <div
      data-testid="error-boundary-widget"
      className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-xl"
    >
      <ErrorIcon className="w-5 h-5 text-rose-500 flex-shrink-0" />
      <p className="text-sm text-rose-700 dark:text-rose-300 flex-1">{message}</p>
      {isRecoverable && (
        <button
          onClick={onRetry}
          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
          title="Reintentar"
        >
          <RefreshCw className="w-4 h-4 text-rose-500" />
        </button>
      )}
    </div>
  );
}

// =====================================================
// TOAST WRAPPER (Functional — accede a hooks)
// =====================================================

/**
 * Wrapper funcional que añade notificación toast al ErrorBoundary.
 * Usa useToast internamente para mostrar el error al usuario.
 *
 * Uso:
 * ```tsx
 * <ErrorBoundaryWithToast level="widget">
 *   <MyWidget />
 * </ErrorBoundaryWithToast>
 * ```
 */
export function ErrorBoundaryWithToast({
  children,
  level = 'page',
  ...rest
}: ErrorBoundaryProps) {
  const toastCtx = useToast();

  const handleError = useCallback((error: Error) => {
    const message = error instanceof ServiceError
      ? error.userMessage
      : 'Ha ocurrido un error inesperado.';

    toastCtx?.toast.error(message);
  }, [toastCtx]);

  return (
    <ErrorBoundary level={level} onError={handleError} {...rest}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
