import React, { useState } from 'react';
import { X, MousePointer2, Keyboard, Layers, Filter, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SchedulerGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabKey = 'concepts' | 'expert' | 'tools' | 'shortcuts';

export const SchedulerGuideModal: React.FC<SchedulerGuideModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('concepts');

    if (!isOpen) return null;

    const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
        { key: 'concepts', label: 'Conceptos', icon: <Layers size={18} /> },
        { key: 'expert', label: 'Operativa', icon: <MousePointer2 size={18} /> },
        { key: 'tools', label: 'Herramientas', icon: <Filter size={18} /> },
        { key: 'shortcuts', label: 'Atajos', icon: <Keyboard size={18} /> },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row max-h-[85vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Close Button - Compact */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-[110] p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Cerrar Guía"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Compact Sidebar */}
                <nav className="hidden md:flex w-16 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-100 dark:border-white/5 flex-col items-center py-4 gap-3 overflow-y-auto">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                title={tab.label}
                                className={cn(
                                    "p-3 rounded-xl transition-all",
                                    isActive
                                        ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-600'
                                )}
                            >
                                {React.cloneElement(tab.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
                            </button>
                        );
                    })}
                </nav>

                {/* Main Content - Dense Grid */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900 relative">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* Header: Compact */}
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {tabs.find(t => t.key === activeTab)?.icon}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {tabs.find(t => t.key === activeTab)?.label}
                                </h2>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    Manual Operativo v2.1
                                </p>
                            </div>
                        </div>

                        {/* 2-Column Dense Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                            {/* LEFT COLUMN: Theory & Definition (7 cols) */}
                            <div className="md:col-span-7 space-y-6">

                                {/* TAB: CONCEPTOS (Left) */}
                                {activeTab === 'concepts' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filosofía del Ciclo de Vida</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                                En Repaart, un turno es un organismo vivo que evoluciona. Entender su maduración es clave para evitar conflictos.
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-5 border border-slate-100 dark:border-white/5 space-y-5">
                                            {/* Phase 1: Draft */}
                                            <div className="relative pl-6 border-l-2 border-slate-200">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white" />
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-700 uppercase">Fase 1: Borrador</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Gris / Transparente</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    El turno solo existe en tu pantalla. Es el momento de experimentar. Aunque guardes, si no publicas, el rider no lo ve.
                                                    <br /><span className="italic text-slate-400">&quot;Zona segura para planificadores.&quot;</span>
                                                </p>
                                            </div>

                                            {/* Phase 2: Published */}
                                            <div className="relative pl-6 border-l-2 border-indigo-200">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm shadow-indigo-500/50" />
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="text-xs font-black text-indigo-700 uppercase">Fase 2: Publicado</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">Color Sólido</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    El turno es oficial. El rider recibe una notificación push inmediata. Cualquier cambio a partir de aquí generará alertas de &quot;Modificación de Horario&quot;.
                                                </p>
                                            </div>

                                            {/* Phase 3: Validated */}
                                            <div className="relative pl-6 border-l-2 border-emerald-200">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm shadow-emerald-500/50 flex items-center justify-center">
                                                    <ShieldCheck size={8} className="text-white" />
                                                </div>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="text-xs font-black text-emerald-700 uppercase">Fase 3: Validado</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Check Verde</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    <span className="font-bold text-emerald-600">Santificado para Nómina.</span> El sistema bloquea modificaciones accidentales. Indica que el servicio se ha cumplido y pagado.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* NEW: Workflow Completo (Visual) */}
                                {activeTab === 'concepts' && (
                                    <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline de Producción</h4>
                                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 overflow-x-auto pb-2">
                                            <div className="flex flex-col items-center gap-2 min-w-[60px]">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">1</div>
                                                <span>Borrador</span>
                                            </div>
                                            <div className="h-px bg-slate-200 flex-1 mx-2" />
                                            <div className="flex flex-col items-center gap-2 min-w-[60px]">
                                                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">2</div>
                                                <span>Auditoría</span>
                                            </div>
                                            <div className="h-px bg-slate-200 flex-1 mx-2" />
                                            <div className="flex flex-col items-center gap-2 min-w-[60px]">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">3</div>
                                                <span>Publicación</span>
                                            </div>
                                            <div className="h-px bg-slate-200 flex-1 mx-2" />
                                            <div className="flex flex-col items-center gap-2 min-w-[60px]">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">4</div>
                                                <span>Validación</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: EXPERT (Left) */}
                                {activeTab === 'expert' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mecánicas de Precisión</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                                Dominar el tablero requiere entender cómo el sistema interpreta tus movimientos. No es solo &quot;mover cajas&quot;, es orquestar recursos.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 dark:border-white/5">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mb-3 text-indigo-600">
                                                    <Layers size={16} />
                                                </div>
                                                <h5 className="text-xs font-bold text-slate-700 mb-1">Smart Snap (Imán)</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    Todo se alinea a bloques de <strong>15 minutos</strong>. Es imposible crear turnos &quot;rotos&quot; (ej: 14:07). Esto garantiza nóminas limpias y cuadrantes legibles.
                                                </p>
                                            </div>

                                            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 dark:border-white/5">
                                                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center mb-3 text-rose-600">
                                                    <Zap size={16} />
                                                </div>
                                                <h5 className="text-xs font-bold text-slate-700 mb-1">Gestión de Conflictos</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    Si intentas solapar dos turnos, el sistema los fusionará o te alertará. <span className="font-bold text-rose-600">Nunca</span> permitirá doble asignación a un mismo rider.
                                                </p>
                                            </div>
                                        </div>

                                        {/* NEW: Overtime Policy Alert */}
                                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 dark:border-white/5 flex gap-4">
                                            <div className="shrink-0">
                                                <ShieldCheck size={20} className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-indigo-900 mb-1">Política de Flexibilidad Gerencial</h5>
                                                <p className="text-[10px] text-indigo-600/80 leading-relaxed">
                                                    Las alertas de Overtime (Rojo) son <strong>bloqueantes con confirmación</strong>. El sistema detendrá la asignación y pedirá tu aprobación explícita (&quot;Manager Override&quot;) para exceder el límite. <span className="italic">&quot;La IA protege, el humano decide.&quot;</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Flujo de Reasignación</h5>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-600">
                                                <div className="px-2 py-1 bg-white border rounded shadow-sm">Rider A (Original)</div>
                                                <ChevronRight size={12} className="text-slate-400" />
                                                <div className="px-2 py-1 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded shadow-sm font-bold">Rider B (Nuevo)</div>
                                            </div>
                                            <p className="mt-2 text-[10px] text-slate-500 italic">
                                                &quot;Al mover un turno de fila, el Rider A recibe cancelación y el Rider B recibe nueva asignación automáticamente.&quot;
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: TOOLS (Left) */}
                                {activeTab === 'tools' && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl shadow-xl shadow-slate-900/10 relative overflow-hidden group hover:scale-[1.01] transition-transform">
                                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                                <ShieldCheck size={80} />
                                            </div>
                                            <div className="relative z-10 flex gap-6 items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 uppercase tracking-wider">Premium AI</span>
                                                        <h3 className="text-lg font-bold text-white">The Sheriff</h3>
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                                        Tu auditor personal. Analiza en tiempo real <strong>+20 parámetros</strong> (descansos legales, horas máximas, cobertura mínima). Si ves el badge verde, estás blindado legalmente.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300">
                                                            <span className="font-bold text-white">40h</span> Límite
                                                        </div>
                                                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300">
                                                            <span className="font-bold text-white">12h</span> Descanso
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="text-4xl font-black text-white tracking-tighter filter drop-shadow-lg">98<span className="text-lg text-emerald-500">%</span></div>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Score Operativo</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <h5 className="text-[10px] font-bold uppercase text-slate-400">QuickFill (Relleno Mágico)</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed text-justify">
                                                    ¿Semana vacía? QuickFill analiza el histórico de las últimas 4 semanas y propone un borrador inteligente basado en patrones de demanda. <span className="font-bold text-indigo-600">Ahorra el 80% del setup inicial.</span>
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <h5 className="text-[10px] font-bold uppercase text-slate-400">Filtros (Sol / Luna)</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed text-justify">
                                                    Simplifica el ruido visual. Activa el modo &quot;Mediodía&quot; para trabajar solo la franja 13:00-16:00, o &quot;Noche&quot; para enfocar el servicio de cena.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: SHORTCUTS (Left) */}
                                {activeTab === 'shortcuts' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maestría de Teclado</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                                Un planificador senior apenas toca el ratón. Usa estos combos para operar a la velocidad del pensamiento.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-black text-xs text-slate-700 shadow-sm border border-slate-200">Alt</div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-indigo-900">Modo Clonado (Dios)</span>
                                                        <span className="text-[9px] text-indigo-600">Arrastra un turno mientras mantienes pulsado.</span>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-1 rounded bg-white text-[9px] font-bold text-indigo-500 border border-indigo-100">Esencial</span>
                                            </div>

                                            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
                                                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700 border border-slate-300 shadow-[0_2px_0_#cbd5e1]">Supr</kbd>
                                                <span className="text-[10px] font-medium text-slate-600">Borrar selección</span>
                                            </div>

                                            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
                                                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700 border border-slate-300 shadow-[0_2px_0_#cbd5e1]">Esc</kbd>
                                                <span className="text-[10px] font-medium text-slate-600">Cancelar / Cerrar</span>
                                            </div>

                                            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700 border border-slate-300 shadow-[0_2px_0_#cbd5e1]">Ctrl</kbd>
                                                    <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700 border border-slate-300 shadow-[0_2px_0_#cbd5e1]">Z</kbd>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-600">Deshacer (WIP)</span>
                                            </div>

                                            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3 cursor-not-allowed opacity-50">
                                                <div className="flex gap-1">
                                                    <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700 border border-slate-300 shadow-[0_2px_0_#cbd5e1]">Ctrl</kbd>
                                                    <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700 border border-slate-300 shadow-[0_2px_0_#cbd5e1]">S</kbd>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-600">Guardar Forzoso</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* RIGHT COLUMN: Execution & Metrics (5 cols) */}
                            <div className="md:col-span-5 space-y-6">

                                {/* TAB: CONCEPTOS (Right) */}
                                {activeTab === 'concepts' && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diccionario Visual</h4>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                            {/* Standard */}
                                            {/* Green: Available */}
                                            <div className="flex gap-3 items-start">
                                                <div className="w-10 h-6 bg-emerald-500 rounded border border-emerald-600 shadow-sm shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-700">Disponible (Verde)</p>
                                                    <p className="text-[9px] text-slate-500 leading-tight">Le restan más de 5h para cumplir contrato. Priorizar asignación.</p>
                                                </div>
                                            </div>
                                            {/* Amber: Optimal */}
                                            <div className="flex gap-3 items-start">
                                                <div className="w-10 h-6 bg-amber-400 rounded border border-amber-500 shadow-sm shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-700">Óptimo (Ámbar)</p>
                                                    <p className="text-[9px] text-slate-500 leading-tight">En rango de cierre (faltan menos de 5h). Gestión fina.</p>
                                                </div>
                                            </div>
                                            {/* Red: Overtime */}
                                            <div className="flex gap-3 items-start">
                                                <div className="w-10 h-6 bg-rose-500 rounded border border-rose-600 shadow-sm shrink-0 relative overflow-hidden flex items-center justify-center">
                                                    <div className="text-[9px] font-black text-white/90 uppercase tracking-widest leading-none">+H</div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-700">Overtime (Rojo)</p>
                                                    <p className="text-[9px] text-slate-500 leading-tight">Ha superado horas de contrato. Evitar asignar salvo emergencia.</p>
                                                </div>
                                            </div>
                                            {/* Conflict/Request */}
                                            <div className="flex gap-3 items-start">
                                                <div className="w-10 h-6 bg-amber-100 rounded border border-amber-300 shadow-sm shrink-0 relative overflow-hidden flex items-center justify-center">
                                                    <div className="w-full h-[1px] bg-amber-300 rotate-45" />
                                                    <div className="w-full h-[1px] bg-amber-300 -rotate-45 absolute" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-700">Solicitud / Incidencia</p>
                                                    <p className="text-[9px] text-slate-500 leading-tight">El rider ha pedido un cambio. Requiere tu aprobación.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: EXPERT (Right) */}
                                {activeTab === 'expert' && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Acciones Contextuales</h4>
                                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-w-[200px] mx-auto rotate-1 hover:rotate-0 transition-transform cursor-default">
                                            <div className="px-3 py-2 hover:bg-slate-50 rounded flex justify-between items-center text-xs text-slate-700">
                                                <span>Editar Horas</span>
                                                <span className="text-[9px] text-slate-400">E</span>
                                            </div>
                                            <div className="px-3 py-2 hover:bg-slate-50 rounded flex justify-between items-center text-xs text-slate-700 border-b border-slate-100/50">
                                                <span>Cambiar Rider</span>
                                                <ChevronRight size={10} className="text-slate-400" />
                                            </div>
                                            <div className="px-3 py-2 hover:bg-rose-50 rounded flex justify-between items-center text-xs text-rose-600 mt-1">
                                                <span>Eliminar</span>
                                                <span className="text-[9px] text-rose-300">Supr</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-center text-slate-400 italic mt-2">
                                            &quot;El click derecho es tu mejor amigo. Úsalo sobre cualquier turno para ver opciones avanzadas.&quot;
                                        </p>
                                    </div>
                                )}

                                {/* TAB: TOOLS (Right) */}
                                {activeTab === 'tools' && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atajos de Cobertura</h4>
                                        <div className="space-y-3">
                                            <p className="text-[10px] text-slate-500 text-justify">
                                                La barra inferior te muestra la cobertura neta. Si ves números rojos, falta personal.
                                            </p>
                                            <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 flex items-center gap-3">
                                                <div className="px-2 py-1 bg-white rounded border border-orange-200 text-xs font-black text-orange-600 shadow-sm">-2</div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-orange-800">Déficit de Riders</p>
                                                    <p className="text-[9px] text-orange-600/80">Necesitas 2 motos más para cubrir la demanda prevista.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: SHORTCUTS (Right) */}
                                {activeTab === 'shortcuts' && (
                                    <div className="h-full flex flex-col justify-center items-center text-center space-y-4 opacity-50">
                                        <Keyboard size={48} className="text-slate-300" />
                                        <p className="text-xs text-slate-400 max-w-[200px]">
                                            Próximamente añadiremos macros personalizables y soporte para StreamDeck.
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                        <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Página {(tabs.findIndex(t => t.key === activeTab) + 1)} de {tabs.length}
                            </p>
                            <button
                                onClick={() => {
                                    const nextIdx = (tabs.findIndex(t => t.key === activeTab) + 1) % tabs.length;
                                    setActiveTab(tabs[nextIdx].key);
                                }}
                                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-400 transition-colors"
                            >
                                Siguiente Lección
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
};
