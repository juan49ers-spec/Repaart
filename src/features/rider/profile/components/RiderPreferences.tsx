import React from 'react';
import { Bell, BellOff } from 'lucide-react';

export interface NotificationPreference {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

export interface RiderPreferencesProps {
    preferences: NotificationPreference[];
}

const RiderPreferences: React.FC<RiderPreferencesProps> = ({ preferences }) => {
    return (
        <div className="rider-preferences">
            <div className="px-6">
                <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-rose-500 to-rose-400" />

                    <div className="relative z-10">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Bell size={16} className="text-rose-500" />
                            Preferencias de Notificaciones
                        </h3>

                        <div className="space-y-3">
                            {preferences.map((pref) => {
                                const Icon = pref.icon;
                                const IconOff = pref.enabled ? BellOff : Bell;
                                return (
                                    <div
                                        key={pref.id}
                                        className={`
                                            flex items-center justify-between p-4 rounded-xl
                                            transition-all duration-300
                                            ${pref.enabled
                                                ? 'bg-slate-50 dark:bg-slate-800/30 border border-rose-200 dark:border-rose-900/30'
                                                : 'bg-slate-100/50 dark:bg-slate-800/20 border border-slate-200 dark:border-white/5'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center
                                                transition-colors duration-300
                                                ${pref.enabled
                                                    ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                }
                                            `}>
                                                {pref.enabled ? <Icon size={18} /> : <IconOff size={18} />}
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                                                    {pref.label}
                                                </span>
                                                <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                                    {pref.enabled ? 'Activado' : 'Desactivado'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => pref.onChange(!pref.enabled)}
                                            className={`
                                                relative w-12 h-7 rounded-full transition-all duration-300
                                                ${pref.enabled
                                                    ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                                                    : 'bg-slate-300 dark:bg-slate-600'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300
                                                ${pref.enabled ? 'left-5.5' : 'left-0.5'}
                                            `} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderPreferences;