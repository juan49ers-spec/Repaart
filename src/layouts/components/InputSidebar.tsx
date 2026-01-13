import React, { useState, useEffect, ChangeEvent } from 'react';
import { Settings, Truck, Users, Landmark, Calendar, MapPin, Lock, Activity, Sparkles, Wrench, HelpCircle } from 'lucide-react';
import DevToolsPanel from './dev/DevToolsPanel';

import { useAppStore } from '../../store/useAppStore';

export interface SidebarFormData {
    // Orders
    ordersNew0To4?: number | string;
    ordersNew4To5?: number | string;
    ordersNew5To6?: number | string;
    ordersNew6To7?: number | string;
    ordersNewGt7?: number | string;
    ordersOld0To35?: number | string;
    ordersOldGt35?: number | string;

    // Labor
    contractedRiders?: number | string;
    totalHours?: number | string;

    // Ops
    motoCount?: number | string;
    royaltyPercent?: number | string;

    // Fixed Costs
    salaries?: number | string;
    insurance?: number | string;
    agencyFee?: number | string;
    prlFee?: number | string;
    accountingFee?: number | string;
    services?: number | string;
    quota?: number | string;
    marketing?: number | string;

    // Variable Costs
    gasoline?: number | string;
    gasolinePrice?: number | string;
    repairs?: number | string;
    otherExpenses?: number | string;
    incidents?: number | string;

    // Tax
    irpfPercent?: number | string;

    [key: string]: number | string | undefined;
}

export interface InputSidebarProps {
    onCalculate: (data: SidebarFormData) => void;
    initialData?: SidebarFormData | null;
    readOnly?: boolean;
    onOpenHelp?: (id: string) => void;
}

const InputSidebar: React.FC<InputSidebarProps> = ({
    onCalculate,
    initialData,
    readOnly = false,
    onOpenHelp
}) => {
    const {
        isSidebarOpen: isOpen,
        toggleSidebar,
        selectedMonth,
        setSelectedMonth: onMonthChange,
        toggleChat
    } = useAppStore();

    const onClose = () => toggleSidebar(false);
    const onToggleChat = () => toggleChat();
    const [formData, setFormData] = useState<SidebarFormData>(initialData || {});
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFormData(initialData || {});
        }, 0);
        return () => clearTimeout(timer);
    }, [initialData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (readOnly) return; // Block changes
        const { name, value } = e.target;
        // Allow string update to support typing decimals (e.g. "10.")
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        if (readOnly) return;

        // Parse all fields to numbers before submitting
        const parsedData: SidebarFormData = Object.keys(formData).reduce((acc, key) => {
            const value = formData[key];
            acc[key] = typeof value === 'string' ? (parseFloat(value) || 0) : value;
            return acc;
        }, {} as SidebarFormData);

        onCalculate(parsedData);
    };

    // Calculate estimated Km on the fly for display
    const gasoline = formData ? (parseFloat(String(formData.gasoline || 0)) || 0) : 0;
    const gasolinePrice = formData ? (parseFloat(String(formData.gasolinePrice || 0)) || 0) : 0;
    const estimatedKm = gasolinePrice > 0 ? (gasoline / gasolinePrice) * 35 : 0;

    return (
        <div className={`fixed inset-y-0 left-0 w-full md:w-96 bg-white dark:bg-slate-900 border-r dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                            <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                            Configuración
                        </h2>
                        <button
                            onClick={() => onOpenHelp && onOpenHelp('sidebar_config')}
                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
                            title="Ayuda de configuración"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                </div>

                {/* AI Assistant Button (Mobile/Sidebar Access) */}
                <button
                    onClick={() => {
                        onToggleChat();
                        onClose(); // Close sidebar on mobile when opening chat
                    }}
                    className="w-full mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-3.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center font-bold transition-all active:scale-95 group"
                >
                    <div className="bg-white/20 p-1.5 rounded-lg mr-3 group-hover:rotate-12 transition-transform">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span>Asistente IA</span>
                    <span className="ml-2 flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                </button>

                {/* Developer Tools Button */}
                <button
                    onClick={() => setIsDevToolsOpen(true)}
                    className="w-full mb-6 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-center font-semibold text-sm transition-all active:scale-95 group"
                >
                    <div className="bg-white dark:bg-slate-700 p-1 rounded-md mr-2.5 shadow-sm border border-slate-100 dark:border-slate-600 group-hover:bg-white/80 transition-colors">
                        <Wrench className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>Developer Tools</span>
                </button>

                {/* Dev Tools Panel Modal */}
                <DevToolsPanel isOpen={isDevToolsOpen} onClose={() => setIsDevToolsOpen(false)} />

                {readOnly && (
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 rounded-xl flex items-center">
                        <Lock className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                            <span className="font-bold block">Modo Solo Lectura</span>
                            Solo el Administrador puede editar los datos.
                        </p>
                    </div>
                )}

                {/* Month Selector - IMPROVED UX */}
                <div className="mb-8 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity blur"></div>
                    <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center mb-2">
                            <Calendar className="w-4 h-4 mr-1.5 text-indigo-500" /> Periodo Fiscal
                        </label>
                        <div className="relative">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => onMonthChange(e.target.value)}
                                aria-label="Seleccionar periodo fiscal"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-lg font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <Calendar className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`space-y-8 ${readOnly ? 'opacity-80 pointer-events-none grayscale-[0.3]' : ''}`}>
                    {/* Section: Pedidos */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center pl-1">
                            <Truck className="w-4 h-4 mr-2" /> Pedidos
                        </h3>

                        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5 space-y-4">
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] text-indigo-600 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    Tarifa Nueva
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[['0-4km', 'ordersNew0To4'], ['4-5km', 'ordersNew4To5'], ['5-6km', 'ordersNew5To6'], ['6-7km', 'ordersNew6To7'], ['>7km', 'ordersNewGt7']].map(([label, name]) => (
                                        <div key={name}>
                                            <label htmlFor={name} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">{label}</label>
                                            <input id={name} disabled={readOnly} type="number" name={name} value={formData?.[name] || ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900 transition-all shadow-sm" min="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-50 pt-2">
                                <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-wider pl-1 mt-2">Tarifa Antigua</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[['0-3.5km', 'ordersOld0To35'], ['>3.5km', 'ordersOldGt35']].map(([label, name]) => (
                                        <div key={name}>
                                            <label htmlFor={name} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">{label}</label>
                                            <input id={name} disabled={readOnly} type="number" name={name} value={formData?.[name] || ''} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 text-sm focus:border-slate-400 focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900 transition-all" min="0" onFocus={(e) => e.target.select()} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Datos Flota (Automático) */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center pl-1">
                            <MapPin className="w-4 h-4 mr-2" /> Datos Flota
                        </h3>
                        <div className="bg-slate-900 rounded-2xl p-5 space-y-4 shadow-lg shadow-slate-200/50 text-white relative overflow-hidden">
                            {/* Decorative background accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>

                            <div className="relative">
                                <label className="text-[10px] font-medium text-slate-300 block mb-1 uppercase tracking-wider">Km Estimados (35km/L)</label>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-white tracking-tight">
                                        {estimatedKm.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                                    </span>
                                    <span className="text-sm font-medium text-slate-400">km</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
                                    Cálculo automático basado en gasto de combustible.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Laboral */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center pl-1">
                            <Users className="w-4 h-4 mr-2" /> Laboral
                        </h3>
                        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Riders Contratados</label>
                                <div className="flex items-center">
                                    <input disabled={readOnly} type="number" name="contractedRiders" value={formData.contractedRiders || ''} onChange={handleChange} aria-label="Riders contratados" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none transition-all" min="0" onFocus={(e) => e.target.select()} />
                                    <span className="ml-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800 whitespace-nowrap">+1 Gerente</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Horas Totales Servicio</label>
                                <div className="relative">
                                    <input disabled={readOnly} type="number" name="totalHours" value={formData.totalHours || ''} onChange={handleChange} aria-label="Horas totales de servicio" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none transition-all pl-9" min="0" onFocus={(e) => e.target.select()} />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Activity className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center pl-1">
                            <Settings className="w-4 h-4 mr-2" /> Config Básica
                        </h3>
                        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Nº Motos</label>
                                    <input disabled={readOnly} type="number" name="motoCount" value={formData.motoCount || ''} onChange={handleChange} aria-label="Número de motos" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none transition-all" min="0" onFocus={(e) => e.target.select()} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Royalty %</label>
                                    <input disabled={readOnly} type="number" name="royaltyPercent" value={formData.royaltyPercent || ''} onChange={handleChange} aria-label="Porcentaje de royalty" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none transition-all" min="0" onFocus={(e) => e.target.select()} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Fixed Costs */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center pl-1">
                            <Lock className="w-4 h-4 mr-2" /> Costes Fijos
                        </h3>

                        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5 space-y-4">
                            <p className="text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 mb-2">Gastos recurrentes. Introduce solo la <span className="font-bold text-slate-600 dark:text-slate-300">Base Imponible</span>.</p>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label htmlFor="salaries" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Salarios</label>
                                    <input id="salaries" disabled={readOnly} type="number" name="salaries" value={formData.salaries || ''} onChange={handleChange} aria-label="Salarios mensuales" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none transition-all shadow-sm" min="0" onFocus={(e) => e.target.select()} />
                                </div>

                                {[['Seguros', 'insurance'], ['Gestoría', 'agencyFee'], ['PRL', 'prlFee'], ['S. Financieros', 'accountingFee'], ['S. Profesionales', 'services'], ['Cuota Autónomo', 'quota']].map(([label, name]) => (
                                    <div key={name}>
                                        <label htmlFor={name} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">{label}</label>
                                        <input id={name} disabled={readOnly} type="number" name={name} value={formData?.[name] || ''} onChange={handleChange} placeholder={label} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none transition-all" min="0" onFocus={(e) => e.target.select()} />
                                    </div>
                                ))}

                                <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3 mt-1">
                                    <label htmlFor="marketing" className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-1 uppercase tracking-tight">Marketing & Ads</label>
                                    <div className="relative">
                                        <input id="marketing" disabled={readOnly} type="number" name="marketing" value={formData.marketing || ''} onChange={handleChange} placeholder="Gasto en fb/ig/google" className="w-full bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg px-3 py-2 text-purple-900 dark:text-purple-200 text-sm font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 focus:outline-none transition-all placeholder:text-purple-300" min="0" onFocus={(e) => e.target.select()} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Variable Costs */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center pl-1">
                            <Activity className="w-4 h-4 mr-2" /> Costes Variables
                        </h3>

                        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="gasoline" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Gasolina (Base)</label>
                                    <input id="gasoline" disabled={readOnly} type="number" name="gasoline" value={formData.gasoline || ''} onChange={handleChange} className="w-full bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg px-2 py-2 text-slate-700 dark:text-slate-200 text-sm font-bold focus:border-orange-500 focus:outline-none" min="0" onFocus={(e) => e.target.select()} />
                                </div>
                                <div>
                                    <label htmlFor="gasolinePrice" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Precio/L (Base)</label>
                                    <input id="gasolinePrice" disabled={readOnly} type="number" name="gasolinePrice" value={formData.gasolinePrice || ''} onChange={handleChange} placeholder="1.50" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 text-slate-600 dark:text-slate-300 text-sm focus:border-orange-500 focus:outline-none" min="0" step="0.01" onFocus={(e) => e.target.select()} />
                                </div>
                                <div>
                                    <label htmlFor="repairs" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Reparaciones</label>
                                    <input id="repairs" disabled={readOnly} type="number" name="repairs" value={formData.repairs || ''} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 text-sm focus:border-orange-500 focus:outline-none" min="0" onFocus={(e) => e.target.select()} />
                                </div>
                                <div>
                                    <label htmlFor="otherExpenses" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">Otros Costes</label>
                                    <input id="otherExpenses" disabled={readOnly} type="number" name="otherExpenses" value={formData.otherExpenses || ''} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 text-sm focus:border-orange-500 focus:outline-none" min="0" onFocus={(e) => e.target.select()} />
                                </div>
                                <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3 mt-1">
                                    <label htmlFor="incidents" className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-1 uppercase tracking-tight">Mermas e Incidencias</label>
                                    <input id="incidents" disabled={readOnly} type="number" name="incidents" value={formData.incidents || ''} onChange={handleChange} placeholder="Coste de errores/devoluciones" className="w-full bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-lg px-3 py-2 text-rose-900 dark:text-rose-200 text-sm font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900 focus:outline-none placeholder:text-rose-300" min="0" onFocus={(e) => e.target.select()} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Fiscalidad */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center pl-1">
                            <Landmark className="w-4 h-4 mr-2" /> Fiscalidad
                        </h3>
                        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5">
                            <div>
                                <label htmlFor="irpfPercent" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-tight">IRPF Estimado (%)</label>
                                <div className="relative">
                                    <input id="irpfPercent" disabled={readOnly} type="number" name="irpfPercent" value={formData.irpfPercent || ''} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900 focus:outline-none" min="0" onFocus={(e) => e.target.select()} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!readOnly && (
                        <button onClick={handleApply} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl mt-4 active:scale-95 border border-slate-700">
                            Guardar Configuración
                        </button>
                    )}
                </div>



                {/* Version Indicator */}
                <div className="mt-8 text-center pb-8 opacity-40 text-[10px] text-slate-400 font-mono">
                    REPAART v2.0 (Executive White)
                </div>
            </div>
        </div>
    );
};

export default InputSidebar;
