import React, { useState } from 'react';
import { ChevronDown, Building2, TrendingUp, DollarSign, Package, X } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface FranchiseMetrics {
    revenue?: number;
    orders?: number;
    profit?: number;
    margin?: number;
}

interface Franchise {
    uid: string;
    name?: string;
    city?: string;
    location?: { zipCodes?: string[] } | string;
    status?: 'active' | 'pending' | 'suspended' | 'banned';
    metrics?: FranchiseMetrics;
    active?: boolean;
}

interface FranchiseSelectorProps {
    franchises: Franchise[];
    onSelectFranchise?: (franchiseId: string | null) => void;
}

// =====================================================
// COMPONENT
// =====================================================

const FranchiseSelector: React.FC<FranchiseSelectorProps> = ({
    franchises,
    onSelectFranchise
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);

    const handleSelect = (franchise: Franchise | null) => {
        setSelectedFranchise(franchise);
        setIsOpen(false);
        onSelectFranchise?.(franchise?.uid || null);
    };

    const activeFranchises = franchises.filter(f => f.active !== false);

    // Get metrics for display
    const getMetrics = (franchise: Franchise | null) => {
        if (!franchise?.metrics) return null;
        return {
            revenue: franchise.metrics.revenue || 0,
            orders: franchise.metrics.orders || 0,
            profit: franchise.metrics.profit || 0,
            margin: franchise.metrics.margin || 0
        };
    };

    const metrics = selectedFranchise ? getMetrics(selectedFranchise) : null;

    return (
        <div className="space-y-4">
            {/* Selector Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between hover:border-slate-700 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                                {selectedFranchise ? 'Franquicia Seleccionada' : 'Vista Global'}
                            </p>
                            <p className="text-sm font-bold text-white">
                                {selectedFranchise?.name || 'Todas las Franquicias'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedFranchise && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(null);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelect(null);
                                    }
                                }}
                                className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Limpiar selección"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </div>
                        )}
                        <ChevronDown
                            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                            {/* Global View Option */}
                            <button
                                onClick={() => handleSelect(null)}
                                className={`w-full px-4 py-3 text-left hover:bg-slate-800/50 transition-colors border-b border-slate-800 ${!selectedFranchise ? 'bg-blue-500/10' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Vista Global</p>
                                        <p className="text-xs text-slate-500">
                                            {activeFranchises.length} franquicias activas
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Franchise List */}
                            {activeFranchises.map((franchise) => {
                                const city = typeof franchise.location === 'object'
                                    ? franchise.location?.zipCodes?.join(', ')
                                    : franchise.location || 'Sin ubicación';

                                return (
                                    <button
                                        key={franchise.uid}
                                        onClick={() => handleSelect(franchise)}
                                        className={`w-full px-4 py-3 text-left hover:bg-slate-800/50 transition-colors ${selectedFranchise?.uid === franchise.uid ? 'bg-blue-500/10' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${franchise.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    } animate-pulse`} />
                                                <div>
                                                    <p className="text-sm font-bold text-white">
                                                        {franchise.name || 'Sin nombre'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {city}
                                                    </p>
                                                </div>
                                            </div>
                                            {franchise.metrics?.revenue && (
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-emerald-400">
                                                        {formatMoney(franchise.metrics.revenue)}€
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {activeFranchises.length === 0 && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-sm text-slate-500">No hay franquicias activas</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Quick Metrics Panel (only shown when franchise selected) */}
            {selectedFranchise && metrics && (
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Métricas Rápidas
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Revenue */}
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                    Ingresos
                                </p>
                            </div>
                            <p className="text-lg font-black text-white tabular-nums">
                                {formatMoney(metrics.revenue)}€
                            </p>
                        </div>

                        {/* Orders */}
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Package className="w-3.5 h-3.5 text-blue-400" />
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                    Pedidos
                                </p>
                            </div>
                            <p className="text-lg font-black text-white tabular-nums">
                                {metrics.orders}
                            </p>
                        </div>

                        {/* Profit */}
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                    Beneficio
                                </p>
                            </div>
                            <p className="text-lg font-black text-white tabular-nums">
                                {formatMoney(metrics.profit)}€
                            </p>
                        </div>

                        {/* Margin */}
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                    Margen
                                </p>
                            </div>
                            <p className="text-lg font-black text-white tabular-nums">
                                {metrics.margin.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => onSelectFranchise?.(selectedFranchise.uid)}
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        Ver Detalles Completos
                        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FranchiseSelector;
