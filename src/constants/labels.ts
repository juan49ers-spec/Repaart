// Predefined labels for feature requests

export interface Label {
    id: string;
    label: string;
    emoji: string;
    color: string;
}

export const PREDEFINED_LABELS: Label[] = [
    { id: 'bug', label: 'Bug', emoji: '🐛', color: 'red' },
    { id: 'feature', label: 'Feature', emoji: '✨', color: 'purple' },
    { id: 'ui-ux', label: 'UI/UX', emoji: '🎨', color: 'pink' },
    { id: 'backend', label: 'Backend', emoji: '⚙️', color: 'blue' },
    { id: 'mobile', label: 'Mobile', emoji: '📱', color: 'green' },
    { id: 'database', label: 'Database', emoji: '💾', color: 'yellow' }
];

export const LABEL_COLORS: Record<string, string> = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
};

// Helper functions
export const getLabel = (labelId: string): Label | undefined => {
    return PREDEFINED_LABELS.find(l => l.id === labelId);
};

export const getLabelColor = (labelId: string): string => {
    const label = getLabel(labelId);
    return label ? LABEL_COLORS[label.color] : LABEL_COLORS.blue;
};

export const getLabelDisplay = (labelId: string): string => {
    const label = getLabel(labelId);
    return label ? `${label.emoji} ${label.label}` : labelId;
};
