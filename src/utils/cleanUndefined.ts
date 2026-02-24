/**
 * Clean Undefined Utility
 * 
 * Recursively removes undefined values from objects
 * Useful for Firestore which doesn't accept undefined values
 */

export const cleanUndefined = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;

    if (Array.isArray(obj)) {
        return obj.map(cleanUndefined).filter(v => v !== undefined);
    }

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (value !== undefined) {
            cleaned[key] = cleanUndefined(value);
        }
    }
    return cleaned;
};

export default cleanUndefined;
