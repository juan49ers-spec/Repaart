import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

export interface NotificationPreference {
    id: string;
    label: string;
    icon: LucideIcon;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

export interface RiderPreferencesProps {
    preferences: NotificationPreference[];
}

const RiderPreferences: React.FC<RiderPreferencesProps> = ({ preferences }) => {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Preferencias</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Canales de Notificación</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {preferences.map((pref) => {
                    const Icon = pref.icon;
                    return (
                        <div
                            key={pref.id}
                            onClick={() => pref.onChange(!pref.enabled)}
                            className={`
                                cursor-pointer flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 group
                                ${pref.enabled 
                                    ? 'bg-emerald-50/50 border-emerald-200' 
                                    : 'bg-white/60 backdrop-blur-md border-slate-200/60 hover:border-slate-300 shadow-sm'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className={`
                                    w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-300
                                    ${pref.enabled 
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 border border-slate-100'
                                    }
                                `}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-left">
                                    <span className={`block font-semibold text-sm transition-colors ${pref.enabled ? 'text-emerald-900' : 'text-slate-700'}`}>
                                        {pref.label}
                                    </span>
                                    <span className={`text-xs font-medium transition-colors mt-0.5 ${pref.enabled ? 'text-emerald-700/80' : 'text-slate-400'}`}>
                                        {pref.enabled ? 'Recibiendo alertas' : 'Avisos desactivados'}
                                    </span>
                                </div>
                            </div>

                            <button
                                className={`
                                    relative w-12 h-6 rounded-full transition-all duration-300 flex items-center p-1
                                    ${pref.enabled ? 'bg-emerald-500' : 'bg-slate-200'}
                                `}
                                title={`Alternar ${pref.label}`}
                                aria-label={`Alternar ${pref.label}`}
                            >
                                <div className={`
                                    w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300
                                    ${pref.enabled ? 'translate-x-6' : 'translate-x-0'}
                                `} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Privacy Note */}
            <div className="mt-8 p-5 bg-sky-50/50 rounded-2xl border border-sky-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-sky-50">
                    <Info size={18} className="text-sky-500" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-sky-900 mb-1">Privacidad de Datos</p>
                    <p className="text-xs font-medium text-sky-700/80 leading-relaxed">
                        Tus preferencias son privadas y solo se utilizan para enviarte información relevante sobre tus turnos.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiderPreferences;