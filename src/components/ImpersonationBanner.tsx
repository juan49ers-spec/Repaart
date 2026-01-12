import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeftCircle } from 'lucide-react';

const ImpersonationBanner: React.FC = () => {
    const { impersonatedFranchiseId, stopImpersonation, user } = useAuth();

    if (!impersonatedFranchiseId) return null;

    return (
        <div className="bg-indigo-600 text-white py-2 px-4 shadow-xl relative z-[100] flex items-center justify-between border-b border-white/10 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                    <ShieldAlert size={16} className="text-white" />
                </div>
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">
                        Modo Impersonación Activo
                    </p>
                    <p className="text-sm font-black tracking-tight leading-none">
                        Viendo como: <span className="text-indigo-200">{user?.email || 'Franquicia'}</span>
                    </p>
                </div>
            </div>

            <button
                onClick={stopImpersonation}
                className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter hover:bg-indigo-50 transition-all shadow-lg active:scale-95 group"
            >
                <ArrowLeftCircle size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Volver al Panel Admin
            </button>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>
    );
};

export default ImpersonationBanner;
