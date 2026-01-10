/**
 * Utility functions for handling dates in LOCAL time, bypassing browser timezone conversions.
 * We treat all inputs as if they are in the user's local context.
 */

/**
 * Returns a date string in "YYYY-MM-DD" format based on the local date.
 */
export const toLocalDateString = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns a time string in "HH:mm" format based on the local time.
 */
export const toLocalTimeString = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Returns a full ISO-like string "YYYY-MM-DDTHH:mm:ss" in Local Time (no Z).
 */
export const toLocalISOString = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    return `${toLocalDateString(date)}T${toLocalTimeString(date)}:00`;
};

/**
 * Returns an ISO 8601 string with the explicit local timezone offset.
 * Example: "2023-12-20T23:00:00+01:00"
 * This ensures the server receives the exact absolute time intended by the user.
 */
export const toLocalISOStringWithOffset = (date: Date | null | undefined): string => {
    if (!date) return '';

    // Get local components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Get offset
    // getTimezoneOffset() returns minutes relative to UTC.
    // Positive values are West of UTC (e.g., New York is 300).
    // Negative values are East of UTC (e.g., Madrid is -60).
    // ISO 8601 expects:
    // West (New York): -05:00
    // East (Madrid): +01:00
    // So we must invert the sign.
    const offsetMinutes = date.getTimezoneOffset();
    const sign = offsetMinutes > 0 ? '-' : '+';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetMins = String(absOffset % 60).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
};

export const getStartOfWeek = (date: Date | string): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    return toLocalDateString(monday);
};
