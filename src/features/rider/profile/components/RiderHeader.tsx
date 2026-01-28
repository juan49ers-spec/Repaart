import React from 'react';
import { User, Settings, Edit3 } from 'lucide-react';

export interface RiderHeaderProps {
    displayName?: string;
    photoURL?: string;
    role?: string;
    onEditProfile?: () => void;
    onSettings?: () => void;
}

const RiderHeader: React.FC<RiderHeaderProps> = ({
    displayName,
    photoURL,
    role,
    onEditProfile,
    onSettings
}) => {
    return (
        <div className="rider-header">
            <div className="flex flex-col items-center gap-6">
                {/* Avatar with Online Status */}
                <div className="relative group">
                    <div className="w-36 h-36 rounded-full glass-premium flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-white/5 transition-all duration-500 hover:scale-105 hover:ring-emerald-500/30 hover:shadow-emerald-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                        {photoURL ? (
                            <img src={photoURL || ''} alt={displayName || 'Avatar'} className="w-full h-full object-cover relative z-10" />
                        ) : (
                            <User size={60} className="text-slate-800 dark:text-slate-300 relative z-10" />
                        )}
                    </div>
                    {/* Online Status Indicator */}
                    <div className="absolute bottom-3 right-3 w-8 h-8 bg-emerald-500 border-4 border-slate-950 rounded-full shadow-xl animate-pulse z-20">
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    </div>
                </div>

                {/* User Info */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {displayName || 'Rider'}
                    </h2>
                    <span className="inline-flex items-center px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.25em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-lg backdrop-blur-sm hover:bg-emerald-500/20 transition-colors">
                        {role === 'rider' ? 'PROFESIONAL LOGÍSTICA' : role || 'Rider'}
                    </span>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-4 mt-2">
                    <button
                        onClick={onEditProfile}
                        className="glass-card p-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                        aria-label="Editar perfil"
                    >
                        <Edit3 size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    </button>
                    <button
                        onClick={onSettings}
                        className="glass-card p-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                        aria-label="Configuración"
                    >
                        <Settings size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiderHeader;