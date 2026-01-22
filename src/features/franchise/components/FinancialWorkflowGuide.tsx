import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    FileText,
    Lock,
    Unlock,
    CheckCircle,
    X,
    Clock,
    RefreshCw,
    Bell,
    ShieldAlert,
    Wallet,
    Banknote,
    PieChart,
    TrendingUp,
    Sparkles,
    AlertTriangle,
    HelpCircle
} from 'lucide-react';

interface FinancialWorkflowGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const FinancialWorkflowGuide: React.FC<FinancialWorkflowGuideProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [activeSection, setActiveSection] = useState<
        'inicio' | 'ingresos' | 'gastos' | 'cierre' | 'estados' | 'errores' | 'faq'
    >('inicio');

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const sectionRefs = {
        inicio: useRef<HTMLDivElement | null>(null),
        ingresos: useRef<HTMLDivElement | null>(null),
        gastos: useRef<HTMLDivElement | null>(null),
        cierre: useRef<HTMLDivElement | null>(null),
        estados: useRef<HTMLDivElement | null>(null),
        errores: useRef<HTMLDivElement | null>(null),
        faq: useRef<HTMLDivElement | null>(null)
    };

    const sections = useMemo(() => {
        return [
            { key: 'inicio' as const, title: 'Inicio rápido', icon: Sparkles, badge: '5 min' },
            { key: 'ingresos' as const, title: 'Ingresos', icon: Banknote, badge: 'Paso 1' },
            { key: 'gastos' as const, title: 'Gastos', icon: PieChart, badge: 'Paso 2' },
            { key: 'cierre' as const, title: 'Confirmación', icon: CheckCircle, badge: 'Checklist' },
            { key: 'estados' as const, title: 'Estados', icon: Lock, badge: 'Control' },
            { key: 'errores' as const, title: 'Errores típicos', icon: AlertTriangle, badge: 'Evita' },
            { key: 'faq' as const, title: 'FAQ', icon: HelpCircle, badge: 'Dudas' }
        ];
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const scrollTo = (key: typeof activeSection) => {
        setActiveSection(key);
        sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="relative z-[100]">
            <div
                className="fixed inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="fixed inset-0 flex items-start justify-start p-4 pt-6 lg:pt-8 pl-4 lg:pl-[88px] pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Guía de Gestión Financiera"
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[86vh] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/10 dark:ring-white/10"
                >
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950/60">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-500/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Guía de Gestión Financiera
                                    </h2>
                                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                        Cierre mensual sin dudas
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Lo que entra (Ingresos), lo que sale (Gastos) y lo que te queda (control).
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            title="Cerrar (Esc)"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] bg-slate-50/60 dark:bg-slate-950/60">
                        <div className="hidden lg:flex flex-col border-r border-slate-100 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                            <div className="p-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                                            <Banknote className="w-4 h-4 text-indigo-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ingresos</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Paso 1</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                                            <PieChart className="w-4 h-4 text-rose-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Gastos</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Paso 2</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                                            <Lock className="w-4 h-4 text-slate-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Cierre</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">OK</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 pb-4">
                                <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-500/20 border border-indigo-500/30">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Reglas fáciles</p>
                                        <TrendingUp className="w-4 h-4 text-indigo-100" />
                                    </div>
                                    <ul className="mt-3 space-y-2 text-xs font-semibold text-indigo-50/95">
                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/70" />No cierres si faltan gastos fijos.</li>
                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/70" />Revisa renting, comisión de Repaart e impuestos.</li>
                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/70" />Guarda borrador y revisa 2 minutos.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="px-2 pb-4">
                                <div className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Navegación
                                </div>
                                <div className="mt-2 flex flex-col gap-1">
                                    {sections.map((s) => {
                                        const Icon = s.icon;
                                        const isActive = activeSection === s.key;
                                        return (
                                            <button
                                                key={s.key}
                                                onClick={() => scrollTo(s.key)}
                                                className={[
                                                    'w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between border',
                                                    isActive
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                        : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-white/10 hover:bg-white hover:dark:bg-white/10'
                                                ].join(' ')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={[
                                                        'w-8 h-8 rounded-lg flex items-center justify-center',
                                                        isActive ? 'bg-white/10' : 'bg-slate-100 dark:bg-white/5'
                                                    ].join(' ')}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black tracking-tight">{s.title}</div>
                                                        <div className={['text-[10px] font-bold uppercase tracking-widest', isActive ? 'text-white/70' : 'text-slate-400'].join(' ')}>
                                                            {s.badge}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div ref={scrollRef} className="min-h-0 overflow-y-auto p-4 md:p-8">
                            <div className="max-w-3xl mx-auto space-y-10">
                                <div ref={sectionRefs.inicio} className="scroll-mt-6">
                                    <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Inicio rápido</p>
                                                    <h3 className="text-xl font-black tracking-tight mt-1">Cierra el mes sin complicarte</h3>
                                                    <p className="text-sm text-white/80 mt-2 leading-relaxed">
                                                        En 5 minutos: registra ingresos, completa gastos críticos y confirma el cierre con tranquilidad.
                                                    </p>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 py-2">
                                                    <Clock className="w-4 h-4 text-white/70" />
                                                    <span className="text-xs font-bold text-white/80">Tiempo: 3–5 min</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="rounded-xl p-4 border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                        <Banknote className="w-4 h-4 text-indigo-500" />
                                                        <p className="text-xs font-black uppercase tracking-widest">Paso 1</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Ingresos</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pedidos por km + ajuste manual si hace falta.</p>
                                                </div>
                                                <div className="rounded-xl p-4 border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                        <PieChart className="w-4 h-4 text-rose-500" />
                                                        <p className="text-xs font-black uppercase tracking-widest">Paso 2</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Gastos</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gastos de cada mes y gastos puntuales. Prioriza: sueldos, Seguridad Social, renting y comisión Repaart.</p>
                                                </div>
                                                <div className="rounded-xl p-4 border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                        <p className="text-xs font-black uppercase tracking-widest">Final</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Confirmar</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Checklist rápido. Confirma y bloquea el mes.</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/10 p-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-xl bg-white dark:bg-white/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                                                        <Wallet className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
                                                            Señal de salud
                                                        </p>
                                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mt-1">
                                                            Si suben ingresos pero no sube “En tu bolsillo”, el problema casi siempre está en 3 sitios:
                                                        </p>
                                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                            <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-indigo-100 dark:border-indigo-500/20 p-3 text-xs font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-rose-500" /> Coste por hora
                                                            </div>
                                                            <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-indigo-100 dark:border-indigo-500/20 p-3 text-xs font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-amber-500" /> Renting + gasolina
                                                            </div>
                                                            <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-indigo-100 dark:border-indigo-500/20 p-3 text-xs font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Royalty/SS
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div ref={sectionRefs.ingresos} className="scroll-mt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
                                                <Banknote className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Ingresos (Paso 1)</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Cómo rellenar sin “inventarte” números.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => scrollTo('gastos')} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                                            Siguiente <span className="text-white/70">→</span>
                                        </button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Qué introducir</p>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-4">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                        <Clock className="w-4 h-4 text-indigo-500" />
                                                        <p className="text-xs font-bold">Pedidos por distancia</p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                        Rellena los rangos de km. Si no lo sabes exacto, usa el total de pedidos y reparte según tu operativa típica.
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-4">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                        <RefreshCw className="w-4 h-4 text-indigo-500" />
                                                        <p className="text-xs font-bold">Ajuste manual</p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                        Úsalo solo si hay descuadre real (bonus, incidencias positivas, corrección de tarifa).
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-4">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                        <Bell className="w-4 h-4 text-indigo-500" />
                                                        <p className="text-xs font-bold">Cancelados</p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                        Te da contexto operativo. Si sube, revisa rutas, riders y tiempos de espera.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                                                        Truco de precisión
                                                    </p>
                                                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mt-1">
                                                        Cierra “Ingresos” con una regla simple: si el total no te suena, no es el total correcto.
                                                    </p>
                                                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-2">
                                                        Ajusta manualmente solo cuando tengas un motivo concreto (y luego cuadras el gasto/ingreso asociado).
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div ref={sectionRefs.gastos} className="scroll-mt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20">
                                                <PieChart className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Gastos (Paso 2)</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Donde se gana o se pierde el mes.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => scrollTo('cierre')} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                                            Checklist <span className="text-white/70">→</span>
                                        </button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Prioridad</p>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Wallet className="w-4 h-4 text-rose-500" />
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Gastos que casi siempre están</p>
                                                    </div>
                                                    <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500" /> Salarios + Seguridad Social</li>
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500" /> Renting (unidades y precio)</li>
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500" /> Comisión de Repaart</li>
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500" /> Gasolina + Reparaciones</li>
                                                    </ul>
                                                </div>
                                                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Control de coherencia</p>
                                                    </div>
                                                    <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" /> Si sube renting, revisa unidades</li>
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" /> Si sube gasolina, revisa km/pedidos</li>
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" /> Si sube coste/hora, revisa horas y salarios</li>
                                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" /> Si te queda menos dinero, no lo arregles “tocando ingresos”</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/10 p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                                                    <RefreshCw className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
                                                        Renting: regla clara
                                                    </p>
                                                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mt-1">
                                                        Si pones unidades, pon precio unitario. Si no hay renting ese mes, deja 0 y 0.
                                                    </p>
                                                    <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80 mt-2">
                                                        Si ese mes el renting es 0, déjalo en 0. No hace falta “inventarlo”.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div ref={sectionRefs.cierre} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Checklist antes de confirmar</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">30 segundos para evitar un mes “mal cerrado”.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {[
                                                { title: 'Ingresos coherentes', desc: '¿El total te “suena” con la operativa real?', icon: Banknote, color: 'indigo' },
                                                { title: 'Renting correcto', desc: 'Unidades y precio unitario cuadran.', icon: Wallet, color: 'violet' },
                                                { title: 'Gastos fijos completos', desc: 'Sueldos, Seguridad Social, gestoría/servicios si aplica.', icon: ShieldAlert, color: 'amber' },
                                                { title: 'Gastos variables', desc: 'Gasolina, reparaciones, incidencias, otros.', icon: PieChart, color: 'rose' }
                                            ].map((c) => {
                                                const Icon = c.icon;
                                                const color =
                                                    c.color === 'indigo'
                                                        ? 'border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                                        : c.color === 'violet'
                                                            ? 'border-violet-100 dark:border-violet-500/20 bg-violet-50/60 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                                            : c.color === 'amber'
                                                                ? 'border-amber-100 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200'
                                                                : 'border-rose-100 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300';
                                                return (
                                                    <div key={c.title} className={['rounded-2xl border p-4', color].join(' ')}>
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 rounded-xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10">
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black uppercase tracking-widest">{c.title}</p>
                                                                <p className="text-xs mt-2 text-slate-700/80 dark:text-slate-200/80">{c.desc}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div ref={sectionRefs.estados} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Estados del mes</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Qué puedes hacer en cada estado.</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-white dark:bg-slate-900 shadow-sm p-5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Abierto</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Editable</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Puedes guardar borrador y ajustar datos.</p>
                                        </div>
                                        <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-white dark:bg-slate-900 shadow-sm p-5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                <p className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">Pendiente de abrir</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Pendiente</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Esperando aprobación para reabrir.</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm p-5">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-slate-500" />
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Cerrado</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Solo lectura</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Para modificar, solicita desbloqueo.</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/10 p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                                                <Unlock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
                                                    Cómo corregir un mes cerrado
                                                </p>
                                                <ol className="mt-3 space-y-2 text-xs text-indigo-900/90 dark:text-indigo-100/90">
                                                    <li className="flex gap-2"><span className="mt-1 w-5 h-5 rounded-lg bg-white/70 dark:bg-white/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-[10px] font-black">1</span> Solicita desbloqueo y explica el motivo.</li>
                                                    <li className="flex gap-2"><span className="mt-1 w-5 h-5 rounded-lg bg-white/70 dark:bg-white/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-[10px] font-black">2</span> Espera notificación de aprobación/rechazo.</li>
                                                    <li className="flex gap-2"><span className="mt-1 w-5 h-5 rounded-lg bg-white/70 dark:bg-white/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-[10px] font-black">3</span> Si se abre, corrige y vuelve a confirmar cierre.</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div ref={sectionRefs.errores} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Errores típicos</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Los que más dinero cuestan.</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        {[
                                            {
                                                title: 'Cerrar sin gastos importantes',
                                                desc: 'Si faltan sueldos, Seguridad Social o renting, parece que te va mejor de lo real.'
                                            },
                                            {
                                                title: 'Usar “Ajuste manual” sin motivo',
                                                desc: 'Si no hay una razón concreta, mejor revisa los pedidos y el total antes de tocarlo.'
                                            },
                                            {
                                                title: 'Olvidar reparaciones/incidencias',
                                                desc: 'Son “pequeños” pero suman: mejor meterlos que sorprenderte en banco.'
                                            }
                                        ].map((x) => (
                                            <div key={x.title} className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{x.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{x.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div ref={sectionRefs.faq} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                                            <HelpCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">FAQ</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Respuestas rápidas.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        {[
                                            {
                                                q: '¿Puedo cerrar con datos incompletos?',
                                                a: 'Sí, pero no es recomendable. Usa “Guardar Borrador” y completa lo crítico antes de confirmar.'
                                            },
                                            {
                                                q: '¿Qué hago si ya confirmé y falta una factura?',
                                                a: 'Solicita desbloqueo explicando el motivo. Cuando se reabra, corrige y vuelve a cerrar.'
                                            },
                                            {
                                                q: '¿Por qué el desglose no coincide con mi intuición?',
                                                a: 'Casi siempre es por sueldos/horas, renting, gasolina o la comisión de Repaart. Empieza por esas.'
                                            }
                                        ].map((x) => (
                                            <div key={x.q} className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{x.q}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{x.a}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                Consejo: usa Esc para cerrar
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => scrollTo('inicio')}
                                className="px-4 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
                            >
                                Volver arriba
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialWorkflowGuide;
