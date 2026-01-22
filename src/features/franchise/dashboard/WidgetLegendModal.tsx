import React, { useState } from 'react';
import { X, ChevronRight, Info, BookOpen, Calculator, Zap, Wallet, Banknote, Landmark, Timer } from 'lucide-react';

interface WidgetLegendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SectionKey = 'intro' | 'ingresos' | 'bolsillo' | 'hucha' | 'coste';

interface LegendSection {
    title: string;
    icon: React.ReactNode;
    color: 'indigo' | 'blue' | 'emerald' | 'purple' | 'amber';
    intro: string;
    description: string;
    formula?: string;
    detailedExplanation: string;
    academicNote?: string;
    keyMetrics: { label: string; value: string; desc: string }[];
    strategicAdvice: string[];
    commonMistakes?: string[];
    practicalExample?: {
        scenario: string;
        result: string;
    };
}

const WidgetLegendModal: React.FC<WidgetLegendModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<SectionKey>('intro');

    if (!isOpen) return null;

    const sections: Record<SectionKey, LegendSection> = {
        intro: {
            title: 'Filosofía Financiera',
            icon: <BookOpen className="w-6 h-6" />,
            color: 'indigo',
            intro: 'Tu Dashboard no es una pantalla, es tu Director Financiero Virtual.',
            description: 'Bienvenido al sistema de inteligencia financiera Repaart. Aquí transformamos "datos aburridos" en superpoderes para tu toma de decisiones diaria.',
            detailedExplanation: 'Navegar sin mapa es suicida. Tu Dashboard está diseñado con una arquitectura de "Cascada de Valor": empieza arriba con la FACTURACIÓN (lo que entra), desciende filtrando IMPUESTOS y COSTES (lo que sale), y desemboca en TU BOLSILLO (lo que te quedas). Entender este flujo es la diferencia entre ser un "repartidor con empleados" o un "empresario logístico". Cada widget, botón y gráfico tiene una razón de ser para proteger tu rentabilidad.',
            academicNote: 'El 80% de las franquicias rentables revisan este panel 2 veces al día. La constancia visual entrena tu intuición comercial.',
            keyMetrics: [
                { label: 'FRECUENCIA', value: 'DIARIA', desc: 'Revisión ágil (3 mins).' },
                { label: 'ANÁLISIS', value: 'SEMANAL', desc: 'Profundidad financiera.' }
            ],
            strategicAdvice: [
                'La ignorancia financiera erosiona los márgenes operativos.',
                'Los números rojos son indicadores de corrección, no de fracaso.',
                'Audita cada métrica en profundidad semanalmente.'
            ],
            commonMistakes: [
                'Mirar el dashboard solo cuando hay problemas.',
                'Ignorar las alertas de "Coste por Hora" hasta final de mes.',
                'Creer que "vender más" arregla un modelo de costes roto.'
            ]
        },
        ingresos: {
            title: 'Ingresos Netos',
            icon: <Banknote className="w-6 h-6" />,
            color: 'blue',
            intro: 'El combustible del motor: Facturación Total Generada.',
            description: 'Todo euro que entra en la caja antes de enfrentarse a la realidad de los gastos.',
            formula: 'Ingresos = (Pedidos × Tarifa Base) + Incentivos + Bonus Calidad',
            detailedExplanation: 'Los Ingresos Netos son la "Top Line" de tu P&L. Es la suma total de valor generado, pero cuidado: es un "Vanity Metric". Validar Mercado no es validar Modelo de Negocio. Un crecimiento sano requiere que el aumento de ingresos no degrade proporcionalmente el margen operativo (EBITDA Latente). Mide aquí tu CAPACIDAD DE PRODUCCIÓN, no tu RIQUEZA.',
            practicalExample: {
                scenario: 'Récord de Facturación (+20%) pero el saldo bancario baja.',
                result: 'Síndrome de "Crecimiento Hinchado". Has aumentado costes ineficientes para conseguir esa venta extra.'
            },
            academicNote: 'El objetivo es el "Smart Growth": Escalar ingresos manteniendo el Coste Marginal decreciente.',
            keyMetrics: [
                { label: 'Producción', value: 'Bruto', desc: 'Volumen total de actividad.' },
                { label: 'Calidad', value: 'Ticket', desc: 'Valor medio por servicio realizado.' }
            ],
            strategicAdvice: [
                'Analiza los días "pico": ¿Qué hiciste diferente ese viernes?',
                'Si suben los ingresos pero no el beneficio, revisa el Coste por Hora.',
                'El "Ticket Medio" es tu chivato de eficiencia en ruta.'
            ],
            commonMistakes: [
                'Celebrar la facturación bruta como si fuera beneficio neto.',
                'No descontar mentalmente el IVA al ver esta cifra.',
                'Pensar que doblar facturación doblará beneficios (a veces dobla problemas).'
            ]
        },
        bolsillo: {
            title: 'En Tu Bolsillo',
            icon: <Wallet className="w-6 h-6" />,
            color: 'emerald',
            intro: 'La fórmula definitiva: ¿Por qué restamos "TÚ"?',
            description: 'El único número que importa. Es el Beneficio Empresarial Puro (después de pagarte a ti mismo).',
            formula: 'Bolsillo = Ingresos - (Riders + Gas + Seguros + Hucha + TÚ)',
            detailedExplanation: 'Concepto clave: FREE CASH FLOW (FCF). Esta métrica destila la eficiencia real de tu operación. A los ingresos restamos Costes Directos (COGS: Riders, Gas) y Provisiones (Hucha). Lo que queda es el Beneficio Operativo Neto disponible para el accionista (TÚ). Si este número es positivo, tu franquicia es un ACTIVO que genera dividendo. Si es negativo, es un PASIVO que consume capital.',
            practicalExample: {
                scenario: 'El banco muestra saldo positivo, pero "Tu Bolsillo" está en negativo.',
                result: 'Estás viviendo de "dinero prestado" (IVA/IRPF). Tu solvencia real está comprometida.'
            },
            academicNote: 'En finanzas corporativas, una empresa vale por su capacidad de generar Caja Libre, no por sus activos.',
            keyMetrics: [
                { label: 'Cash Flow', value: 'Neto', desc: 'Liquidez real generada.' },
                { label: 'Rentabilidad', value: '%', desc: 'Margen de beneficio sobre venta.' }
            ],
            strategicAdvice: [
                'Protege este número con tu vida: corta gastos superfluos.',
                'Un margen del 15-20% es el estándar de oro en logística.',
                'Si facturas mucho y te queda poco, tu estructura de costes está obesa.'
            ],
            commonMistakes: [
                'Confundir disponibilidad bancaria con solvencia.',
                'Olvidar asignarte un sueldo de gerente y vivir solo del "beneficio".',
                'No reinvertir parte del beneficio en mejorar la flota.'
            ]
        },
        hucha: {
            title: 'Hucha Fiscal',
            icon: <Landmark className="w-6 h-6" />,
            color: 'purple',
            intro: 'Sistema de Previsión de Tesorería Tributaria.',
            description: 'Fondo de Maniobra Intocable para obligaciones fiscales futuras.',
            formula: 'Hucha = (IVA Repercutido - IVA Soportado) + (Beneficio Bruto × 20%)',
            detailedExplanation: 'Concepto Vital: LIQUIDEZ no es SOLVENCIA. El dinero que entra por IVA no es ingreso, es DEUDA RETENIDA. El 20% de tu beneficio tampoco es tuyo hoy, es una provisión para el IRPF anual. La Hucha Fiscal calcula tu "Deuda Latente" en tiempo real. Si gastas este dinero, estás financiado tu vida personal con deuda a la Administración. El ciclo se divide en Acumulación (Mes 1-3) y Liquidación (Mes 4).',
            practicalExample: {
                scenario: '"Tengo 4.000€ en banco, soy rico". La Hucha marca 1.500€.',
                result: 'Realidad: Tienes 2.500€ de Cash Flow libre. Los otros 1.500€ son un pasivo corriente exigible a corto plazo.'
            },
            academicNote: 'El 90% de los cierres de primer año son por falta de previsión de tesorería para impuestos (Cash Flow Gap).',
            keyMetrics: [
                { label: 'IVA DEVEN', value: '303', desc: 'Diferencial IVA Cobrado/Pagado.' },
                { label: 'IRPF PROV', value: '130', desc: 'Pago fraccionado sobre Bº.' }
            ],
            strategicAdvice: [
                'Trata la "Hucha" como un coste operativo más, no como ahorro.',
                'En el mes de liquidación (Rayo), la prioridad absoluta es la solvencia fiscal.',
                'Segrega físicamente este capital en una sub-cuenta bancaria.'
            ],
            commonMistakes: [
                'Confundir Caja (Bank Balance) con Beneficio (Net Profit).',
                'No provisionar el IRPF mensual y sufrir en la declaración anual.',
                'Subestimar el impacto del IVA en flujos de caja negativos.'
            ]
        },
        coste: {
            title: 'Coste por Hora',
            icon: <Timer className="w-6 h-6" />,
            color: 'amber',
            intro: 'Ratio de Eficiencia Operativa (Unit Economics).',
            description: 'Coste estructural total dividido por horas productivas de servicio.',
            formula: '€/Hora = (Masa Salarial + Flota + Estructura) / Horas Totales',
            detailedExplanation: 'En delivery, el tiempo es el "inventario" que caduca al instante. El Coste por Hora audita la saturación de tu estructura. Un coste alto (>18€) indica "Overstaffing" o ineficiencia en cuadrantes (pagar por horas sin pedidos). Un coste bajo (<14€) puede indicar riesgo operativo por saturación. La excelencia está en el equilibrio dinámico.',
            practicalExample: {
                scenario: 'Coste/Hora dispara a 25€ (ROJO) un martes valle.',
                result: 'Diagnóstico: Sobredimensionamiento de flota. Acción: Ajuste de turnos para eliminar horas improductivas.'
            },
            academicNote: 'El "Idle Time" (Tiempo Muerto) es el mayor destructor de EBITDA en delivery.',
            keyMetrics: [
                { label: 'BENCHMARK', value: '15-16€', desc: 'Rango de excelencia sectorial.' },
                { label: 'RATIO SALARIAL', value: '< 40%', desc: 'Tope máximo de peso nómina.' }
            ],
            strategicAdvice: [
                'Si el coste > 18€, ejecuta una revisión inmediata de cuadrantes.',
                'La optimización de 1€/hora impacta directamente al Bottom Line (+500€/mes).',
                'Pre-visualiza el impacto marginal de cada contratación nueva.'
            ],
            commonMistakes: [
                'Mantener "Stock de Seguridad" de riders excesivo (Overstaffing).',
                'Desalinear la oferta de horas con la curva de demanda real.',
                'Ignorar costes pasivos de flota (Amortización/Seguros) en el cálculo.'
            ]
        }
    };

    const activeContent = sections[activeTab];
    const colorMap: Record<LegendSection['color'], { bg: string; text: string; light: string }> = {
        indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', light: 'bg-indigo-500' },
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', light: 'bg-blue-500' },
        emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', light: 'bg-emerald-500' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', light: 'bg-purple-500' },
        amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', light: 'bg-amber-500' }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-12 md:pt-24">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row max-h-[85vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Close Button - Compact */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-[110] p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Compact Sidebar */}
                <nav className="hidden md:flex w-16 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-100 dark:border-white/5 flex-col items-center py-4 gap-3 overflow-y-auto">
                    {(Object.entries(sections) as [SectionKey, LegendSection][]).map(([key, section]) => {
                        const isActive = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                title={section.title}
                                className={`p-3 rounded-xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-600'}`}
                            >
                                {React.isValidElement(section.icon) && React.cloneElement(section.icon as React.ReactElement<{ className?: string }>, {
                                    className: "w-5 h-5"
                                })}
                            </button>
                        );
                    })}
                </nav>

                {/* Main Content - Dense Grid */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900 relative">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Header: Compact */}
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className={`p-2 rounded-lg ${colorMap[activeContent.color].bg} ${colorMap[activeContent.color].text}`}>
                                {React.isValidElement(activeContent.icon) && React.cloneElement(activeContent.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {activeContent.title}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-1">
                                    {activeContent.intro}
                                </p>
                                <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                                    {activeContent.description}
                                </p>
                            </div>
                        </div>

                        {/* 2-Column Dense Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* LEFT COLUMN: Theory & Definition (7 cols) */}
                            <div className="md:col-span-7 space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Concepto</h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                                        {activeContent.detailedExplanation}
                                    </p>
                                </div>

                                {activeContent.formula && (
                                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                                            <Calculator className="w-3 h-3" /> Fórmula
                                        </h4>
                                        <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-500/10">
                                            {activeContent.formula}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'hucha' && (
                                    <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/10">
                                        <div className="flex items-center justify-between gap-1 relative py-2 px-1">
                                            <div className="absolute top-[20px] left-0 w-full h-[1px] bg-purple-200 dark:bg-purple-800/30 -z-0" />
                                            {[
                                                { t: 'Mes 1', icon: Landmark, sub: 'ACUMULA' },
                                                { t: 'Mes 2', icon: Landmark, sub: 'ACUMULA' },
                                                { t: 'Mes 3', icon: Landmark, sub: 'ACUMULA' },
                                                { t: 'Mes 4', icon: Zap, sub: 'PAGA', special: true }
                                            ].map((step, i) => (
                                                <div key={i} className="flex flex-col items-center gap-1 relative z-10 w-1/4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm transition-transform hover:scale-110 ${step.special ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/30' : 'bg-white border-purple-200 text-purple-600'}`}>
                                                        <step.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-center mt-1">
                                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{step.t}</p>
                                                        <p className={`text-[8px] font-bold uppercase tracking-wider ${step.special ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{step.sub}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeContent.practicalExample && (
                                    <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100/50 dark:border-indigo-500/10">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Ejemplo Real</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            <span className="italic">&quot;{activeContent.practicalExample?.scenario}&quot;</span>
                                            <br />
                                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">➔ {activeContent.practicalExample?.result}</span>
                                        </p>
                                    </div>
                                )}

                                {activeContent.academicNote && (
                                    <div className="flex gap-2 items-start py-2 border-t border-slate-100 dark:border-white/5 opacity-80">
                                        <Info className="w-3 h-3 text-slate-400 mt-0.5" />
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                            {activeContent.academicNote}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT COLUMN: Execution & Metrics (5 cols) */}
                            <div className="md:col-span-5 space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Métricas Clave</h4>
                                    <div className="space-y-2">
                                        {activeContent.keyMetrics.map((metric, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
                                                <span className="text-[10px] font-medium text-slate-500">{metric.label}</span>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorMap[activeContent.color].bg} ${colorMap[activeContent.color].text}`}>
                                                        {metric.value}
                                                    </span>
                                                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">{metric.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estrategia</h4>
                                    <ul className="space-y-2">
                                        {activeContent.strategicAdvice.slice(0, 3).map((advice, idx) => (
                                            <li key={idx} className="flex gap-2 items-start opacity-90 hover:opacity-100 transition-opacity">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {advice}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {activeContent.commonMistakes && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Errores Comunes</h4>
                                        <ul className="space-y-1.5">
                                            {activeContent.commonMistakes?.slice(0, 2).map((mistake, idx) => (
                                                <li key={idx} className="text-[10px] text-rose-600/80 dark:text-rose-400/80 leading-tight">
                                                    • {mistake}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interactive Footer Navigation */}
                        <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Página {(Object.keys(sections).indexOf(activeTab) + 1)} de {Object.keys(sections).length}
                            </p>
                            <button
                                onClick={() => {
                                    const keys = Object.keys(sections) as Array<keyof typeof sections>;
                                    const nextIdx = (keys.indexOf(activeTab) + 1) % keys.length;
                                    setActiveTab(keys[nextIdx]);
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

export default WidgetLegendModal;
