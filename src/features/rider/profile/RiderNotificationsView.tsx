import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

export const RiderNotificationsView: React.FC = () => {
    const navigate = useNavigate();
    // Assuming no notification context yet, showing design for future integration

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Notificaciones</h1>
            </div>

            <main className="p-4 space-y-4">
                {/* Mock Item */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Bienvenido a la nueva App</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Disfruta de tu nuevo perfil unificado y gestión de turnos.
                        </p>
                        <span className="text-xs text-slate-400 mt-2 block">Hace un momento</span>
                    </div>
                </div>

                {/* Empty State visual if no notifications */}
                {/* 
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Bell size={48} className="mb-4 opacity-20" />
                    <p>No tienes notificaciones nuevas</p>
                </div> 
                */}
            </main>
        </div>
    );
};
