import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Copy,
    HelpCircle,
    Keyboard,
    MousePointer2,
    Plus,
    Send,
    ShieldCheck,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SchedulerGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SectionKey = 'inicio' | 'crear' | 'mover' | 'publicar' | 'colores' | 'problemas' | 'atajos';

export const SchedulerGuideModal: React.FC<SchedulerGuideModalProps> = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState<SectionKey>('inicio');
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const refInicio = useRef<HTMLDivElement | null>(null);
    const refCrear = useRef<HTMLDivElement | null>(null);
    const refMover = useRef<HTMLDivElement | null>(null);
    const refPublicar = useRef<HTMLDivElement | null>(null);
    const refColores = useRef<HTMLDivElement | null>(null);
    const refProblemas = useRef<HTMLDivElement | null>(null);
    const refAtajos = useRef<HTMLDivElement | null>(null);

    const sections = useMemo(() => {
        return [
            { key: 'inicio' as const, title: 'Inicio rápido', icon: Calendar, badge: '2 min' },
            { key: 'crear' as const, title: 'Crear turnos', icon: Plus, badge: 'Paso 1' },
            { key: 'mover' as const, title: 'Mover / copiar', icon: Copy, badge: 'Paso 2' },
            { key: 'publicar' as const, title: 'Publicar', icon: Send, badge: 'Paso 3' },
            { key: 'colores' as const, title: 'Qué significan', icon: ShieldCheck, badge: 'Visual' },
            { key: 'problemas' as const, title: 'Problemas típicos', icon: AlertTriangle, badge: 'Evita' },
            { key: 'atajos' as const, title: 'Atajos', icon: Keyboard, badge: 'Extra' }
        ];
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const scrollTo = (key: SectionKey) => {
        setActiveSection(key);
        const refMap: Record<SectionKey, React.RefObject<HTMLDivElement | null>> = {
            inicio: refInicio,
            crear: refCrear,
            mover: refMover,
            publicar: refPublicar,
            colores: refColores,
            problemas: refProblemas,
            atajos: refAtajos
        };
        refMap[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="fixed inset-0 z-[100]">
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />

            <div className="fixed inset-0 flex items-start justify-start p-4 pt-6 lg:pt-8 pl-4 lg:pl-[88px] pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Guía de operativa"
                    className="pointer-events-auto w-full max-w-6xl max-h-[86vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10 flex flex-col"
                >
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950/60">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-500/20">
                                <MousePointer2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Guía de Operativa
                                    </h2>
                                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                        Horarios sin líos
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Crear turnos, moverlos, publicar y evitar errores típicos.
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
                                            <Plus className="w-4 h-4 text-indigo-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Crear</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Paso 1</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                                            <Copy className="w-4 h-4 text-violet-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Mover</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Paso 2</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                                            <Send className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Publicar</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Paso 3</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 pb-4">
                                <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-500/20 border border-indigo-500/30">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Reglas fáciles</p>
                                        <ShieldCheck className="w-4 h-4 text-indigo-100" />
                                    </div>
                                    <ul className="mt-3 space-y-2 text-xs font-semibold text-indigo-50/95">
                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/70" />Primero crea, luego revisa, y al final publica.</li>
                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/70" />Si dudas, guarda borrador (no avisa al rider).</li>
                                        <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/70" />Si cambias algo ya publicado, avisa al rider.</li>
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
                                                className={cn(
                                                    'w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between border',
                                                    isActive
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                        : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-white/10 hover:bg-white hover:dark:bg-white/10'
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        'w-8 h-8 rounded-lg flex items-center justify-center',
                                                        isActive ? 'bg-white/10' : 'bg-slate-100 dark:bg-white/5'
                                                    )}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black tracking-tight">{s.title}</div>
                                                        <div className={cn(
                                                            'text-[10px] font-bold uppercase tracking-widest',
                                                            isActive ? 'text-white/70' : 'text-slate-400'
                                                        )}>
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
                            <div className="lg:hidden mb-4">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {sections.map((s) => {
                                        const Icon = s.icon;
                                        const isActive = activeSection === s.key;
                                        return (
                                            <button
                                                key={s.key}
                                                onClick={() => scrollTo(s.key)}
                                                className={cn(
                                                    'shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black',
                                                    isActive
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-white/10'
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {s.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="max-w-3xl mx-auto space-y-10">
                                <div ref={refInicio} className="scroll-mt-6">
                                    <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Inicio rápido</p>
                                            <h3 className="text-xl font-black tracking-tight mt-1">Haz una semana en 2 minutos</h3>
                                            <p className="text-sm text-white/80 mt-2 leading-relaxed">
                                                Crea turnos, muévelos si hace falta y publica cuando lo tengas claro.
                                            </p>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="rounded-xl p-4 border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                    <Plus className="w-4 h-4 text-indigo-500" />
                                                    <p className="text-xs font-black uppercase tracking-widest">Paso 1</p>
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Crea</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pon los turnos base (mañana / mediodía / noche).</p>
                                            </div>
                                            <div className="rounded-xl p-4 border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                    <Copy className="w-4 h-4 text-violet-500" />
                                                    <p className="text-xs font-black uppercase tracking-widest">Paso 2</p>
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Ajusta</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mueve, copia o cambia riders sin miedo.</p>
                                            </div>
                                            <div className="rounded-xl p-4 border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                    <Send className="w-4 h-4 text-emerald-500" />
                                                    <p className="text-xs font-black uppercase tracking-widest">Final</p>
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Publica</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">El rider lo verá y recibirá aviso.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div ref={refCrear} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Crear turnos</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Lo básico para empezar bien.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                                            <li className="flex gap-3">
                                                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-200">1</span>
                                                <span>Elige el día y crea el turno con la franja horaria que toca.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-200">2</span>
                                                <span>Asigna un rider. Si no lo tienes claro, déjalo en borrador y decide luego.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-200">3</span>
                                                <span>Revisa que no se solapen turnos del mismo rider.</span>
                                            </li>
                                        </ol>
                                    </div>
                                </div>

                                <div ref={refMover} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">
                                            <Copy className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Mover / copiar</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Para ajustar rápido sin rehacer todo.</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Mover</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">Arrastra el turno al hueco correcto</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                Si el rider ya tiene turno a esa hora, te avisará para evitar errores.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Copiar</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">Duplica un turno para repetir patrón</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                Ideal para hacer semanas “tipo” sin perder tiempo.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div ref={refPublicar} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                                            <Send className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Publicar (avisar al rider)</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Lo que cambia al publicar.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Idea simple</p>
                                                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mt-1">
                                                    Borrador = solo lo ves tú. Publicado = lo ve el rider y recibe aviso.
                                                </p>
                                                <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-2">
                                                    Si cambias un turno ya publicado, el rider puede recibir un aviso de cambio. Hazlo solo si hace falta.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div ref={refColores} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Qué significan los colores</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Para entenderlo de un vistazo.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-6 rounded bg-emerald-500 border border-emerald-600 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">Verde</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Normal / bien asignado.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-6 rounded bg-amber-400 border border-amber-500 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">Ámbar</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Revisar con calma (suele ser aviso).</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-6 rounded bg-rose-500 border border-rose-600 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">Rojo</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Problema: algo no cuadra. No lo ignores.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div ref={refProblemas} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Problemas típicos</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Los que más se repiten.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        {[
                                            {
                                                title: 'Se solapan turnos del mismo rider',
                                                desc: 'Solución: mueve uno de los turnos o cambia el rider.'
                                            },
                                            {
                                                title: 'He publicado y ahora tengo que cambiarlo',
                                                desc: 'Haz el cambio, pero intenta avisar al rider para evitar líos.'
                                            },
                                            {
                                                title: 'No sé si está bien',
                                                desc: 'Guarda borrador, revisa y publica cuando lo veas claro.'
                                            }
                                        ].map((x) => (
                                            <div key={x.title} className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{x.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{x.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div ref={refAtajos} className="scroll-mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                                            <Keyboard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Atajos</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Para ir más rápido (opcional).</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { k: 'Esc', v: 'Cerrar esta guía / cancelar' },
                                            { k: 'Supr', v: 'Borrar selección (si aplica)' }
                                        ].map((x) => (
                                            <div key={x.k} className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center justify-between gap-4">
                                                <kbd className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-black text-slate-700 dark:text-slate-200">
                                                    {x.k}
                                                </kbd>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 text-right">{x.v}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-200">
                                            <HelpCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white">Consejo</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Si el equipo es nuevo, publica con tiempo. Evitas mensajes de última hora.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                <HelpCircle className="w-4 h-4 text-indigo-500" />
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
