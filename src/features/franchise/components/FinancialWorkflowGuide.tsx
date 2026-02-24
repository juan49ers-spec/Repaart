import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Lock,
    CheckCircle,
    X,
    Clock,
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
    const [activeSection, setActiveSection] = useState<
        'inicio' | 'ingresos' | 'gastos' | 'cierre' | 'estados' | 'errores' | 'faq'
    >('inicio');
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const toggleItem = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const progress = useMemo(() => {
        const total = 4; // Number of critical checklist items
        const checked = Object.values(checkedItems).filter(Boolean).length;
        return Math.round((checked / total) * 100);
    }, [checkedItems]);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const inicioRef = useRef<HTMLDivElement | null>(null);
    const ingresosRef = useRef<HTMLDivElement | null>(null);
    const gastosRef = useRef<HTMLDivElement | null>(null);
    const cierreRef = useRef<HTMLDivElement | null>(null);
    const estadosRef = useRef<HTMLDivElement | null>(null);
    const erroresRef = useRef<HTMLDivElement | null>(null);
    const faqRef = useRef<HTMLDivElement | null>(null);

    const sections = useMemo(() => {
        return [
            { key: 'inicio' as const, title: 'Inicio rápido', icon: Sparkles, badge: '5 min' },
            { key: 'ingresos' as const, title: 'Ingresos', icon: Banknote, badge: 'Paso 1' },
            { key: 'gastos' as const, title: 'Gastos', icon: PieChart, badge: 'Paso 2' },
            { key: 'cierre' as const, title: 'Confirmación', icon: CheckCircle, badge: 'Checklist' },
            { key: 'estados' as const, title: 'Estados', icon: Lock, badge: 'Control' },
            { key: 'errores' as const, title: 'Errores comunes', icon: AlertTriangle, badge: 'Evita' },
            { key: 'faq' as const, title: 'Dudas frecuentes', icon: HelpCircle, badge: 'FAQ' }
        ];
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const scrollTo = (key: 'inicio' | 'ingresos' | 'gastos' | 'cierre' | 'estados' | 'errores' | 'faq') => {
        setActiveSection(key);
        const refMap = {
            inicio: inicioRef,
            ingresos: ingresosRef,
            gastos: gastosRef,
            cierre: cierreRef,
            estados: estadosRef,
            errores: erroresRef,
            faq: faqRef
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
                    aria-label="Guía de Gestión Financiera"
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
                                    Guía de Operaciones Financieras
                                    <span className="text-[10px] font-bold text-indigo-600 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100">v2.0</span>
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                    Protocolo de Cierre Mensual y Sincronización Fiscal
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
                        {/* Sidebar Navigation */}
                        <div className="w-[240px] hidden lg:flex flex-col border-r border-slate-100 p-4 gap-6 bg-slate-50/50">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Pasos Principales</h3>
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
                                                {isActive && <CheckCircle className="ml-auto w-3.5 h-3.5 opacity-60" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-auto p-4 rounded-xl bg-amber-50 border border-amber-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Nota Importante</span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                    El cierre del periodo fiscal es <span className="font-bold underline">permanente</span>. Verifica todos los datos antes de confirmar.
                                </p>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-white">
                            <div className="max-w-2xl mx-auto p-8 space-y-12 pb-24">

                                {/* Section: Inicio */}
                                <section ref={inicioRef} className="scroll-mt-6">
                                    <div className="relative p-6 rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Sparkles className="w-16 h-16 text-indigo-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Resumen de Operaciones</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                                            Sigue el protocolo de cierre mensual para asegurar la integridad de tus datos financieros y fiscales.
                                        </p>

                                        {/* Visual Stepper */}
                                        <div className="mt-8 grid grid-cols-4 gap-4 relative px-2">
                                            <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 z-0" />
                                            <motion.div
                                                className="absolute top-5 left-4 h-0.5 bg-indigo-500 z-0"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.7, ease: "easeOut" }}
                                            />
                                            {[
                                                { label: 'Revisión', icon: Clock, key: 'inicio' as const },
                                                { label: 'Ingresos', icon: Banknote, key: 'ingresos' as const },
                                                { label: 'Gastos', icon: PieChart, key: 'gastos' as const },
                                                { label: 'Cierre', icon: Lock, key: 'cierre' as const }
                                            ].map((item, idx) => {
                                                const isDone = progress >= ((idx + 1) / 4) * 100;
                                                const isActive = activeSection === item.key;
                                                return (
                                                    <button
                                                        key={item.key}
                                                        onClick={() => scrollTo(item.key)}
                                                        className="relative z-10 flex flex-col items-center gap-3 group/step"
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl border transition-all duration-500 flex items-center justify-center ${isDone ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' :
                                                            isActive ? 'bg-white border-indigo-600 text-indigo-600 shadow-xl shadow-indigo-50' :
                                                                'bg-white border-slate-200 text-slate-400'
                                                            }`}>
                                                            {isDone ? <CheckCircle size={16} strokeWidth={3} /> : <item.icon size={16} />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                {/* Section: Ingresos */}
                                <section ref={ingresosRef} className="scroll-mt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">01_Sincronización_de_Ingresos</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 transition-colors shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Protocolo</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Sincroniza los pedidos con el servidor. El indicador <span className="text-indigo-600 font-bold">&quot;Match&quot;</span> debe estar activo para asegurar que no falta ningún pedido por facturar.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-100 bg-indigo-50/30 hover:border-indigo-100 transition-colors shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Eficiencia</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Si detectas un margen neto <span className="text-indigo-600 font-bold">&lt; 15%</span>, te recomendamos analizar el ratio de eficiencia por rider en el panel de inteligencia.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Section: Gastos */}
                                <section ref={gastosRef} className="scroll-mt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">02_Validación_de_Gastos</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registro por Categorías</p>
                                                <Banknote className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                <div>
                                                    <p className="text-[11px] font-bold text-indigo-600 mb-2 uppercase">Costes Fijos</p>
                                                    <ul className="space-y-2 text-[10px] text-slate-500 font-bold">
                                                        <li className="flex gap-2 items-center"><span className="w-1 h-1 bg-indigo-400 rounded-full" />Salarios + SS</li>
                                                        <li className="flex gap-2 items-center"><span className="w-1 h-1 bg-indigo-400 rounded-full" />Renting Flota</li>
                                                        <li className="flex gap-2 items-center"><span className="w-1 h-1 bg-indigo-400 rounded-full" />Comisiones Repaart</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-900 mb-2 uppercase">Variables</p>
                                                    <ul className="space-y-2 text-[10px] text-slate-500 font-bold">
                                                        <li className="flex gap-2 items-center"><span className="w-1 h-1 bg-slate-300 rounded-full" />Combustible</li>
                                                        <li className="flex gap-2 items-center"><span className="w-1 h-1 bg-slate-300 rounded-full" />Mantenimiento</li>
                                                        <li className="flex gap-2 items-center"><span className="w-1 h-1 bg-slate-300 rounded-full" />Bonus Riders</li>
                                                    </ul>
                                                </div>
                                                <div className="sm:pl-6 sm:border-l border-slate-50">
                                                    <p className="text-[11px] font-bold text-emerald-600 mb-2 uppercase">Reserva Fiscal</p>
                                                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                                                        Se calcula automáticamente según tus facturas. Es recomendable reservar el 21% de los ingresos para el IVA.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section: Cierre Checklist */}
                                <section ref={cierreRef} className="scroll-mt-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Checklist de Verificación</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { id: 'sync', title: 'Sincronización', desc: 'Ingresos mensuales coinciden.', icon: Banknote },
                                            { id: 'taxes', title: 'Impuestos', desc: 'IVA/IRPF reservados en la hucha.', icon: Wallet },
                                            { id: 'fixed', title: 'Costes Fijos', desc: 'Todos los gastos registrados.', icon: ShieldAlert },
                                            { id: 'lock', title: 'Bloqueo Final', desc: 'Confirmación de estado inmutable.', icon: Lock }
                                        ].map((c) => {
                                            const Icon = c.icon;
                                            const isChecked = checkedItems[c.id];
                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => toggleItem(c.id)}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all group relative overflow-hidden ${isChecked
                                                        ? 'bg-indigo-50 border-indigo-600 shadow-md shadow-indigo-100/50'
                                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className={`w-8 h-8 rounded-lg border transition-colors flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'
                                                            }`}>
                                                            {isChecked ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-[11px] font-bold uppercase tracking-tight ${isChecked ? 'text-indigo-600' : 'text-slate-900'}`}>{c.title}</p>
                                                                {isChecked && <span className="text-[8px] font-bold bg-indigo-100 text-indigo-600 px-1 rounded uppercase">Listo</span>}
                                                            </div>
                                                            <p className={`text-[10px] font-medium mt-0.5 ${isChecked ? 'text-indigo-400' : 'text-slate-500'}`}>{c.desc}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Section: FAQ */}
                                <section ref={faqRef} className="scroll-mt-6">
                                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                                        <div className="flex items-center gap-2 mb-6">
                                            <HelpCircle className="w-4 h-4 text-slate-400" />
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dudas Frecuentes</h3>
                                        </div>
                                        <div className="space-y-6">
                                            {[
                                                { q: 'TIEMPO DE CIERRE', a: 'Debería realizarse antes del día 05 de cada mes.' },
                                                { q: 'REAPERTURA DEL MES', a: 'Si el mes está bloqueado, requiere una solicitud de desbloqueo a la administración.' },
                                                { q: 'IMPUESTOS', a: 'Las reservas en el Tax Vault son estimaciones basadas en tus registros directos.' }
                                            ].map((item, idx) => (
                                                <div key={idx} className="group">
                                                    <p className="text-[10px] font-bold text-indigo-600 mb-2 uppercase tracking-wide">¿{item.q}?</p>
                                                    <p className="text-xs font-medium text-slate-600 leading-relaxed border-l-2 border-indigo-100 pl-4">{item.a}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sistema Listo</span>
                            </div>
                            <div className="hidden sm:block h-3 w-px bg-slate-200" />
                            <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase">Sección: {activeSection}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                            >
                                Entendido
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                            >
                                Confirmar Protocolo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialWorkflowGuide;
