import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeftCircle } from 'lucide-react';

const ImpersonationBanner: React.FC = () => {
    const { impersonatedFranchiseId, stopImpersonation, user } = useAuth();

    if (!impersonatedFranchiseId) return null;

    return (
        <div className="bg-slate-950/90 text-white py-2.5 px-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] relative z-[100] flex items-center justify-between border-b border-white/10 backdrop-blur-xl saturate-150 animate-in slide-in-from-top duration-700 overflow-hidden">
            {/* 🌠 Background Mesh Gradient */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-indigo-600/40 blur-[80px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 right-0 w-1/2 h-full bg-purple-600/30 blur-[80px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/15 p-2 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                    <ShieldAlert size={18} className="text-white" />
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200/90 leading-none mb-1">
                        Modo Impersonación Activo
                    </p>
                    <p className="text-sm font-bold tracking-tight leading-none text-white/95">
                        Viendo como: <span className="text-indigo-300 font-extrabold">{user?.email || 'Franquicia'}</span>
                    </p>
                </div>
            </div>

            <button
                onClick={stopImpersonation}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all shadow-lg active:scale-95 group relative z-10 ring-1 ring-white/20"
            >
                <ArrowLeftCircle size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Volver al Panel Admin</span>
            </button>

            {/* Subtle top shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
    );
};

export default ImpersonationBanner;
