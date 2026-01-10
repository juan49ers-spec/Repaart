import React, { useState } from 'react';
import { X, HelpCircle, TrendingUp, DollarSign, PiggyBank, Clock, Target, ChevronRight, Info, CheckCircle } from 'lucide-react';

interface WidgetLegendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface LegendItem {
    term: string;
    definition: string;
    example?: string;
    delivery?: string;
}

interface LegendSection {
    title: string;
    icon: React.ReactNode;
    color: 'indigo' | 'blue' | 'emerald' | 'purple' | 'amber';
    intro: string;
    sections?: { title: string; content: string }[];
    items?: LegendItem[];
    decisions?: string[];
}

const WidgetLegendModal: React.FC<WidgetLegendModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'ingresos' | 'bolsillo' | 'hucha' | 'coste' | 'guia' | 'objetivos'>('guia');

    if (!isOpen) return null;

    const legendContent: Record<string, LegendSection> = {
        guia: {
            title: 'Cómo Leer Tu Dashboard',
            icon: <Info className="w-6 h-6" />,
            color: 'indigo',
            intro: 'Tu dashboard es como el panel de control de tu moto de reparto: te dice todo lo que necesitas saber para tomar buenas decisiones.',
            sections: [
                {
                    title: '🎯 1. Empieza por los Números Grandes',
                    content: 'Los 4 widgets principales (Ingresos, Bolsillo, Hucha, Coste/Hora) son tus indicadores clave. Si alguno está en rojo o naranja, presta atención ahí primero.'
                },
                {
                    title: '📊 2. Compara con el Mes Pasado',
                    content: 'La flecha verde ↑ o roja ↓ te dice si vas mejor o peor que el mes anterior. No te alarmes por un mes malo: lo importante es la tendencia de varios meses.'
                },
                {
                    title: '💡 3. Usa los Objetivos como Guía',
                    content: 'El panel de "Objetivos del Mes" te marca metas realistas. Si estás en Bronce o Plata a mitad de mes, puedes recuperar. Si llegas a Oro/Platino, ¡vas genial!'
                },
                {
                    title: '⚠️ 4. Actúa Rápido en Alertas',
                    content: 'Si ves "⚠️ Alerta: Caída significativa" en Ingresos, significa que has bajado >20%. Revisa: ¿menos pedidos? ¿competencia? ¿clima? ¿problemas con riders?'
                },
                {
                    title: '📈 5. Proyecciones = Tu Futuro',
                    content: 'Las proyecciones te dicen cómo vas a terminar el mes si sigues así. Si la proyección dice "2.800€" pero necesitas 3.500€, ajusta ahora: más horas, más marketing, menos gastos.'
                }
            ]
        },
        ingresos: {
            title: 'KPI: Ingresos',
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'blue',
            intro: 'Tus ingresos son el dinero total que entra por pedidos completados. Es tu "facturación bruta".',
            items: [
                {
                    term: 'Valor Principal',
                    definition: 'Suma de TODOS los pedidos completados y pagados este mes.',
                    example: '3.360€ (280 pedidos × 12€ promedio)',
                    delivery: '💡 Si baja: Menos pedidos (¿clima malo? ¿competencia?), ticket promedio bajo (¿falta de combos?), horarios mal ajustados (¿riders sin trabajo en prime time?).'
                },
                {
                    term: 'Tendencia %',
                    definition: 'Comparación vs mes anterior. Verde = crecimiento, Rojo = descenso.',
                    example: '+12.5% vs mes anterior',
                    delivery: '💡 Ejemplo delivery: Si febrero sube +15% vs enero, puede ser por San Valentín (más pedidos). Si baja -20%, revisa si perdiste riders clave o hubo problemas técnicos.'
                },
                {
                    term: 'YoY (Year over Year)',
                    definition: 'Comparación con el MISMO mes del año pasado. Mide crecimiento real descontando estacionalidad.',
                    example: '+15.2% vs hace 1 año',
                    delivery: '💡 Si enero 2026 vs enero 2025 es +20%, vas bien. Si es -10%, la competencia te está ganando terreno.'
                },
                {
                    term: 'Proyección',
                    definition: 'Estimación de cómo terminarás el mes si sigues a este ritmo.',
                    example: 'Va a terminar en: 3.780€',
                    delivery: '💡 A día 15 llevas 1.680€ → Proyección: 3.360€. Si necesitas 4.000€, debes acelerar: más horario prime, campañas, descuentos.'
                },
                {
                    term: 'Objetivo Mensual',
                    definition: 'Meta que definiste. La barra muestra progreso.',
                    example: '85% del objetivo (falta 15%)',
                    delivery: '💡 Si llegas solo al 70% del objetivo, ajusta expectativas o estrategia para el próximo mes.'
                }
            ],
            decisions: [
                '✅ Si sube: Repite lo que funcionó (¿más riders? ¿mejor zona? ¿nuevos menús?).',
                '⚠️ Si baja <10%: Normal, monitorea.',
                '❌ Si baja >20%: URGENTE - Revisa competencia, calidad, riders disponibles, tecnología.'
            ]
        },
        bolsillo: {
            title: 'Tu Bolsillo (Beneficio Neto)',
            icon: <DollarSign className="w-6 h-6" />,
            color: 'emerald',
            intro: 'Este es el dinero REAL que te llevas a casa después de pagar TODO (riders, cocina, impuestos, plataformas).',
            items: [
                {
                    term: 'Beneficio Neto',
                    definition: 'Ingresos MENOS todos los gastos e impuestos. Tu sueldo real.',
                    example: '2.730€',
                    delivery: '💡 Si ganas 3.360€ pero gastas 630€, te quedan 2.730€. Eso es ~2.730€/30días = 91€/día netos.'
                },
                {
                    term: 'Semáforo de Salud',
                    definition: '🟢 Excelente (≥20%), 🟡 Estable (12-20%), 🔴 Peligro (<8%). Es tu "margen de beneficio".',
                    example: '🟢 Excelente (23.4% margen)',
                    delivery: '💡 Si estás en 🔴 con 7% margen, significa que de cada 100€ que facturas, solo 7€ son tuyos. Urgente: reduce riders ociosos, negocia con proveedores, sube precios.'
                },
                {
                    term: 'Desglose Detallado',
                    definition: 'Click para ver dónde va cada euro: Riders, Cocina, Marketing, Plataformas...',
                    example: 'Ver categorías',
                    delivery: '💡 Si "Riders" es 60% de gastos pero Ingresos no crecen, tienes sobrecapacidad. Si "Marketing" es 25%, estás gastando mucho en adquisición.'
                },
                {
                    term: 'Proyección Anual',
                    definition: 'Beneficio mensual × 12. Tu "sueldo anual" si el mes se repite.',
                    example: '32.760€/año (2.730€ × 12)',
                    delivery: '💡 ¿Te basta con 32k al año? Si no, necesitas crecer Ingresos o cortar Gastos.'
                }
            ],
            decisions: [
                '✅ Margen >20%: Operación saludable, puedes reinvertir.',
                '⚠️ Margen 12-20%: Estable pero ajustado, cuidado con gastos extra.',
                '❌ Margen <12%: CRÍTICO - Revisa TODOS los gastos, especialmente riders en horas muertas.'
            ]
        },
        hucha: {
            title: 'La Hucha (Reserva Fiscal)',
            icon: <PiggyBank className="w-6 h-6" />,
            color: 'purple',
            intro: 'Dinero que DEBES guardar para Hacienda. NO es tuyo, ¡no lo toques para gastos!',
            items: [
                {
                    term: 'Reserva Total',
                    definition: 'IVA que cobraste + IRPF que debes. Guárdalo en cuenta separada.',
                    example: '1.200€ (840€ IVA + 360€  IRPF)',
                    delivery: '💡 Regla delivery: Guarda el 25% de cada ingreso. Si cobras 100€, separa 25€ inmediatamente a la "cuenta de impuestos".'
                },
                {
                    term: 'Próximo Pago IVA',
                    definition: 'Trimestral: Abril, Julio, Octubre, Enero. Día 20 del mes siguiente.',
                    example: '20 Abr 2026 (45 días)',
                    delivery: '💡 Si estás a 15 días del pago y no tienes el dinero guardado, PÁNICO. Empieza a juntar YA o pide facilidades a Hacienda.'
                },
                {
                    term: 'Próximo Pago IRPF',
                    definition: 'Declaración anual en junio. Pagas según beneficios del año.',
                    example: '30 Jun 2026',
                    delivery: '💡 Si tuviste un año muy bueno, el IRPF puede ser sorpresa desagradable. Guarda mínimo 20% de beneficios netos.'
                }
            ],
            decisions: [
                '✅ Reserva ≥ Próximo pago: Tranquilo, tienes cubierto.',
                '⚠️ Reserva < Próximo pago: Junta dinero urgente o reduce gastos personales.',
                '❌ Reserva casi vacía a 30 días del pago: Crisis. Habla con gestor fiscal, pide fraccionamiento.'
            ]
        },
        coste: {
            title: 'Coste Operativo por Hora',
            icon: <Clock className="w-6 h-6" />,
            color: 'amber',
            intro: 'Cuánto te cuesta cada hora que está abierto tu negocio. Si es muy alto, estás quemando dinero.',
            items: [
                {
                    term: 'Coste/Hora',
                    definition: 'Gastos totales ÷ Horas abiertas. Mide eficiencia.',
                    example: '22.50€/h',
                    delivery: '💡 Si abres 10h/día × 30 días = 300h/mes. Si gastas 6.750€, coste = 22.50€/h. Cada hora que estás abierto "quema" 22.50€.'
                },
                {
                    term: 'Benchmark Industria',
                    definition: 'Rango normal para delivery/reparto: 15-25€/h. Ideal: ~20€/h.',
                    example: 'Estás en 22.50€/h = Normal',
                    delivery: '💡 Si estás en 30€/h, tienes riders de más o alquiler carísimo. Si estás en 12€/h, puede que pagues mal (¡problemas futuros!).'
                },
                {
                    term: 'vs Ideal (20€/h)',
                    definition: 'Diferencia contra el benchmark. Positivo = más caro.',
                    example: '+2.50€/h vs ideal',
                    delivery: '💡 Si estás 5€ por encima del ideal, multiplica: 5€ × 300h = 1.500€/mes  perdidos en ineficiencia.'
                },
                {
                    term: 'Desglose: Personal vs Otros',
                    definition: 'Cuánto va a riders/cocina vs alquiler/marketing/etc.',
                    example: '60% Personal, 40% Otros',
                    delivery: '💡 Si Personal es 70%, tienes sobrecapacidad de riders. Si Otros es 50%, revisa alquiler, motos, plataformas.'
                }
            ],
            decisions: [
                '✅ 15-20€/h: Óptimo, sigue así.',
                '⚠️ 20-25€/h: Aceptable pero mejorable. Busca eficiencias pequeñas.',
                '❌ >25€/h: URGENTE - Reduce riders en horas muertas, negocia alquiler, cambia de zona.'
            ]
        },
        objetivos: {
            title: 'Objetivos Mensuales',
            icon: <Target className="w-6 h-6" />,
            color: 'indigo',
            intro: 'Sistema de retos gamificado para maximizar el rendimiento operativo de la franquicia.',
            items: [
                {
                    term: 'Nivel de Misión (XP)',
                    definition: 'Tu rango general (C, B, A, S) basado en el cumplimiento de los 4 retos clave.',
                    example: 'Nivel A (75% completado)',
                    delivery: '💡 Para subir a Nivel S, necesitas que la barra de "Progreso Total" llegue al 100%. Enfócate en el objetivo más bajo.'
                },
                {
                    term: 'Estatus del Reto',
                    definition: 'Muestra qué porcentaje de la meta has alcanzado hoy.',
                    example: 'Ventas: ¡LOGRADO! (102%)',
                    delivery: '💡 Si un reto dice "Falta 15%" a falta de 3 días para cerrar mes, lanza una promoción flash para cerrar la brecha.'
                },
                {
                    term: 'Salón de la Fama',
                    definition: 'Medallas exclusivas por superar expectativas (logros platino).',
                    example: 'Medalla "Superventas" (Ventas >110%)',
                    delivery: '💡 Los logros no son solo visuales: indican que estás operando por encima de la media del mercado.'
                }
            ],
            decisions: [
                '✅ Nivel S: Operación perfecta. Documenta qué hiciste para repetirlo.',
                '⚠️ Nivel B/C: Revisa el widget de "Coste/Hora" para ver si la ineficiencia viene de ahí.',
                '❌ Sin medallas: Estás cumpliendo lo mínimo. Considera incentivos para el equipo de cocina y riders.'
            ]
        }
    };

    const activeContent = legendContent[activeTab];
    const colorMap: Record<'indigo' | 'blue' | 'emerald' | 'purple' | 'amber', { bg: string, text: string, border: string }> = {
        indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900' },
        blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900' },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900' }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Guía del Dashboard</h2>
                            <p className="text-sm text-slate-500">Aprende a tomar decisiones con tus datos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        title="Cerrar Guía"
                        aria-label="Cerrar Guía"
                        className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 overflow-x-auto">
                    {(['guia', 'ingresos', 'bolsillo', 'hucha', 'coste', 'objetivos'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab
                                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {legendContent[tab].title}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Title */}
                    <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl border-2 ${colorMap[activeContent.color].border} ${colorMap[activeContent.color].bg}`}>
                        <div className={`${colorMap[activeContent.color].text}`}>
                            {activeContent.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{activeContent.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activeContent.intro}</p>
                        </div>
                    </div>

                    {/* Guía o Terms */}
                    {activeTab === 'guia' && activeContent.sections ? (
                        <div className="space-y-4">
                            {activeContent.sections.map((section, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{section.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{section.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Terms */}
                            <div className="space-y-4 mb-6">
                                {activeContent.items?.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <ChevronRight className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.term}</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                                                    {item.definition}
                                                </p>
                                                {item.example && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-2">
                                                        <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                                                            📊 {item.example}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.delivery && (
                                                    <div className="px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                                                        <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                                                            {item.delivery}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Decisions */}
                            {activeContent.decisions && (
                                <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800">
                                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Decisiones a Tomar
                                    </h4>
                                    <ul className="space-y-2">
                                        {activeContent.decisions.map((decision, idx) => (
                                            <li key={idx} className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed flex items-start gap-2">
                                                <span className="mt-0.5">{decision.startsWith('✅') ? '✅' : decision.startsWith('⚠️') ? '⚠️' : decision.startsWith('❌') ? '❌' : '🎯'}</span>
                                                <span>{decision.replace(/^[✅⚠️❌]\s*/, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WidgetLegendModal;
