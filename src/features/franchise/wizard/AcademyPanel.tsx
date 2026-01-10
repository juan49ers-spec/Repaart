import React from 'react';
import { Lightbulb, Info, TrendingUp, ShieldCheck, Target, Zap, BookOpen, AlertTriangle } from 'lucide-react';

interface AcademyPanelProps {
    phase: 'INTRO' | 'INCOME' | 'FIXED_COSTS' | 'VARIABLE_COSTS' | 'SERVICES' | 'MARKETING' | 'SUMMARY';
}

const AcademyPanel: React.FC<AcademyPanelProps> = ({ phase }) => {
    const content = getContentForPhase(phase);

    return (
        <div className="h-full bg-slate-50/50 border-l border-slate-200 p-8 flex flex-col relative overflow-hidden">
            {/* Contextual Gradient */}
            <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl ${content.gradient} opacity-5 ring-1 ring-inset ring-slate-900/5 pointer-events-none`} />

            {/* Icon & Title */}
            <div className="relative z-10 mb-8 animate-in slide-in-from-top-5 duration-500">
                <div className={`w-14 h-14 ${content.iconBg} rounded-2xl flex items-center justify-center mb-4 shadow-sm ring-1 ring-slate-900/5`}>
                    <content.icon className={`w-7 h-7 ${content.iconColor}`} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight tracking-tight">
                    {content.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">
                    {content.description}
                </p>
            </div>

            {/* Educational Modules */}
            <div className="relative z-10 space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">

                {/* 1. The Goal (Objetivo) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
                    <h4 className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-3">
                        <Target className="w-3.5 h-3.5" />
                        <span className="opacity-80">Objetivo Estratégico</span>
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {content.goal}
                    </p>
                </div>

                {/* 2. Keys of the Month (Claves) - Replaces Video */}
                {content.keys && (
                    <div className="bg-white/60 border border-slate-200 rounded-xl p-5">
                        <h4 className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-4">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="opacity-80">Claves del Mes</span>
                        </h4>
                        <ul className="space-y-3">
                            {content.keys.map((k, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${content.iconColor.replace('text-', 'bg-')}`} />
                                    <span className="text-xs text-slate-600 leading-snug font-medium">{k}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Pro Tip (Consejo) */}
                <div className={`rounded-xl p-5 border ${content.tipBorder} ${content.tipBg} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Lightbulb className="w-24 h-24" />
                    </div>
                    <h4 className={`flex items-center gap-2 ${content.tipColor} font-bold text-[10px] uppercase tracking-widest mb-3 relative z-10`}>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Consejo Experto</span>
                    </h4>
                    <p className={`${content.tipTextColor} text-sm leading-relaxed italic relative z-10 font-medium`}>
                        "{content.tip}"
                    </p>
                </div>

            </div>

            {/* Footer Quote */}
            <div className="relative z-10 mt-4 pt-6 border-t border-slate-800/50 flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        Academy AI
                    </p>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">v2.4</span>
            </div>
        </div>
    );
};

// --- CONTENT MAPPING ---

const getContentForPhase = (phase: string) => {
    switch (phase) {
        case 'INCOME':
            return {
                title: "Analizando Ingresos",
                description: "Más allá de la facturación total, buscamos la calidad de cada euro ingresado.",
                goal: "Distinguir entre volumen 'vacío' (muchos pedidos, poco margen) y volumen 'rentable'.",
                keys: [
                    "Revisa si tus horas de mayor facturación coinciden con tus horas de mayor coste de personal.",
                    "Un Ticket Medio bajo (<9€) te obliga a hacer muchos más pedidos para cubrir gastos fijos.",
                    "Identifica si hay franjas horarias donde facturas 0€ pero tienes riders conectados."
                ],
                tip: "La hora más cara es la que no produce. Si tienes riders parados más de 20 minutos, algo falla en la asignación o en la demanda.",
                icon: TrendingUp,
                iconColor: "text-emerald-600",
                iconBg: "bg-emerald-50",
                gradient: "from-emerald-50 via-white to-white",
                tipBg: "bg-emerald-50",
                tipBorder: "border-emerald-200",
                tipColor: "text-emerald-700",
                tipTextColor: "text-emerald-800"
            };
        case 'FIXED_COSTS':
            return {
                title: "La Estructura",
                description: "El esqueleto de tu negocio. Gastos que no duermen y que debes cubrir antes de ganar el primer euro.",
                goal: "Conocer tu 'Coste por Día'. ¿Cuánto te cuesta levantar la persiana cada mañana?",
                keys: [
                    "Nóminas: Asegúrate de incluir la Seguridad Social (aprox +33% sobre el bruto).",
                    "Alquiler de Motos: Calcula el coste por moto real, incluyendo las que están en taller.",
                    "Gestoría: A veces lo barato sale caro. Una buena asesoría te ahorra multas."
                ],
                tip: "Divide tus costes fijos entre 30. Ese es tu 'Número Mágico'. Si hoy has facturado menos que eso, has perdido dinero técnicamente.",
                icon: ShieldCheck,
                iconColor: "text-blue-600",
                iconBg: "bg-blue-50",
                gradient: "from-blue-50 via-white to-white",
                tipBg: "bg-blue-50",
                tipBorder: "border-blue-200",
                tipColor: "text-blue-700",
                tipTextColor: "text-blue-800"
            };
        case 'VARIABLE_COSTS':
            return {
                title: "Fugas de Dinero",
                description: "Gasolina, reparaciones y mermas. Aquí es donde se desangra la rentabilidad si no estás atento.",
                goal: "Detectar ineficiencias operativas. Un gasto variable alto suele indicar mala gestión del equipo o del material.",
                keys: [
                    "Gasolina: ¿Coincide el gasto con los kilómetros reales? Cuidado con el uso personal.",
                    "Reparaciones: Diferencia entre desgaste natural y mal uso. El 'mal trato' a la moto se paga caro.",
                    "Mermas: Comida que se tira es dinero que se quema."
                ],
                tip: "Reparar un retrovisor roto no es mantenimiento, es incidencia. Lleva un control de 'quién rompió qué' para generar responsabilidad en el equipo.",
                icon: AlertTriangle,
                iconColor: "text-amber-500",
                iconBg: "bg-amber-50",
                gradient: "from-amber-50 via-white to-white",
                tipBg: "bg-amber-50",
                tipBorder: "border-amber-200",
                tipColor: "text-amber-700",
                tipTextColor: "text-amber-800"
            };
        case 'SERVICES':
        case 'MARKETING':
            return {
                title: "Inversión y Retorno",
                description: "Gastar para crecer. Servicios externos que deben estar justificados por su aportación de valor.",
                goal: "Evaluar el ROI (Retorno de Inversión) de cada proveedor externo.",
                keys: [
                    "Publicidad: No gastes por gastar. Mide cuántos clientes nuevos trae cada campaña.",
                    "Software: ¿Usas todas las herramientas que pagas? Elimina suscripciones 'zombis'.",
                    "Seguros: Revisa las coberturas anualmente. El mercado cambia."
                ],
                tip: "En marketing, menos es más. Mejor una campaña bien segmentada de 50€ que un buzoneo masivo de 500€ que acaba en la basura.",
                icon: Lightbulb,
                iconColor: "text-purple-600",
                iconBg: "bg-purple-50",
                gradient: "from-purple-50 via-white to-white",
                tipBg: "bg-purple-50",
                tipBorder: "border-purple-200",
                tipColor: "text-purple-700",
                tipTextColor: "text-purple-800"
            };
        case 'SUMMARY':
            return {
                title: "Visión Global",
                description: "El mapa completo de tu mes. Aquí conectamos todos los puntos para ver la imagen real.",
                goal: "Entender no solo CUÁNTO has ganado, sino CÓMO y POR QUÉ.",
                keys: [
                    "Margen Operativo: ¿Te queda dinero después de pagar a todos (incluido a ti)?",
                    "Tendencia: ¿Estás mejor o peor que el mes pasado? Busca patrones.",
                    "Reserva: Idealmente, deberías guardar el 10% del beneficio para imprevistos."
                ],
                tip: "El beneficio contable no siempre es liquidez. Si has ganado 1.000€ pero has tenido que pagar 1.500€ de IVA atrasado, tu flujo de caja sufre. Planifica tu tesorería.",
                icon: Target,
                iconColor: "text-indigo-600",
                iconBg: "bg-indigo-50",
                gradient: "from-indigo-50 via-white to-white",
                tipBg: "bg-indigo-50",
                tipBorder: "border-indigo-200",
                tipColor: "text-indigo-700",
                tipTextColor: "text-indigo-800"
            };
        default: // INTRO
            return {
                title: "Asistente Financiero",
                description: "Tu copiloto para el cierre mensual. Olvida las hojas de cálculo complicadas.",
                goal: "Transformar datos en decisiones en menos de 5 minutos.",
                keys: [
                    "Prepara los datos antes de empezar (Nóminas, Facturas, Resúmenes).",
                    "Sé honesto con los números. El autoengaño financiero es el peor enemigo.",
                    "Dedica tiempo a leer los consejos de cada sección."
                ],
                tip: "Hacer el cierre mensual no es un trámite burocrático, es el momento más importante de gestión de tu negocio. Tómalo con calma y café.",
                icon: Info,
                iconColor: "text-slate-600",
                iconBg: "bg-slate-100",
                gradient: "from-slate-100 via-white to-white",
                tipBg: "bg-slate-50",
                tipBorder: "border-slate-200",
                tipColor: "text-slate-600",
                tipTextColor: "text-slate-700"
            };
    }
};

export default AcademyPanel;
