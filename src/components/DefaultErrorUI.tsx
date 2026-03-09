import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DefaultErrorUI({
    error,
    errorId,
    onReset
}: {
    error: Error | null;
    errorId: string | null;
    onReset: () => void;
}) {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
        onReset();
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                    Algo salió mal
                </h1>

                <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
                    Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
                </p>

                {error && (
                    <details className="mb-6 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <summary className="text-sm font-semibold text-red-700 dark:text-red-400 cursor-pointer mb-2">
                            Detalles técnicos
                        </summary>
                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">Error ID:</span>
                                <code className="ml-2 text-red-600 dark:text-red-400">{errorId || 'unknown'}</code>
                            </div>
                            <div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">Mensaje:</span>
                                <code className="ml-2 text-red-600 dark:text-red-400 block mt-1 break-all">
                                    {error.message}
                                </code>
                            </div>
                            {error.stack && (
                                <details className="mt-2">
                                    <summary className="text-red-600 dark:text-red-400 cursor-pointer">
                                        Stack trace
                                    </summary>
                                    <pre className="mt-2 text-red-500 dark:text-red-500 whitespace-pre-wrap break-all">
                                        {error.stack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </details>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleReload}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Recargar página
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <Home className="w-4 h-4" />
                        Ir al inicio
                    </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-6">
                    Si el problema persiste, contacta a soporte técnico.
                </p>
            </div>
        </div>
    );
}
