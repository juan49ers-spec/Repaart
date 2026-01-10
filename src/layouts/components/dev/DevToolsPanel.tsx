import React, { useState, useEffect } from 'react';
import {
    Wrench,
    Database,
    Trash2,
    Search,
    CheckCircle,
    AlertTriangle,
    Download,
    RefreshCw,
    Bug,
    ChevronDown,
    ChevronRight,
    FileText,
    Zap,
    Shield,
    Package,
    Info,
    Activity,
    XCircle,
    Star,
    Calendar as CalendarIcon
} from 'lucide-react';
import { investigateAllFranchises } from '../../../scripts/cleanupFranchises';
import { executeCleanup } from '../../../scripts/executeCleanup';
import { investigateFinancialData } from '../../../scripts/investigateFinancialData';
import { verifyDataIntegrity, captureAppState, financialAudit } from '../../../scripts/devUtils';
import { runHealthCheck, HealthCheckResult } from '../../../scripts/healthCheck';
import ToastContainer, { useToast } from './ToastContainer';
import { getHistory, addToHistory, updateHistoryAction, formatDuration, HistoryAction } from '../../../scripts/actionHistory';
import ConsoleViewer from './ConsoleViewer';
import NetworkMonitor from './NetworkMonitor';
import PerformanceDashboard from './PerformanceDashboard';
import SchedulerInspector from './SchedulerInspector';

interface DevToolsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    usage: string;
    onClick: () => void;
    variant: 'purple' | 'indigo' | 'red' | 'amber' | 'green' | 'blue' | 'emerald';
    disabled?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, title, description, usage, onClick, variant, disabled, isFavorite, onToggleFavorite }) => {
    const [showInfo, setShowInfo] = useState(false);

    const colorMap = {
        purple: 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30 text-purple-400',
        indigo: 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 text-indigo-400',
        red: 'bg-red-600/20 hover:bg-red-600/30 border-red-500/30 text-red-400',
        amber: 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/30 text-amber-400',
        green: 'bg-green-600/20 hover:bg-green-600/30 border-green-500/30 text-green-400',
        blue: 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-400',
        emerald: 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30 text-emerald-400'
    };

    return (
        <div className="relative">
            <div className="relative">
                <div
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onClick={!disabled ? onClick : undefined}
                    onKeyDown={(e) => {
                        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onClick();
                        }
                    }}
                    className={`w-full flex items-start gap-3 p-3 border rounded-lg transition-all text-white group cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${colorMap[variant]}`}
                >
                    <div className="flex-shrink-0 mt-0.5">{icon}</div>
                    <div className="text-left flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{title}</p>
                            <div className="flex items-center gap-1">
                                {onToggleFavorite && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite();
                                        }}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                        title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                    >
                                        <Star className={`w-3 h-3 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500'}`} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(!showInfo);
                                    }}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                    title="Ver información"
                                >
                                    <Info className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                </div>
            </div>

            {showInfo && (
                <div className="mt-2 p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs">
                    <p className="text-slate-300 font-semibold mb-1">📖 Cómo usar:</p>
                    <p className="text-slate-400">{usage}</p>
                </div>
            )}
        </div>
    );
};

const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState<string | null>('health');
    const [isExecuting, setIsExecuting] = useState(false);
    const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [, setHistory] = useState<HistoryAction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [isNetworkOpen, setIsNetworkOpen] = useState(false);
    const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

    // Toast notifications
    const toast = useToast();

    // Load history on mount
    useEffect(() => {
        setHistory(getHistory());
    }, []);

    // Auto-run health check when panel opens
    useEffect(() => {
        if (isOpen && !healthResult) {
            performHealthCheck();
        }
    }, [isOpen]);

    const performHealthCheck = async () => {
        setIsCheckingHealth(true);
        try {
            const result = await runHealthCheck();
            setHealthResult(result);
        } catch (error) {
            console.error('Health check failed:', error);
        } finally {
            setIsCheckingHealth(false);
        }
    };



    const executeAction = async (actionName: string, action: () => Promise<any>): Promise<any> => {
        setIsExecuting(true);
        const startTime = Date.now();

        // Add to history as 'running'
        const historyEntry = addToHistory({
            name: actionName,
            status: 'running'
        });
        setHistory(getHistory());

        try {
            const result = await action();
            const duration = Date.now() - startTime;

            // Update history as success
            updateHistoryAction(historyEntry.id, {
                status: 'success',
                result,
                duration
            });
            setHistory(getHistory());

            // Show success toast
            toast.success(actionName, `Completado en ${formatDuration(duration)}`);

            console.log(`✅ ${actionName}`, result);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Update history as error
            updateHistoryAction(historyEntry.id, {
                status: 'error',
                error: errorMessage,
                duration
            });
            setHistory(getHistory());

            // Show error toast
            toast.error(actionName, errorMessage);

            console.error('❌ Error:', error);
            throw error;
        } finally {
            setIsExecuting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Toast Container */}
            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Wrench className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Developer Tools</h2>
                                <p className="text-xs text-slate-400">Herramientas de diagnóstico y control de código</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="px-6 py-4 border-b border-slate-800">
                        <input
                            type="text"
                            placeholder="🔍 Buscar herramientas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                        {/* Health Check Section - Always First */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveSection(activeSection === 'health' ? null : 'health')}
                                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-white"
                            >
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-emerald-400" />
                                    <span className="font-semibold">Health Check</span>
                                    {healthResult && (
                                        <span className="text-2xl">
                                            {healthResult.status === 'healthy' && '🟢'}
                                            {healthResult.status === 'warning' && '🟡'}
                                            {healthResult.status === 'critical' && '🔴'}
                                        </span>
                                    )}
                                </div>
                                {activeSection === 'health' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>

                            {activeSection === 'health' && (
                                <div className="ml-8 space-y-3">
                                    {/* Status Banner */}
                                    <div className={`p-4 rounded-lg border ${healthResult?.status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                        healthResult?.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                                            'bg-red-500/10 border-red-500/30'
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-3xl">
                                                    {healthResult?.status === 'healthy' && '🟢'}
                                                    {healthResult?.status === 'warning' && '🟡'}
                                                    {healthResult?.status === 'critical' && '🔴'}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-bold text-white">
                                                        {healthResult?.status === 'healthy' && 'Sistema Saludable'}
                                                        {healthResult?.status === 'warning' && 'Advertencias Detectadas'}
                                                        {healthResult?.status === 'critical' && 'Errores Críticos'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {healthResult?.timestamp.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={performHealthCheck}
                                                disabled={isCheckingHealth}
                                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                                            >
                                                {isCheckingHealth ? 'Escaneando...' : 'Re-scan'}
                                            </button>
                                        </div>

                                        {/* Check Results */}
                                        <div className="space-y-2">
                                            {healthResult?.checks.map((check, idx) => (
                                                <div key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded">
                                                    {check.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />}
                                                    {check.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                                                    {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold text-white">{check.name}</p>
                                                        <p className="text-xs text-slate-400">{check.message}</p>
                                                        {check.details && (
                                                            <p className="text-xs text-slate-500 mt-0.5">{check.details}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Data Section */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveSection(activeSection === 'data' ? null : 'data')}
                                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-white"
                            >
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-blue-400" />
                                    <span className="font-semibold">Gestión de Datos</span>
                                </div>
                                {activeSection === 'data' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>

                            {activeSection === 'data' && (
                                <div className="ml-8 space-y-2">
                                    <ToolButton
                                        icon={<Search className="w-4 h-4" />}
                                        title="Investigar Franquicias"
                                        description="Ver todas las franquicias y sus datos asociados"
                                        usage="Haz clic y revisa la consola. Mostrará: lista de franquicias, sus UIDs, emails, status, y cuántos documentos financieros tiene cada una."
                                        onClick={() => executeAction('Investigar Franquicias', investigateAllFranchises)}
                                        variant="purple"
                                        disabled={isExecuting}
                                    />

                                    <ToolButton
                                        icon={<Database className="w-4 h-4" />}
                                        title="Investigar Datos Financieros"
                                        description="Analizar todos los registros en financial_summaries"
                                        usage="Muestra todos los documentos agrupados por mes, con totales de ingresos. Útil para ver el panorama completo de datos financieros."
                                        onClick={() => executeAction('Investigar Datos Financieros', investigateFinancialData)}
                                        variant="indigo"
                                        disabled={isExecuting}
                                    />

                                    {/* Scheduler Inspector (New) */}
                                    <ToolButton
                                        icon={<CalendarIcon className="w-4 h-4" />}
                                        title="Scheduler Inspector"
                                        description="Verificar y gestionar tareas programadas"
                                        usage="Muestra el estado de los cron jobs, próximas ejecuciones y logs. Útil para debugging de automatizaciones."
                                        onClick={() => setIsSchedulerOpen(true)}
                                        variant="emerald"
                                        disabled={isExecuting}
                                    />

                                    <ToolButton
                                        icon={<Shield className="w-4 h-4" />}
                                        title="Verificar Integridad de Datos"
                                        description="Detectar registros huérfanos y datos corruptos"
                                        usage="Ejecuta checks de integridad. Busca registros sin franquicia asociada, datos inválidos, o inconsistencias. Recomendado ejecutar mensualmente."
                                        onClick={() => executeAction('Verificar Integridad', verifyDataIntegrity)}
                                        variant="green"
                                        disabled={isExecuting}
                                    />

                                    <ToolButton
                                        icon={<Package className="w-4 h-4" />}
                                        title="Auditoría Financiera"
                                        description="Validar que todos los cálculos sean correctos"
                                        usage="Genera un reporte completo por mes con totales, márgenes y profit. Útil antes de cerrar un periodo fiscal o si los números 'no cuadran'."
                                        onClick={() => executeAction('Auditoría Financiera', financialAudit)}
                                        variant="emerald"
                                        disabled={isExecuting}
                                    />

                                    <ToolButton
                                        icon={<Trash2 className="w-4 h-4" />}
                                        title="Limpiar Datos Huérfanos"
                                        description="Eliminar registros de franquicias obsoletas"
                                        usage="⚠️ PERMANENTE. Elimina documentos de franquicias que ya no existen. Confirma antes de ejecutar. Hace backup automático."
                                        onClick={async () => {
                                            const confirmed = confirm('⚠️ Esto eliminará datos de forma PERMANENTE. ¿Continuar?');
                                            if (confirmed) {
                                                const result = await executeAction('Limpiar Datos Huérfanos', executeCleanup);
                                                alert(`✅ Eliminados: ${result.deleted} docs\nMantenidos: ${result.kept} docs`);
                                            }
                                        }}
                                        variant="red"
                                        disabled={isExecuting}
                                    />

                                    <ToolButton
                                        icon={<RefreshCw className="w-4 h-4" />}
                                        title="Limpiar Cache Local"
                                        description="Borrar localStorage y sessionStorage"
                                        usage="Limpia toda la cache del navegador. Útil si ves datos antiguos o comportamientos extraños. Perderás sesión actual."
                                        onClick={() => {
                                            const count = localStorage.length + sessionStorage.length;
                                            localStorage.clear();
                                            sessionStorage.clear();
                                            alert(`✅ Cache limpiado (${count} items). Recarga la página.`);
                                        }}
                                        variant="amber"
                                    />
                                </div>
                            )}
                        </div>

                        {/* System Section */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveSection(activeSection === 'system' ? null : 'system')}
                                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-white"
                            >
                                <div className="flex items-center gap-3">
                                    <Bug className="w-5 h-5 text-green-400" />
                                    <span className="font-semibold">Sistema y Diagnóstico</span>
                                </div>
                                {activeSection === 'system' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>

                            {activeSection === 'system' && (
                                <div className="ml-8 space-y-2">
                                    <ToolButton
                                        icon={<CheckCircle className="w-4 h-4" />}
                                        title="Info del Sistema"
                                        description="Ver detalles del navegador y entorno"
                                        usage="Muestra: User Agent, idioma, estado de conexión, capacidades del navegador, versión del navegador. Útil para debugging de compatibilidad."
                                        onClick={() => {
                                            console.log('🔍 Información del Sistema:');
                                            console.log('- User Agent:', navigator.userAgent);
                                            console.log('- Idioma:', navigator.language);
                                            console.log('- Online:', navigator.onLine);
                                            console.log('- LocalStorage:', !!window.localStorage);
                                            console.log('- ServiceWorker:', 'serviceWorker' in navigator);
                                            console.log('- Cookies habilitadas:', navigator.cookieEnabled);
                                            alert('✅ Revisa la consola para detalles del sistema');
                                        }}
                                        variant="green"
                                    />

                                    <ToolButton
                                        icon={<Zap className="w-4 h-4" />}
                                        title="Performance Dashboard"
                                        description="Monitor de memoria y carga"
                                        usage="Analiza memoria JS, tiempos de carga de página y los recursos más pesados/lentos en tiempo real."
                                        onClick={() => setIsPerformanceOpen(true)}
                                        variant="blue"
                                    />

                                    <ToolButton
                                        icon={<FileText className="w-4 h-4" />}
                                        title="Console Live"
                                        description="Ver console.log en tiempo real"
                                        usage="Abre un panel que captura todos los console.log/warn/error en tiempo real. Puedes filtrar por nivel y exportar los logs."
                                        onClick={() => setIsConsoleOpen(true)}
                                        variant="purple"
                                    />

                                    <ToolButton
                                        icon={<Download className="w-4 h-4" />}
                                        title="Exportar Estado de App"
                                        description="Capturar snapshot para debugging"
                                        usage="Descarga un JSON con todo el estado actual: URL, localStorage, errores, performance. Compártelo para reportar bugs o análisis."
                                        onClick={() => {
                                            captureAppState();
                                            alert('✅ Estado exportado. Revisa tu carpeta de descargas.');
                                        }}
                                        variant="indigo"
                                    />

                                    <ToolButton
                                        icon={<AlertTriangle className="w-4 h-4" />}
                                        title="Ver Errores de Runtime"
                                        description="Mostrar errores capturados por la app"
                                        usage="Lista todos los errores JavaScript capturados. Si no hay un error handler global, mostrarácuántos errores tiene almacenados."
                                        onClick={() => {
                                            const errors = (window as any).__RUNTIME_ERRORS__ || [];
                                            console.log('⚠️ Errores capturados:', errors);
                                            if (errors.length === 0) {
                                                alert('✅ No hay errores registrados.');
                                            } else {
                                                alert(`⚠️ Se encontraron ${errors.length} errores. Revisa la consola.`);
                                            }
                                        }}
                                        variant="amber"
                                    />

                                    <ToolButton
                                        icon={<RefreshCw className="w-4 h-4" />}
                                        title="Recargar Aplicación"
                                        description="Hard reload sin cache (Ctrl+Shift+R)"
                                        usage="Recarga la página forzando descarga de todos los recursos. Equivale a F5 o Ctrl+Shift+R. Limpia cache de navegador."
                                        onClick={() => window.location.reload()}
                                        variant="blue"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Debug Section */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveSection(activeSection === 'debug' ? null : 'debug')}
                                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-white"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    <span className="font-semibold">Debug Avanzado</span>
                                </div>
                                {activeSection === 'debug' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>

                            {activeSection === 'debug' && (
                                <div className="ml-8 space-y-2">
                                    <ToolButton
                                        icon={<FileText className="w-4 h-4" />}
                                        title="Ver Variables de Entorno"
                                        description="Mostrar configuración y variables de entorno"
                                        usage="Lista todas las variables de entorno disponibles (import.meta.env). Útil para verificar configuración de producción vs desarrollo."
                                        onClick={() => {
                                            console.log('🔧 Variables de Entorno:', import.meta.env);
                                            alert('✅ Variables mostradas en consola');
                                        }}
                                        variant="purple"
                                    />

                                    <ToolButton
                                        icon={<Activity className="w-4 h-4" />}
                                        title="Network Monitor"
                                        description="Ver tráfico de Firestore en tiempo real"
                                        usage="Monitor de red específico para Firestore. Analiza tiempos de respuesta, queries lentas y errores. Exportable a JSON."
                                        onClick={() => setIsNetworkOpen(true)}
                                        variant="emerald"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                ⚠️ Herramientas de desarrollo - Uso exclusivo para debugging
                            </p>
                            <p className="text-xs text-slate-600 font-mono">
                                v1.0.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConsoleViewer isOpen={isConsoleOpen} onClose={() => setIsConsoleOpen(false)} />
            <NetworkMonitor isOpen={isNetworkOpen} onClose={() => setIsNetworkOpen(false)} />
            <PerformanceDashboard isOpen={isPerformanceOpen} onClose={() => setIsPerformanceOpen(false)} />
            <SchedulerInspector isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
        </>
    );
};

export default DevToolsPanel;
