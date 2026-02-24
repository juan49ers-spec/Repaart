import { cache } from 'react';

/**
 * React.cache() Utility Functions for Deduplication
 *
 * Caches expensive operations within a single render cycle
 * preventing duplicate executions when multiple components
 * call the same function with the same arguments.
 */

/**
 * Cache for expensive data fetching operations
 * Prevents duplicate fetches within the same render
 */
export const cachedFetch = cache(async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    return response.json();
});

/**
 * Cache for Firestore document fetching
 */
export const cachedDocFetch = cache(async (collection: string, docId: string, db: { doc?: (col: string, id: string) => { get: () => Promise<{ exists: () => boolean; id: string; data: () => Record<string, unknown> }> } }) => {
    const docRef = db && db.doc ? db.doc(collection, docId) : null;
    if (!docRef) {
        throw new Error('Firestore instance not provided');
    }
    const snap = await docRef.get();
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
});

/**
 * Cache for expensive calculations
 * Useful in dashboard widgets that compute the same metrics
 */
export const cachedCalculation = cache(<T,>(fn: () => T): T => {
    return fn();
});

/**
 * Cache for data transformation operations
 * Prevents re-transforming the same data multiple times
 */
export const cachedTransform = cache(<T, R>(data: T, transformFn: (d: T) => R): R => {
    return transformFn(data);
});

/**
 * Create a cached selector for derived state
 * Prevents recalculating derived values on every render
 */
export const createSelector = cache(<T, R>(state: T, selector: (s: T) => R): R => {
    return selector(state);
});

/**
 * Cache for complex data aggregation
 * Useful for financial calculations, analytics, etc.
 */
export const cachedAggregation = cache(<T, R>(
    items: T[],
    aggregator: (items: T[]) => R
): R => {
    return aggregator(items);
});