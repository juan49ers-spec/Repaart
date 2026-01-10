export interface HistoryAction {
    id: string;
    name: string;
    timestamp: Date;
    status: 'success' | 'error' | 'running';
    result?: any;
    error?: string;
    duration?: number;
}

const HISTORY_KEY = 'dev_tools_history';
const MAX_HISTORY_SIZE = 10;

/**
 * Añade una acción al historial
 */
export function addToHistory(action: Omit<HistoryAction, 'id' | 'timestamp'>): HistoryAction {
    const newAction: HistoryAction = {
        ...action,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
    };

    const history = getHistory();
    const updatedHistory = [newAction, ...history].slice(0, MAX_HISTORY_SIZE);

    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.warn('Failed to save history:', error);
    }

    return newAction;
}

/**
 * Obtiene el historial completo
 */
export function getHistory(): HistoryAction[] {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        // Convertir timestamps de string a Date
        return parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
        }));
    } catch (error) {
        console.warn('Failed to load history:', error);
        return [];
    }
}

/**
 * Limpia todo el historial
 */
export function clearHistory(): void {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.warn('Failed to clear history:', error);
    }
}

/**
 * Actualiza una acción existente en el historial
 */
export function updateHistoryAction(id: string, updates: Partial<HistoryAction>): void {
    const history = getHistory();
    const updatedHistory = history.map(item =>
        item.id === id ? { ...item, ...updates } : item
    );

    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.warn('Failed to update history:', error);
    }
}

/**
 * Formatea la duración en un formato legible
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Formatea el timestamp relativo (ej: "hace 5 minutos")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin}min`;
    if (diffHour < 24) return `Hace ${diffHour}h`;
    return `Hace ${diffDay}d`;
}
