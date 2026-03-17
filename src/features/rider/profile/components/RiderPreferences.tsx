import React from 'react';
import { LucideIcon, CheckCircle2 } from 'lucide-react';

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

/**
 * RiderPreferences: Rediseño "Clean Apple"
 * Foco en controles interactivos claros, tipografía minimalista y lenguaje visual de iOS/Premium.
 */
const RiderPreferences: React.FC<RiderPreferencesProps> = ({ preferences }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Preferencias</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Canales de Notificación</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {preferences.map((pref) => {
                    const Icon = pref.icon;
                    return (
                        <div
                            key={pref.id}
                            onClick={() => pref.onChange(!pref.enabled)}
                            className={`
                                cursor-pointer flex items-center justify-between p-6 rounded-3xl border transition-all duration-300 group
                                ${pref.enabled 
                                    ? 'bg-emerald-50/40 border-emerald-200' 
                                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}
                            `}
                        >
                            <div className="flex items-center gap-6">
                                <div className={`
                                    w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                                    ${pref.enabled 
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}
                                `}>
                                    <Icon size={24} />
                                </div>
                                <div className="text-left">
                                    <span className={`block font-black uppercase text-[10px] tracking-widest transition-colors ${pref.enabled ? 'text-emerald-900' : 'text-slate-800'}`}>
                                        {pref.label}
                                    </span>
                                    <span className={`text-xs font-medium transition-colors ${pref.enabled ? 'text-emerald-700/70' : 'text-slate-400'}`}>
                                        {pref.enabled ? 'Recibiendo alertas críticas' : 'Avisos desactivados'}
                                    </span>
                                </div>
                            </div>

                            <button
                                className={`
                                    relative w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1
                                    ${pref.enabled ? 'bg-emerald-500' : 'bg-slate-200'}
                                `}
                                title={`Alternar ${pref.label}`}
                                aria-label={`Alternar ${pref.label}`}
                            >
                                <div className={`
                                    w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300
                                    ${pref.enabled ? 'translate-x-6' : 'translate-x-0'}
                                `} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Privacy Note */}
            <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Privacidad de Datos</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-relaxed">
                        Tus preferencias son privadas y solo se utilizan para enviarte información relevante sobre tus turnos y la operativa de Repaart.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiderPreferences;