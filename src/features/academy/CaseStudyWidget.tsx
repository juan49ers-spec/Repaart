import React, { useState, useCallback } from 'react';
import { MessageCircle, CheckCircle, XCircle, ArrowRight, RotateCcw, Lightbulb } from 'lucide-react';

// Predefined case studies data
const CASE_STUDIES: Record<string, CaseStudy> = {
    customer_complaint: {
        id: 'customer_complaint',
        title: 'Gestión de Quejas',
        scenario: `Un cliente llama enfadado porque su pedido llegó 25 minutos tarde. El restaurante tardó más de lo esperado y el rider tuvo que esperar. El cliente exige una compensación y amenaza con dejar una reseña negativa.`,
        icon: '😤',
        options: [
            {
                id: 'a',
                text: 'Disculparse y ofrecer un 10% de descuento en el próximo pedido',
                isCorrect: false,
                feedback: 'Ofrecer descuentos sin investigar puede crear precedentes costosos y no resuelve el problema de raíz.',
            },
            {
                id: 'b',
                text: 'Explicar que la culpa fue del restaurante, no de nuestro servicio',
                isCorrect: false,
                feedback: 'Culpar a terceros daña la relación con todos los stakeholders y no resuelve la frustración del cliente.',
            },
            {
                id: 'c',
                text: 'Escuchar activamente, disculparse sinceramente, y ofrecer una solución proporcional tras revisar los hechos',
                isCorrect: true,
                feedback: '¡Correcto! La escucha activa valida al cliente. Revisar los hechos permite ofrecer compensaciones justas y detectar problemas sistémicos.',
            },
            {
                id: 'd',
                text: 'Ignorar la llamada y esperar que se calme',
                isCorrect: false,
                feedback: 'Ignorar quejas escala el conflicto y garantiza la reseña negativa.',
            },
        ],
        learningPoint: 'La gestión de quejas es una oportunidad de fidelización. El 70% de clientes que reciben una buena resolución vuelven a comprar.',
    },
    rider_conflict: {
        id: 'rider_conflict',
        title: 'Conflicto con Rider',
        scenario: `Un rider con buen historial llega 1 hora tarde a su turno por segunda vez este mes. Cuando le preguntas, te dice que tuvo problemas personales pero no da detalles. Otros riders están molestos por cubrir su trabajo.`,
        icon: '🏍️',
        options: [
            {
                id: 'a',
                text: 'Despedirlo inmediatamente para dar ejemplo al resto del equipo',
                isCorrect: false,
                feedback: 'Despedir sin proceso justo genera desconfianza en todo el equipo y pierdes la inversión en formación.',
            },
            {
                id: 'b',
                text: 'Tener una conversación privada, documentar la incidencia, y establecer un plan de mejora con consecuencias claras',
                isCorrect: true,
                feedback: '¡Correcto! La documentación protege legalmente, la conversación muestra empatía, y el plan de mejora da oportunidad de corrección.',
            },
            {
                id: 'c',
                text: 'Dejarlo pasar porque es buen rider y no quieres perderlo',
                isCorrect: false,
                feedback: 'La permisividad desmoraliza al equipo y establece un doble estándar que erosiona la disciplina.',
            },
            {
                id: 'd',
                text: 'Reducir sus turnos como castigo sin hablar con él',
                isCorrect: false,
                feedback: 'Castigos sin comunicación clara generan resentimiento y posibles problemas laborales.',
            },
        ],
        learningPoint: 'La gestión de personas requiere equilibrio entre empatía y firmeza. Documenta todo y sigue procesos consistentes.',
    },
    peak_hour_crisis: {
        id: 'peak_hour_crisis',
        title: 'Crisis en Hora Punta',
        scenario: `Es viernes a las 21:00. Tienes 15 pedidos pendientes, solo 3 riders activos (uno llamó enfermo hace 10 min), y los tiempos de entrega empiezan a pasar de 45 minutos. Los restaurantes empiezan a quejarse.`,
        icon: '🔥',
        options: [
            {
                id: 'a',
                text: 'Llamar a riders de backup y ofrecer bonus por terminar la cola',
                isCorrect: true,
                feedback: '¡Correcto! Los incentivos inmediatos activan recursos latentes. El coste del bonus es menor que el de perder clientes.',
            },
            {
                id: 'b',
                text: 'Pausar la aceptación de nuevos pedidos hasta resolver la cola actual',
                isCorrect: false,
                feedback: 'Pausar puede ser necesario en extremos, pero primero hay que activar recursos disponibles.',
            },
            {
                id: 'c',
                text: 'Esperar que los riders actuales trabajen más rápido',
                isCorrect: false,
                feedback: 'Esperar pasivamente escala el problema. Los riders sobrecargados cometen más errores.',
            },
            {
                id: 'd',
                text: 'Llamar a los restaurantes para cancelar pedidos',
                isCorrect: false,
                feedback: 'Cancelar daña la relación con restaurantes y clientes. Es la última opción.',
            },
        ],
        learningPoint: 'Tener una lista de riders de backup y un sistema de incentivos por emergencias es crítico para la resiliencia operativa.',
    },
    financial_decision: {
        id: 'financial_decision',
        title: 'Decisión Financiera',
        scenario: `Tienes 5.000€ de beneficio este mes. Tu gestor te recuerda que el IVA trimestral se paga en 15 días (aprox. 2.000€). Un proveedor te ofrece 2 motos nuevas con 40% de descuento si pagas hoy.`,
        icon: '💰',
        options: [
            {
                id: 'a',
                text: 'Comprar las motos inmediatamente antes de que expire la oferta',
                isCorrect: false,
                feedback: 'Comprometer el pago de impuestos por una "oferta" puede generar recargos, intereses y problemas con Hacienda.',
            },
            {
                id: 'b',
                text: 'Reservar el IVA, evaluar si realmente necesitas las motos, y negociar financiación',
                isCorrect: true,
                feedback: '¡Correcto! Primero asegura las obligaciones fiscales. Las "ofertas" suelen regresar. La disciplina fiscal es la base del negocio.',
            },
            {
                id: 'c',
                text: 'Pedir un préstamo rápido para cubrir ambos gastos',
                isCorrect: false,
                feedback: 'El endeudamiento para activos no urgentes y obligaciones fiscales es una espiral peligrosa.',
            },
            {
                id: 'd',
                text: 'Retrasar el pago del IVA y comprar las motos',
                isCorrect: false,
                feedback: 'Retrasar impuestos genera recargos del 5-20% y posibles sanciones. Nunca es rentable.',
            },
        ],
        learningPoint: 'El "dinero del banco no es tuyo". Separa siempre las provisiones fiscales antes de considerar cualquier inversión.',
    },
};

interface CaseOption {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
}

interface CaseStudy {
    id: string;
    title: string;
    scenario: string;
    icon: string;
    options: CaseOption[];
    learningPoint: string;
}

interface CaseStudyWidgetProps {
    caseId: string;
}

/**
 * CaseStudyWidget - Caso práctico interactivo tipo "elige tu aventura"
 * Presenta un escenario con múltiples opciones y feedback inmediato
 */
const CaseStudyWidget: React.FC<CaseStudyWidgetProps> = ({ caseId }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    const caseStudy = CASE_STUDIES[caseId];

    const handleSelect = useCallback((optionId: string) => {
        if (!isRevealed) {
            setSelectedOption(optionId);
        }
    }, [isRevealed]);

    const handleSubmit = useCallback(() => {
        if (selectedOption) {
            setIsRevealed(true);
        }
    }, [selectedOption]);

    const handleReset = useCallback(() => {
        setSelectedOption(null);
        setIsRevealed(false);
    }, []);

    if (!caseStudy) {
        return (
            <div className="my-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <p className="text-amber-800">Caso práctico no encontrado: {caseId}</p>
            </div>
        );
    }

    // Option state is determined directly in the render loop

    return (
        <div className="my-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{caseStudy.icon}</span>
                    <div>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Caso Práctico</p>
                        <h3 className="text-xl font-bold">{caseStudy.title}</h3>
                    </div>
                </div>
            </div>

            {/* Scenario */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 leading-relaxed">{caseStudy.scenario}</p>
                </div>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">¿Qué harías?</p>

                {caseStudy.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const showResult = isRevealed && isSelected;

                    let optionClasses = 'w-full p-4 rounded-xl border-2 text-left transition-all ';

                    if (isRevealed) {
                        if (isSelected && option.isCorrect) {
                            optionClasses += 'border-emerald-500 bg-emerald-50';
                        } else if (isSelected && !option.isCorrect) {
                            optionClasses += 'border-rose-500 bg-rose-50';
                        } else if (option.isCorrect) {
                            optionClasses += 'border-emerald-300 bg-emerald-50/50';
                        } else {
                            optionClasses += 'border-slate-200 bg-slate-50 opacity-50';
                        }
                    } else {
                        if (isSelected) {
                            optionClasses += 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10';
                        } else {
                            optionClasses += 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer';
                        }
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSelect(option.id)}
                            disabled={isRevealed}
                            className={optionClasses}
                        >
                            <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                                    {option.id.toUpperCase()}
                                </span>
                                <div className="flex-1">
                                    <p className="text-slate-800 font-medium">{option.text}</p>

                                    {/* Feedback */}
                                    {showResult && (
                                        <div className={`mt-3 p-3 rounded-lg ${option.isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {option.isCorrect ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-rose-600" />
                                                )}
                                                <span className={`text-xs font-bold uppercase ${option.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {option.isCorrect ? '¡Correcto!' : 'Incorrecto'}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${option.isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                                                {option.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Icons */}
                                {isRevealed && option.isCorrect && (
                                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                )}
                                {isRevealed && isSelected && !option.isCorrect && (
                                    <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6">
                {!isRevealed ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOption}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                    >
                        Confirmar respuesta
                        <ArrowRight className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="space-y-4">
                        {/* Learning Point */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Lección Clave</p>
                                    <p className="text-amber-900 text-sm leading-relaxed">{caseStudy.learningPoint}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleReset}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Intentar de nuevo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaseStudyWidget;
