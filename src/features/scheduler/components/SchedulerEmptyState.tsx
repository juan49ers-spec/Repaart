import React from 'react';
import { Users, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SchedulerEmptyState: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <Users className="w-10 h-10 text-slate-300" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
                No tienes Riders activos
            </h3>

            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
                Para comenzar a planificar turnos, primero necesitas dar de alta a tu equipo de reparto en la plataforma.
            </p>

            <button
                onClick={() => navigate('/fleet')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
                <PlusCircle size={18} />
                Crear mi primer Rider
            </button>
        </div>
    );
};
