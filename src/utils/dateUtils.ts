/**
 * Utility functions for handling dates in LOCAL time, bypassing browser timezone conversions.
 * We treat all inputs as if they are in the user's local context.
 */

/**
 * Returns a date string in "YYYY-MM-DD" format based on the local date.
 */
export const toLocalDateString = (date: Date | string | null | undefined): string => {
    if (!date) return '';

    // If it's already a simple YYYY-MM-DD string (optionally followed by time), extracts the date part literally.
    // This avoids "new Date('2026-01-06')" being interpreted as UTC Midnight and shifting to Jan 5th in negative timezones.
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        return date.substring(0, 10);
    }

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

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
 * Returns a full ISO-8601 string "YYYY-MM-DDTHH:mm:ss+HH:mm" in Local Time with offset.
 * This is the MISSION CRITICAL format for absolute time consistency.
 */
export const toLocalISOString = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    // We reuse the robust offset logic
    return toLocalISOStringWithOffset(d);
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
    let d: Date;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        const [y, m, d_part] = date.split('-').map(Number);
        d = new Date(y, m - 1, d_part, 12, 0, 0); // Use noon to avoid DST edge cases
    } else {
        d = new Date(date);
    }

    if (isNaN(d.getTime())) return '';

    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    return toLocalDateString(monday);
};
