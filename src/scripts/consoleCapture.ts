export type LogLevel = 'log' | 'warn' | 'error' | 'info';

export interface ConsoleLog {
    id: string;
    level: LogLevel;
    message: string;
    timestamp: Date;
    args: any[];
}

let logs: ConsoleLog[] = [];
let listeners: ((logs: ConsoleLog[]) => void)[] = [];
const MAX_LOGS = 100;

// Store original console methods
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
};

function createLog(level: LogLevel, args: any[]): ConsoleLog {
    return {
        id: Math.random().toString(36).substr(2, 9),
        level,
        message: args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' '),
        timestamp: new Date(),
        args
    };
}

function addLog(log: ConsoleLog) {
    logs = [log, ...logs].slice(0, MAX_LOGS);
    listeners.forEach(listener => listener([...logs]));
}

/**
 * Intercepta console.log/warn/error/info y captura los mensajes
 */
export function startConsoleCapture() {
    console.log = (...args: any[]) => {
        originalConsole.log(...args);
        addLog(createLog('log', args));
    };

    console.warn = (...args: any[]) => {
        originalConsole.warn(...args);
        addLog(createLog('warn', args));
    };

    console.error = (...args: any[]) => {
        originalConsole.error(...args);
        addLog(createLog('error', args));
    };

    console.info = (...args: any[]) => {
        originalConsole.info(...args);
        addLog(createLog('info', args));
    };
}

/**
 * Restaura los métodos originales de console
 */
export function stopConsoleCapture() {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
}

/**
 * Obtiene todos los logs capturados
 */
export function getLogs(): ConsoleLog[] {
    return [...logs];
}

/**
 * Limpia todos los logs
 */
export function clearLogs() {
    logs = [];
    listeners.forEach(listener => listener([]));
}

/**
 * Suscribe un listener para recibir actualizaciones de logs
 */
export function subscribeToLogs(listener: (logs: ConsoleLog[]) => void) {
    listeners.push(listener);
    listener([...logs]); // Enviar logs actuales inmediatamente

    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
}

/**
 * Exporta los logs a un archivo JSON
 */
export function exportLogs() {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `console-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Formatea la hora de un log
 */
export function formatLogTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
