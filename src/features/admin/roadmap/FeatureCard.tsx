import React from 'react';
import { Clock, User } from 'lucide-react';
import { getLabelDisplay, getLabelColor } from '../../../constants/labels';

interface FeatureRequest {
    id: string;
    title: string;
    description: string;
    status: 'proposed' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    createdBy: string;
    createdByEmail: string;
    createdAt: any;
    updatedAt: any;
    labels?: string[];
    assignedTo?: string;
}

interface FeatureCardProps {
    feature: FeatureRequest;
    onStatusChange: (id: string, newStatus: 'proposed' | 'in_progress' | 'completed') => void;
}

const PRIORITY_STYLES = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

const PRIORITY_LABELS = {
    high: '🔴 Alta',
    medium: '🟡 Media',
    low: '🟢 Baja'
};

const STATUS_OPTIONS = [
    { value: 'proposed', label: '📋 Propuesto' },
    { value: 'in_progress', label: '🔨 En Desarrollo' },
    { value: 'completed', label: '✅ Completado' }
];

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onStatusChange }) => {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Reciente';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="glass-panel-exec p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 transition-all group">
            {/* Priority Badge */}
            <div className="mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${PRIORITY_STYLES[feature.priority]}`}>
                    {PRIORITY_LABELS[feature.priority]}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-slate-100 font-bold text-base mb-2 line-clamp-2">
                {feature.title}
            </h3>

            {/* Description */}
            <p className="text-slate-400 text-sm mb-3 line-clamp-3">
                {feature.description}
            </p>

            {/* Labels */}
            {feature.labels && feature.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {feature.labels.slice(0, 3).map(labelId => (
                        <span
                            key={labelId}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getLabelColor(labelId)}`}
                        >
                            {getLabelDisplay(labelId)}
                        </span>
                    ))}
                    {feature.labels.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            +{feature.labels.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{feature.createdByEmail}</span>

                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(feature.createdAt)}</span>
                </div>
            </div>

            {/* Status Selector */}
            <select
                value={feature.status}
                onChange={(e) => onStatusChange(feature.id, e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-700 transition-colors"
                aria-label="Cambiar estado de la mejora"
            >
                {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default FeatureCard;
