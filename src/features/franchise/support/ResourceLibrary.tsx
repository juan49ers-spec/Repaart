import React from 'react';
import { BookOpen, AlertCircle, Settings, LifeBuoy, Video, Package, DollarSign, Wrench, AlertTriangle, ArrowRight, LucideIcon } from 'lucide-react';

export const CATEGORIES = [
    { id: 'operativa', label: 'Operativa', icon: Package, color: 'indigo', desc: 'Logística, riders, rutas' },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign, color: 'emerald', desc: 'Facturas, pagos, impuestos' },
    { id: 'tecnico', label: 'Técnico', icon: Wrench, color: 'slate', desc: 'Motos, mantenimiento, app' },
    { id: 'accidente', label: 'Accidente', icon: AlertTriangle, color: 'rose', desc: 'Siniestros, seguros' },
];


const ResourceLibrary: React.FC = () => {
    return (
        <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center space-x-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                    <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Centro de Recursos</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Documentación y manuales para el éxito</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {CATEGORIES.map((cat, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl dark:hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all cursor-pointer group hover:-translate-y-1 duration-300 relative overflow-hidden shadow-sm dark:shadow-none"
                    >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

                        <div className={`w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm dark:shadow-none`}>
                            <cat.icon className={`w-7 h-7 text-indigo-600 dark:text-indigo-400`} />
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 mb-2 text-lg transition-colors">{cat.label}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug mb-3 transition-colors">{cat.desc}</p>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Ver Herramientas</span>
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ResourceLibrary;
