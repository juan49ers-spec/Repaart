export interface FirestoreQuery {
    id: string;
    type: 'getDocs' | 'getDoc' | 'setDoc' | 'updateDoc' | 'deleteDoc' | 'addDoc';
    collection: string;
    timestamp: Date;
    duration: number;
    status: 'success' | 'error';
    resultCount?: number;
    error?: string;
    isSlow: boolean;
}

let queries: FirestoreQuery[] = [];
let listeners: ((queries: FirestoreQuery[]) => void)[] = [];
const MAX_QUERIES = 50;
const SLOW_QUERY_THRESHOLD = 1000; // 1 segundo

function addQuery(query: FirestoreQuery) {
    queries = [query, ...queries].slice(0, MAX_QUERIES);
    listeners.forEach(listener => listener([...queries]));
}

/**
 * Registra una query de Firestore
 */
export function logFirestoreQuery(
    type: FirestoreQuery['type'],
    collection: string,
    duration: number,
    status: 'success' | 'error',
    resultCount?: number,
    error?: string
) {
    const query: FirestoreQuery = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        collection,
        timestamp: new Date(),
        duration,
        status,
        resultCount,
        error,
        isSlow: duration > SLOW_QUERY_THRESHOLD
    };

    addQuery(query);
}

/**
 * Obtiene todas las queries capturadas
 */
export function getQueries(): FirestoreQuery[] {
    return [...queries];
}

/**
 * Limpia todas las queries
 */
export function clearQueries() {
    queries = [];
    listeners.forEach(listener => listener([]));
}

/**
 * Suscribe un listener para recibir actualizaciones de queries
 */
export function subscribeToQueries(listener: (queries: FirestoreQuery[]) => void) {
    listeners.push(listener);
    listener([...queries]);

    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
}

/**
 * Exporta las queries a un archivo JSON
 */
export function exportQueries() {
    const data = JSON.stringify(queries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `firestore-queries-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Formatea la duración de una query
 */
export function formatQueryDuration(ms: number): string {
    if (ms < 100) return `${ms.toFixed(0)}ms`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Obtiene estadísticas de las queries
 */
export function getQueryStats() {
    const total = queries.length;
    const slow = queries.filter(q => q.isSlow).length;
    const errors = queries.filter(q => q.status === 'error').length;
    const avgDuration = total > 0
        ? queries.reduce((sum, q) => sum + q.duration, 0) / total
        : 0;

    return {
        total,
        slow,
        errors,
        avgDuration: Math.round(avgDuration)
    };
}
