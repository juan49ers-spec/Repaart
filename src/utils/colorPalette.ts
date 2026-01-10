// Harmonious color palette for rider identification
// Colors are chosen for good contrast and visual distinction

export interface RiderColor {
    bg: string;
    border: string;
    text: string;
    hover: string;
    accent: string; // Strong color for identification (e.g., left border)
    id?: string;
}

const RIDER_COLORS: RiderColor[] = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', hover: 'hover:bg-blue-100', accent: 'border-l-blue-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', hover: 'hover:bg-emerald-100', accent: 'border-l-emerald-500' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', hover: 'hover:bg-purple-100', accent: 'border-l-purple-500' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', hover: 'hover:bg-amber-100', accent: 'border-l-amber-500' },
    { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', hover: 'hover:bg-pink-100', accent: 'border-l-pink-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', hover: 'hover:bg-cyan-100', accent: 'border-l-cyan-500' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', hover: 'hover:bg-orange-100', accent: 'border-l-orange-500' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', hover: 'hover:bg-teal-100', accent: 'border-l-teal-500' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', hover: 'hover:bg-indigo-100', accent: 'border-l-indigo-500' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', hover: 'hover:bg-rose-100', accent: 'border-l-rose-500' },
];

// Map rider IDs to colors
const riderColorMap = new Map<string, RiderColor>();

/**
 * Get a consistent color for a rider
 */
export const getRiderColor = (riderId: string): RiderColor => {
    if (!riderId) {
        // Default gray for unassigned
        return {
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-500',
            hover: 'hover:bg-slate-100',
            accent: '#94a3b8'
        };
    }

    // Return existing color if already assigned
    if (riderColorMap.has(riderId)) {
        return riderColorMap.get(riderId)!;
    }

    // Assign new color
    const colorIndex = riderColorMap.size % RIDER_COLORS.length;
    const color = RIDER_COLORS[colorIndex];
    riderColorMap.set(riderId, color);

    return color;
};

/**
 * Get all rider-color mappings
 */
export const getRiderColorMap = (): Map<string, RiderColor> => {
    return new Map(riderColorMap);
};

/**
 * Clear all color assignments (useful for testing)
 */
export const clearRiderColors = (): void => {
    riderColorMap.clear();
};

/**
 * Calculate shift duration in hours
 */
export const getShiftDuration = (startAt: string, endAt: string): number => {
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    return Math.round((end - start) / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
};

/**
 * Get rider initials from name
 */
export const getRiderInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
