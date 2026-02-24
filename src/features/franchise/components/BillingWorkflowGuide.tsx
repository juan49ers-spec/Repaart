import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    FileText,
    Lock,
    CheckCircle,
    X,
    Clock,
    ShieldAlert,
    Wallet,
    Sparkles,
    HelpCircle,
    ArrowRight,
    ExternalLink
} from 'lucide-react';

interface BillingWorkflowGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate?: (tabKey: string) => void;
}

const BillingWorkflowGuide: React.FC<BillingWorkflowGuideProps> = ({ isOpen, onClose, onNavigate }) => {
    const [activeSection, setActiveSection] = useState<
        'arquitectura' | 'facturacion' | 'cierre' | 'taxvault' | 'reglas'
    >('arquitectura');

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const arquitecturaRef = useRef<HTMLDivElement | null>(null);
    const facturacionRef = useRef<HTMLDivElement | null>(null);
    const cierreRef = useRef<HTMLDivElement | null>(null);
    const taxvaultRef = useRef<HTMLDivElement | null>(null);
    const reglasRef = useRef<HTMLDivElement | null>(null);

    const sections = useMemo(() => {
        return [
            { key: 'arquitectura' as const, title: 'Flujo de Trabajo', icon: Sparkles, badge: 'Info' },
            { key: 'facturacion' as const, title: 'Estados Legales', icon: Lock, badge: 'Normativa' },
            { key: 'cierre' as const, title: 'Proceso de Cierre', icon: CheckCircle, badge: 'Guía' },
            { key: 'taxvault' as const, title: 'Control Fiscal', icon: Wallet, badge: 'Impuestos' },
            { key: 'reglas' as const, title: 'Reglas del Sistema', icon: ShieldAlert, badge: 'Validación' }
        ];
    }, []);

    // Intersection Observer para resaltar sección activa al hacer scroll
    useEffect(() => {
        if (!isOpen) return;

        const observerOptions = {
            root: scrollRef.current,
            threshold: 0.5,
            rootMargin: '0px'
        };

        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    if (id) {
                        setActiveSection(id as 'arquitectura' | 'facturacion' | 'cierre' | 'taxvault' | 'reglas');
                    }
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);

        const refs = [
            arquitecturaRef.current,
            facturacionRef.current,
            cierreRef.current,
            taxvaultRef.current,
            reglasRef.current
        ];

        refs.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [isOpen]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const scrollTo = (key: 'arquitectura' | 'facturacion' | 'cierre' | 'taxvault' | 'reglas') => {
        const refMap = {
            arquitectura: arquitecturaRef,
            facturacion: facturacionRef,
            cierre: cierreRef,
            taxvault: taxvaultRef,
            reglas: reglasRef
        };
        refMap[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="relative z-[100]">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Guía de Facturación e Inteligencia"
                    className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-300"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    Guía de Facturación e Inteligencia
                                    <span className="text-[10px] font-bold text-indigo-600 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100">Premium</span>
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                    Instrucciones avanzadas para la gestión mensual
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Cerrar Guía"
                            className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 flex bg-white">
                        {/* Sidebar */}
                        <div className="w-[220px] hidden lg:flex flex-col border-r border-slate-100 p-4 gap-6 bg-slate-50/50">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Navegación</h3>
                                <div className="flex flex-col gap-1">
                                    {sections.map((s) => {
                                        const Icon = s.icon;
                                        const isActive = activeSection === s.key;
                                        return (
                                            <button
                                                key={s.key}
                                                onClick={() => scrollTo(s.key)}
                                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                                    : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                            >
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                                <span className="text-[11px] font-bold">{s.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-auto p-4 rounded-xl bg-amber-50 border border-amber-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Aviso Legal</span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                    Las facturas emitidas son inalterables por normativa Europea.
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-white">
                            <div className="max-w-2xl mx-auto p-8 space-y-12 pb-24">

                                {/* Section 1: Arquitectura */}
                                <section id="arquitectura" ref={arquitecturaRef} className="scroll-mt-6">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="text-indigo-600 w-5 h-5" />
                                            1. Resumen del Flujo Operativo
                                        </div>
                                        {onNavigate && (
                                            <button
                                                onClick={() => onNavigate('customers')}
                                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
                                            >
                                                Ver Clientes <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        )}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                        Gestiona la transformación de la actividad operativa en documentos fiscales de forma automatizada.
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { t: 'Actividad Real', d: 'Recopilación de pedidos entregados por la flota.', i: Clock, c: 'text-indigo-600' },
                                            { t: 'Emisión de Facturas', d: 'Generación de documentos legales para el cobro.', i: FileText, c: 'text-violet-600' },
                                            { t: 'Provisión de Impuestos', d: 'Cálculo automático de IVA en tiempo real.', i: Wallet, c: 'text-emerald-600' }
                                        ].map((item, id) => (
                                            <div key={id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                                                <div className={`w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center stroke-2 ${item.c}`}>
                                                    <item.i className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{item.t}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{item.d}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Section 2: Facturación Inmutable */}
                                <section id="facturacion" ref={facturacionRef} className="scroll-mt-6">
                                    <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Lock className="w-20 h-20" />
                                        </div>
                                        <div className="flex items-center justify-between relative z-10 mb-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Lock className="w-5 h-5 text-indigo-400" />
                                                Estados de Facturación
                                            </h3>
                                            {onNavigate && (
                                                <button
                                                    onClick={() => onNavigate('invoices')}
                                                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-bold flex items-center gap-2 transition-colors uppercase tracking-wider"
                                                >
                                                    Gestor de Facturas <ExternalLink className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-4 relative z-10">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Borrador (Draft)</p>
                                                <p className="text-xs text-slate-400">Estado provisional. Permite edición, eliminación absoluta y cambios de importe sin registro legal.</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                                                <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">Emitida (Issued)</p>
                                                <p className="text-xs text-slate-300">Documento consolidado. Tiene número de serie y es inalterable por normativa fiscal.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 3: Paso a Paso */}
                                <section id="cierre" ref={cierreRef} className="scroll-mt-6">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                                        Gestión de Cierre Mensual
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
                                            {[
                                                { t: '1. Consolidación de Actividad', d: 'El motor reconstruye los pedidos entregados para su facturación logística.', i: 1 },
                                                { t: '2. Conciliación Operativa', d: 'Detección de discrepancias en kilómetros mediante alertas visuales (badges).', i: 2 },
                                                { t: '3. Bloqueo de Periodo', d: 'Sellado del mes para garantizar la integridad histórica ante auditorías.', i: 3 }
                                            ].map((step, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                                                        {step.i}
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-800">{step.t}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.d}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Checklist Visual */}
                                    <div className="mt-8 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/20">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3" /> Checklist de Cierre
                                        </p>
                                        <div className="space-y-2">
                                            {[
                                                '¿Todas las facturas del mes están en estado EMITIDA?',
                                                '¿Has resuelto todas las discrepancias de kilómetros?',
                                                '¿Se ha verificado el Tax Vault contra el IVA repercutido?'
                                            ].map((item, id) => (
                                                <label key={id} className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <span className="text-xs text-slate-600 font-medium">{item}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Section 4: Tax Vault */}
                                <section id="taxvault" ref={taxvaultRef} className="scroll-mt-6">
                                    <div className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                                    <Wallet className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-tight">Tax Vault (Reserva Fiscal)</h3>
                                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Monitorización Tributaria</p>
                                                </div>
                                            </div>
                                            {onNavigate && (
                                                <button
                                                    onClick={() => onNavigate('invoices')}
                                                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group"
                                                >
                                                    Abrir Vault <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-emerald-900/70 leading-relaxed mb-4">
                                            Cálculo y reserva automática de IVA devengado de tus ventas para evitar desequilibrios de tesorería.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-3 rounded-xl border border-emerald-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">IVA Repercutido</p>
                                                <p className="text-xs font-bold text-slate-800">Cálculo al 21%</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-emerald-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">IVA Soportado</p>
                                                <p className="text-xs font-bold text-slate-800">Gastos deducibles</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 5: Reglas de Oro */}
                                <section id="reglas" ref={reglasRef} className="scroll-mt-6">
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                                            Reglas del Sistema
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                'Emitir las facturas antes de finalizar el ciclo mensual.',
                                                'El sistema prioriza el motor de reconstrucción automática.',
                                                'Badges naranjas: Indican discrepancias en datos de kilómetros.',
                                                'El sellado de periodo es obligatorio para la seguridad jurídica.'
                                            ].map((regla, idx) => (
                                                <div key={idx} className="flex gap-3 items-start">
                                                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs text-amber-800/80 font-medium leading-relaxed">{regla}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* FAQ / Help */}
                                <div className="text-center py-8">
                                    <p className="text-xs text-slate-400 mb-4">¿Necesitas ayuda técnica?</p>
                                    <button className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">
                                        <HelpCircle className="w-4 h-4" />
                                        Asesoría Inteligente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Módulos Sincronizados</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            ¡Todo claro!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingWorkflowGuide;
