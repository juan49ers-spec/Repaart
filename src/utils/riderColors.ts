// Rider Color Palette - Professional and Distinct Colors
const RIDER_COLORS = [
    { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-white', light: 'bg-indigo-100', name: 'Indigo' },
    { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white', light: 'bg-emerald-100', name: 'Emerald' },
    { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-slate-900', light: 'bg-amber-100', name: 'Amber' },
    { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white', light: 'bg-rose-100', name: 'Rose' },
    { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white', light: 'bg-purple-100', name: 'Purple' },
    { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white', light: 'bg-cyan-100', name: 'Cyan' },
    { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white', light: 'bg-pink-100', name: 'Pink' },
    { bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-white', light: 'bg-teal-100', name: 'Teal' },
    { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', light: 'bg-orange-100', name: 'Orange' },
    { bg: 'bg-lime-500', border: 'border-lime-600', text: 'text-slate-900', light: 'bg-lime-100', name: 'Lime' },
];

/**
 * Assigns a consistent color to a rider based on their ID
 */
export const getRiderColor = (riderId: string) => {
    // Use a simple hash to consistently map rider ID to color index
    let hash = 0;
    for (let i = 0; i < riderId.length; i++) {
        hash = riderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % RIDER_COLORS.length;
    return RIDER_COLORS[index];
};

/**
 * Gets all unique riders from shifts and assigns them colors
 */
export const getRiderColorMap = (riders: Array<{ id: string;[key: string]: any }>) => {
    const colorMap = new Map<string, typeof RIDER_COLORS[0]>();
    riders.forEach(rider => {
        colorMap.set(rider.id, getRiderColor(rider.id));
    });
    return colorMap;
};
