/**
 * Field Normalization Utilities
 *
 * Standardizes field names across the application to camelCase format.
 * Maintains backward compatibility with legacy snake_case fields.
 */

export const FIELD_MAPPINGS = {
    // Financial records
    franchise_id: 'franchiseId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    submitted_at: 'submittedAt',
    approved_at: 'approvedAt',
    approved_by: 'approvedBy',
    rejection_reason: 'rejectionReason',
    admin_notes: 'adminNotes',
    is_locked: 'isLocked',
    // Academy
    last_accessed: 'lastAccessed'
};

/**
 * Convert snake_case keys to camelCase
 */
const toCamelCase = (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase keys to snake_case
 */
const toSnakeCase = (str: string): string => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

/**
 * Normalize an object's keys to camelCase
 * Preserves nested objects and arrays
 */
export const normalizeToCamelCase = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
    const normalized: Record<string, unknown> = {};

    for (const key in obj) {
        const value = obj[key];

        // Handle nested objects
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            normalized[toCamelCase(key)] = normalizeToCamelCase(value as Record<string, unknown>);
        }
        // Handle arrays
        else if (Array.isArray(value)) {
            normalized[toCamelCase(key)] = value.map(item =>
                typeof item === 'object' && item !== null ? normalizeToCamelCase(item as Record<string, unknown>) : item
            );
        }
        // Handle primitive values
        else {
            normalized[toCamelCase(key)] = value;
        }
    }

    return normalized;
};

/**
 * Convert an object's keys to snake_case (for Firestore legacy support)
 */
export const normalizeToSnakeCase = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
    const normalized: Record<string, unknown> = {};

    for (const key in obj) {
        const value = obj[key];

        // Handle nested objects
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            normalized[toSnakeCase(key)] = normalizeToSnakeCase(value as Record<string, unknown>);
        }
        // Handle arrays
        else if (Array.isArray(value)) {
            normalized[toSnakeCase(key)] = value.map(item =>
                typeof item === 'object' && item !== null ? normalizeToSnakeCase(item as Record<string, unknown>) : item
            );
        }
        // Handle primitive values
        else {
            normalized[toSnakeCase(key)] = value;
        }
    }

    return normalized;
};

/**
 * Merge normalized data with legacy fields for Firestore compatibility
 * Use this when saving to Firestore to maintain compatibility
 */
export const withLegacyFields = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
    const legacy = normalizeToSnakeCase(obj);
    return { ...obj, ...legacy };
};

/**
 * Get a field value with fallback to legacy field name
 */
export const getField = <T>(obj: Record<string, T>, fieldName: string, defaultValue?: T): T => {
    const camelKey = toCamelCase(fieldName);
    const snakeKey = toSnakeCase(fieldName);

    return (obj[camelKey] as T) ?? (obj[snakeKey] as T) ?? (defaultValue as T);
};