import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../hooks/useToast';
import RiderNotifications from './components/RiderNotifications';

export const RiderNotificationsView: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toastHook = useToast();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    title="Volver"
                    className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Notificaciones</h1>
            </div>

            {/* Notifications Component */}
            <main className="p-4 space-y-4">
                {user && toastHook ? (
                    <RiderNotifications user={user as any} toast={toastHook.toast} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <p>Inicia sesión para ver tus notificaciones</p>
                    </div>
                )}
            </main>
        </div>
    );
};
