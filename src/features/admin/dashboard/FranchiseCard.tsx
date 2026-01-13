import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Copy, TrendingUp, ArrowRight, LogIn } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';
import { useAuth } from '../../../context/AuthContext';

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
    const { startImpersonation } = useAuth();

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
            className="group relative glass-premium rounded-3xl p-5 md:p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden"
        >
            {/* Decorative gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* 1. HEADER: Identidad y Estado */}
            <div className="relative flex flex-col sm:flex-row justify-between items-start mb-5 gap-3 sm:gap-0">
                <div className="flex-1 overflow-hidden mr-2">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-white font-heavy text-xl leading-tight group-hover:text-blue-400 transition-colors truncate">
                            {name}
                        </h3>
                    </div>
                    {/* Ubicación */}
                    <div className="flex items-center text-sm text-slate-400 font-medium tracking-wide">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        {city}
                    </div>
                </div>

                {/* Badge de Estado */}
                <span className={`px-3 py-1 pb-1.5 rounded-full text-[10px] font-bold border ${statusColors[status] || statusColors.pending} flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto uppercase tracking-widest`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {status.toUpperCase()}
                </span>
            </div>

            {/* 2. BODY: Métricas Clave */}
            <div className="relative grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                        Ingresos
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-white font-black text-2xl tabular-nums tracking-tighter">
                            {revenue}
                        </span>
                        <div className="ml-auto opacity-50">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                        Pedidos
                    </p>
                    <span className="text-white font-black text-2xl tabular-nums tracking-tighter">
                        {orders}
                    </span>
                </div>
            </div>

            {/* 3. FOOTER: Utilidad Técnica (UID) y Acción */}
            <div className="relative flex justify-between items-center pt-2 border-t border-white/5">
                <div
                    className="flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors group/uid active:scale-95"
                    title="Click para copiar ID"
                    onClick={handleCopyId}
                >
                    <span className="font-bold text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest">
                        ID: {uid.substring(0, 8)}...
                    </span>
                    <Copy className="w-3 h-3 text-slate-600 opacity-50 group-hover/uid:opacity-100 transition-opacity" />
                </div>

                {/* Call to action */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            startImpersonation(uid);
                            navigate('/dashboard');
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 hover:scale-105 active:scale-95 text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        <LogIn size={12} strokeWidth={3} />
                        Entrar
                    </button>

                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-600 group-hover:text-blue-400 transition-colors uppercase tracking-widest">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Top border indicator */}
            <div className={`absolute top-0 left-0 w-full h-1 ${status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-slate-700'
                } opacity-80 group-hover:opacity-100 transition-opacity`} />
        </div>
    );
};

export default FranchiseCard;
