import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Copy, TrendingUp, ArrowRight } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface Location {
    zipCodes?: string[];
}

interface Metrics {
    revenue?: number;
    orders?: number;
}

export interface Franchise {
    uid: string;
    name?: string;
    city?: string;
    location?: Location | string; // Support both new (Location) and legacy (string)
    status?: 'active' | 'pending' | 'suspended' | 'banned';
    metrics?: Metrics;
}

interface FranchiseCardProps {
    franchise: Franchise;
}

// =====================================================
// COMPONENT
// =====================================================

const FranchiseCard: React.FC<FranchiseCardProps> = ({ franchise }) => {
    const navigate = useNavigate();

    // Data Adapter: Map existing data structure to the new UI requirements
    const {
        name = "Franquicia",
        // Logic: Try ZIP Codes (New), fallback to UID (Code), fallback to Legacy Location
        city = typeof franchise.location === 'object'
            ? franchise.location?.zipCodes?.join(', ')
            : franchise.location || franchise.uid || "Sin Código",
        status = "active",
        metrics = {},
        uid = "N/A"
    } = franchise || {};

    const revenue = metrics.revenue ? formatMoney(metrics.revenue) + '€' : "0€";
    const orders = metrics.orders ? metrics.orders.toLocaleString() : "0";

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        suspended: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        banned: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    };

    const handleCopyId = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation();
        navigator.clipboard.writeText(uid);
    };

    return (
        <div
            onClick={() => navigate(`/admin/finance/${uid}`)}
            className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-5 transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-900/80 cursor-pointer overflow-hidden shadow-lg hover:shadow-blue-500/10"
        >
            {/* Decorative gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* 1. HEADER: Identidad y Estado */}
            <div className="relative flex justify-between items-start mb-4">
                <div className="flex-1 overflow-hidden mr-2">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-black text-lg leading-tight group-hover:text-blue-400 transition-colors truncate">
                            {name}
                        </h3>
                    </div>
                    {/* Ubicación */}
                    <div className="flex items-center mt-1 text-xs text-slate-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        {city}
                    </div>
                </div>

                {/* Badge de Estado */}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[status] || statusColors.pending} flex items-center gap-1.5 whitespace-nowrap`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {status.toUpperCase()}
                </span>
            </div>

            {/* 2. BODY: Métricas Clave */}
            <div className="relative grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800/50">
                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                        Ingresos (Mes)
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-white font-black text-xl tabular-nums tracking-tight">
                            {revenue}
                        </span>
                        <div className="ml-auto">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                        Pedidos
                    </p>
                    <span className="text-white font-black text-xl tabular-nums tracking-tight">
                        {orders}
                    </span>
                </div>
            </div>

            {/* 3. FOOTER: Utilidad Técnica (UID) y Acción */}
            <div className="relative mt-4 flex justify-between items-center">
                <div
                    className="flex items-center gap-2 px-2 py-1 -ml-2 rounded-md hover:bg-slate-800/50 transition-colors group/uid"
                    title="Click para copiar ID"
                    onClick={handleCopyId}
                >
                    <span className="font-bold text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-widest">
                        ID: {uid.substring(0, 8)}...
                    </span>
                    <Copy className="w-3 h-3 text-slate-600 opacity-0 group-hover/uid:opacity-100 transition-opacity" />
                </div>

                {/* Call to action */}
                <div className="flex items-center gap-1 text-xs font-bold text-slate-500 group-hover:text-blue-400 transition-colors">
                    <span>Ver detalles</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>

            {/* Top border indicator */}
            <div className={`absolute top-0 left-0 w-full h-1 ${status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-slate-700'
                } opacity-50 group-hover:opacity-100 transition-opacity rounded-t-2xl`} />
        </div>
    );
};

export default FranchiseCard;
