import { logFirestoreQuery } from './firestoreMonitor';

const originalFetch = window.fetch;

export function startNetworkCapture() {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        // Solo interceptar Firestore
        if (url.includes('firestore.googleapis.com')) {
            const startTime = performance.now();
            let method = init?.method || 'GET';

            // Intentar deducir la operación y colección de la URL
            // Format: .../databases/(default)/documents/users/UID...
            const pathParts = url.split('/documents/');
            let collection = 'unknown';
            let type: any = 'getDocs';

            if (pathParts.length > 1) {
                const path = pathParts[1];
                const cleanPath = path.split('?')[0]; // Remove query params
                collection = cleanPath;

                // Simple heuristic for type
                if (method === 'GET') {
                    type = cleanPath.includes('/') ? 'getDoc' : 'getDocs';
                } else if (method === 'POST') {
                    type = 'addDoc'; // or specific queries
                    // Check if it's a query (runQuery)
                    if (url.includes(':runQuery')) {
                        type = 'getDocs'; // complex query
                    }
                } else if (method === 'PATCH') {
                    type = 'updateDoc';
                } else if (method === 'DELETE') {
                    type = 'deleteDoc';
                }
            }

            try {
                const response = await originalFetch(input, init);
                const duration = performance.now() - startTime;

                // Clonar respuesta para contar resultados si es posible
                // Nota: Esto puede ser costoso, así que lo hacemos con cuidado o solo headers
                // Por ahora solo logueamos status

                logFirestoreQuery(
                    type,
                    collection,
                    duration,
                    response.ok ? 'success' : 'error',
                    undefined, // resultCount difficult to get without consuming body
                    response.ok ? undefined : `${response.status} ${response.statusText}`
                );

                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                logFirestoreQuery(
                    type,
                    collection,
                    duration,
                    'error',
                    0,
                    String(error)
                );
                throw error;
            }
        }

        return originalFetch(input, init);
    };
}

export function stopNetworkCapture() {
    window.fetch = originalFetch;
}
