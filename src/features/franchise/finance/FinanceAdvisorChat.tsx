import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Send, Bot, User, Sparkles, TrendingUp, AlertCircle, AlertTriangle, Lightbulb, Target, TrendingDown, Calendar, DollarSign, ArrowRight, BarChart3, Zap, CheckCircle, MessageCircle, PlayCircle, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { sendMessageToGemini } from '../../../lib/gemini';

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    actions?: ActionItem[];
}

interface ActionItem {
    label: string;
    action: () => void;
    type: 'primary' | 'secondary';
}

interface FinanceAdvisorChatProps {
    financialData: {
        revenue: number;
        expenses: number;
        netProfit: number;
        orders: number;
        margin: number;
        month: string;
        breakdown?: Record<string, number>;
        metrics?: Record<string, number>;
        avgTicket?: number;
        costPerOrder?: number;
        historicalData?: Array<{
            revenue: number;
            margin: number;
            [key: string]: unknown;
        }>;
    };
    trendData?: Array<{
        revenue: number;
        margin: number;
        [key: string]: unknown;
    }>;
    month: string;
    isOpen?: boolean;
    onClose?: () => void;
    onOpenSimulator?: () => void;
}

interface Insight {
    type: 'positive' | 'warning' | 'critical' | 'info';
    title: string;
    description: string;
    metric?: string;
    trend?: number;
    question?: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(value || 0);
};

const FinanceAdvisorChat: React.FC<FinanceAdvisorChatProps> = ({
    financialData,
    trendData,
    month: _month,
    isOpen: externalIsOpen,
    onClose,
    onOpenSimulator
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnreadInsights, setHasUnreadInsights] = useState(true);
    const [activeTab, setActiveTab] = useState<'diagnosis' | 'chat'>('diagnosis');
    const [insights, setInsights] = useState<Insight[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── Insights generation ─────────────────────────────────
    const generateProactiveInsights = useCallback((
        data: {
            revenue: number;
            netProfit: number;
            margin: number;
            orders: number;
            avgTicket?: number;
        },
        trends: Array<{
            revenue: number;
            margin: number;
        }>
    ): Insight[] => {
        const newInsights: Insight[] = [];
        const margin = data.margin || 0;
        const profit = data.netProfit || 0;
        const revenue = data.revenue || 0;
        const orders = data.orders || 0;
        const avgTicket = data.avgTicket || (orders > 0 ? revenue / orders : 0);

        const prevMonth = trends.length > 1 ? trends[trends.length - 2] : null;
        const prevRevenue = prevMonth?.revenue || 0;
        const prevMargin = prevMonth?.margin || 0;
        const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
        const marginChange = prevMargin > 0 ? ((margin - prevMargin) / prevMargin) * 100 : 0;

        // Margen
        if (margin < 5) {
            newInsights.push({
                type: 'critical',
                title: 'Ganas muy poco por pedido',
                description: `De cada 100€ que cobras, solo te quedas ${margin.toFixed(1)}€. Lo normal es quedarse con 15€ o más.`,
                metric: `${margin.toFixed(1)}%`,
                trend: marginChange,
                question: '¿Cómo puedo ganar más por cada pedido?'
            });
        } else if (margin < 10) {
            newInsights.push({
                type: 'warning',
                title: 'Podrías ganar más',
                description: `Te quedas con ${margin.toFixed(1)}€ de cada 100€. Hay espacio para mejorar.`,
                metric: `${margin.toFixed(1)}%`,
                trend: marginChange,
                question: '¿Cómo subo lo que me queda de cada pedido?'
            });
        } else if (margin > 20) {
            newInsights.push({
                type: 'positive',
                title: '¡Muy buena rentabilidad!',
                description: `Te quedas con ${margin.toFixed(1)}€ de cada 100€. Estás por encima de la media. ¡Buen trabajo!`,
                metric: `${margin.toFixed(1)}%`,
                trend: marginChange,
                question: '¿Cómo mantengo esta buena racha?'
            });
        }

        // Beneficio
        if (profit < 0) {
            newInsights.push({
                type: 'critical',
                title: 'Estás perdiendo dinero',
                description: `Este mes llevas ${formatCurrency(Math.abs(profit))} de pérdidas. Hay que actuar ya.`,
                metric: formatCurrency(profit),
                question: '¿Qué hago para dejar de perder dinero?'
            });
        } else if (profit > 0 && profit < 2000) {
            newInsights.push({
                type: 'warning',
                title: 'Beneficio bajo',
                description: `Llevas ${formatCurrency(profit)} de beneficio. Para el tamaño de tu negocio, debería ser más.`,
                metric: formatCurrency(profit),
                question: '¿Cómo puedo aumentar mi beneficio?'
            });
        } else if (profit > 5000) {
            newInsights.push({
                type: 'positive',
                title: 'Buen beneficio',
                description: `Llevas ${formatCurrency(profit)} de beneficio. ¡Sigue así!`,
                metric: formatCurrency(profit),
                question: '¿Qué puedo hacer con este beneficio?'
            });
        }

        // Ticket medio
        if (avgTicket < 7) {
            newInsights.push({
                type: 'warning',
                title: 'Cobras poco por pedido',
                description: `Cada pedido te deja ${avgTicket.toFixed(2)}€ de media. Otros franquiciados consiguen más.`,
                metric: `${avgTicket.toFixed(2)}€`,
                question: '¿Cómo hago que cada pedido valga más?'
            });
        }

        // Tendencia de ingresos
        if (revenueChange < -10) {
            newInsights.push({
                type: 'warning',
                title: 'Menos ingresos que el mes pasado',
                description: `Has bajado un ${Math.abs(revenueChange).toFixed(1)}% en ingresos. Conviene averiguar por qué.`,
                metric: `${revenueChange.toFixed(1)}%`,
                question: '¿Por qué estoy ingresando menos?'
            });
        } else if (revenueChange > 10) {
            newInsights.push({
                type: 'positive',
                title: '¡Ingresos creciendo!',
                description: `¡Has subido un ${revenueChange.toFixed(1)}% respecto al mes pasado!`,
                metric: `+${revenueChange.toFixed(1)}%`,
                question: '¿Qué estoy haciendo bien para crecer?'
            });
        }

        // Proyección
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();
        const remainingDays = daysInMonth - currentDay;

        if (remainingDays > 0 && remainingDays < 10) {
            const dailyAvg = revenue / currentDay;
            const projectedRevenue = dailyAvg * daysInMonth;
            newInsights.push({
                type: 'info',
                title: `Te quedan ${remainingDays} días`,
                description: `Si sigues al mismo ritmo, cerrarás el mes con unos ${formatCurrency(projectedRevenue)}.`,
                metric: formatCurrency(projectedRevenue),
                question: '¿Llegaré a mi objetivo este mes?'
            });
        }

        return newInsights;
    }, []);

    // ── Smart greeting ──────────────────────────────────────
    const generateSmartGreeting = useCallback((
        data: {
            revenue: number;
            netProfit: number;
            margin: number;
        },
        currentInsights: Insight[]
    ) => {
        const profit = data.netProfit || 0;
        const revenue = data.revenue || 0;

        const hasCritical = currentInsights.some(i => i.type === 'critical');
        const hasWarning = currentInsights.some(i => i.type === 'warning');
        const hasPositive = currentInsights.some(i => i.type === 'positive');

        let greeting: string;

        if (hasCritical) {
            greeting = `⚠️ He detectado algo importante. Llevas **${formatCurrency(revenue)}** de ingresos y **${formatCurrency(profit)}** de beneficio.\n\n¿En qué te puedo ayudar?`;
        } else if (hasWarning) {
            greeting = `👋 Hay algunas cosas que podemos mejorar. Llevas **${formatCurrency(revenue)}** de ingresos este mes.\n\n¿Qué quieres revisar?`;
        } else if (hasPositive) {
            greeting = `🎉 ¡Los números van bien! Llevas **${formatCurrency(revenue)}** y **${formatCurrency(profit)}** de beneficio.\n\n¿Quieres saber cómo mantenerlo?`;
        } else {
            greeting = `👋 Soy tu asesor financiero. Llevas **${formatCurrency(revenue)}** de ingresos este mes.\n\n¿En qué te ayudo?`;
        }

        return greeting;
    }, []);

    // ── Effects ─────────────────────────────────────────────
    useEffect(() => {
        if (financialData) {
            const generatedInsights = generateProactiveInsights(financialData, trendData || []);
            setInsights(generatedInsights);
        }
    }, [financialData, trendData, generateProactiveInsights]);

    useEffect(() => {
        if (messages.length === 0 && financialData) {
            const initialMessage = generateSmartGreeting(financialData, insights);
            setMessages([{
                id: 'welcome',
                type: 'assistant',
                content: initialMessage,
                timestamp: new Date(),
                suggestions: [
                    '¿Cómo voy este mes?',
                    '¿Qué debo mejorar?',
                    '¿Llegaré a mi objetivo?',
                ]
            }]);
        }
    }, [financialData, insights, messages.length, generateSmartGreeting]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Send message (fixed: accepts direct text to avoid stale state) ──
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await generateAIResponse(text, financialData, trendData || [], messages);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: response.content,
                timestamp: new Date(),
                suggestions: response.suggestions,
                actions: response.actions
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error getting AI response:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: 'Perdona, he tenido un problema. ¿Puedes intentarlo otra vez?',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, financialData, trendData, messages]);

    const handleSendFromInput = () => {
        sendMessage(inputValue);
    };

    // ── AI Response Generation ──────────────────────────────
    const generateAIResponse = async (
        question: string,
        data: FinanceAdvisorChatProps['financialData'],
        trends: FinanceAdvisorChatProps['trendData'],
        _history: Message[]
    ) => {
        const context = {
            month: data.month,
            revenue: data.revenue,
            expenses: data.expenses,
            netProfit: data.netProfit,
            margin: data.margin,
            orders: data.orders,
            avgTicket: data.avgTicket || (data.orders > 0 ? data.revenue / data.orders : 0),
            breakdown: data.breakdown,
            metrics: data.metrics,
            trends: trends?.slice(-3) || []
        };

        const prompt = `Eres un asesor financiero especializado en franquicias de reparto/delivery. Hablas español de España.

IMPORTANTE: El usuario NO es experto en finanzas. Explica todo de forma muy sencilla, como si hablaras con un amigo. NUNCA uses jerga financiera (ni "ratio", ni "benchmark", ni "ROI"). Usa ejemplos con dinero real.

DATOS DEL MES (${context.month}):
- Ingresos: ${context.revenue?.toFixed(2)}€
- Gastos: ${context.expenses?.toFixed(2)}€
- Lo que te queda (beneficio): ${context.netProfit?.toFixed(2)}€
- De cada 100€, te quedas: ${context.margin?.toFixed(1)}€
- Pedidos: ${context.orders}
- Media por pedido: ${context.avgTicket?.toFixed(2)}€
- De cada euro, gastas: ${context.revenue > 0 ? ((context.expenses / context.revenue) * 100).toFixed(0) : 0} céntimos

Desglose de gastos: ${JSON.stringify(context.breakdown)}
Últimos 3 meses: ${JSON.stringify(context.trends)}

PREGUNTA: "${question}"

REGLAS:
1. Máximo 2 párrafos cortos + máximo 2 acciones numeradas
2. Usa **negritas** solo para cifras clave
3. Termina con una pregunta de seguimiento sencilla
4. NO uses emojis de decoración (sí para alertas: ⚠️ ✅ 💡)
5. NO uses encabezados markdown (##). Sé directo.
6. Estructura: lo que pasa → por qué pasa → qué puedes hacer
7. Si el usuario pregunta algo genérico, dale una respuesta corta y pregunta qué le interesa más

RESPUESTA:`;

        try {
            const text = await sendMessageToGemini(prompt);
            const suggestions = generateFollowUpSuggestions(question);

            return {
                content: text,
                suggestions,
                actions: []
            };
        } catch (error) {
            console.error('[FinanceAdvisorChat] AI Generation failed:', error);
            return generateLocalResponse(question, context);
        }
    };

    // ── Local fallback responses ────────────────────────────
    const generateLocalResponse = (
        question: string,
        context: {
            month: string;
            revenue: number;
            expenses: number;
            netProfit: number;
            margin: number;
            orders: number;
            avgTicket: number;
            breakdown?: Record<string, number>;
            metrics?: Record<string, number>;
            trends: Array<{ revenue: number; margin: number; month?: string }>;
        }
    ) => {
        const q = question.toLowerCase();

        if (q.includes('margen') || q.includes('beneficio') || q.includes('ganancia') || q.includes('queda')) {
            return {
                content: `De cada **100€** que entras, te quedas con **${context.margin.toFixed(1)}€** después de pagar todos los gastos.

${context.margin < 10
                        ? `Eso es poco. Lo ideal es quedarse con **15€ o más** de cada 100€.\n\n1. **Revisa tus gastos más grandes** — mira si puedes negociar mejores precios con proveedores\n2. **Intenta subir el valor de cada pedido** — por ejemplo, cobrando 0.50€ más por reparto\n\n¿Quieres que miremos dónde se te va más dinero?`
                        : context.margin > 20
                            ? `Eso está muy bien, por encima de la media. Estás controlando bien los gastos.\n\n1. **Mantén este control** sobre los gastos\n2. **Piensa en crecer** — con este margen puedes invertir en más riders\n\n¿Quieres saber cómo podrías crecer más?`
                            : `Está bien, pero podrías mejorar. La zona ideal es **15-20€** de cada 100€.\n\n1. **Optimiza los horarios** de tus riders para evitar horas sin pedidos\n2. **Negocia con proveedores** un 5% de descuento\n\n¿Quieres consejos más específicos?`}`,
                suggestions: ['¿Dónde gasto más?', '¿Cómo subo lo que cobro?', 'Compara con el mes pasado'],
                actions: onOpenSimulator ? [{
                    label: 'Probar escenarios',
                    action: onOpenSimulator,
                    type: 'primary' as const
                }] : []
            };
        }

        if (q.includes('gasto') || q.includes('gastar') || q.includes('coste') || q.includes('dinero') || q.includes('dónde')) {
            const topExpenses = Object.entries(context.breakdown || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

            return {
                content: `Este mes llevas **${formatCurrency(context.expenses)}** en gastos. Aquí van los 3 más grandes:

${topExpenses.map(([key, value], idx) => {
                    const percentage = ((value / context.expenses) * 100).toFixed(0);
                    return `${idx + 1}. **${key}**: ${formatCurrency(value)} (el ${percentage}% de tus gastos)`;
                }).join('\n')}

${context.expenses > context.revenue * 0.85
                        ? '⚠️ Cuidado: estás gastando más del 85% de lo que ingresas. Queda muy poco margen.'
                        : '✅ Tus gastos están en una proporción aceptable.'}

1. **Empieza por el gasto más grande** — incluso un 5% de ahorro ahí tiene impacto
2. **Revisa si hay gastos que puedas reducir** sin afectar al servicio

¿Quieres que miremos alguno en detalle?`,
                suggestions: ['¿Cómo ahorro en personal?', '¿Gasto mucho en combustible?', 'Proyección del mes'],
                actions: []
            };
        }

        if (q.includes('proyección') || q.includes('objetivo') || q.includes('llegar') || q.includes('final') || q.includes('cerrar') || q.includes('previsión')) {
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const currentDay = today.getDate();
            const remainingDays = daysInMonth - currentDay;
            const dailyAvg = currentDay > 0 ? context.revenue / currentDay : 0;
            const projectedRevenue = dailyAvg * daysInMonth;
            const projectedProfit = (projectedRevenue * context.margin) / 100;

            return {
                content: `Te quedan **${remainingDays} días** para cerrar el mes.

Si sigues al mismo ritmo de **${formatCurrency(dailyAvg)}/día**:
- Cerrarás con unos **${formatCurrency(projectedRevenue)}** de ingresos
- Y unos **${formatCurrency(projectedProfit)}** de beneficio

1. ${context.margin < 15 ? '**Mejora lo que te quedas por pedido** antes de buscar más volumen' : '**Intenta conseguir más pedidos** en las horas punta'}
2. **Revisa los gastos** que puedas recortar estos últimos días

¿Quieres que calculemos un escenario diferente?`,
                suggestions: ['¿Qué pasa si subo precios?', '¿Necesito más riders?', '¿Cómo fue el mes pasado?'],
                actions: onOpenSimulator ? [{
                    label: 'Probar en Simulador',
                    action: onOpenSimulator,
                    type: 'primary' as const
                }] : []
            };
        }

        if (q.includes('comparar') || q.includes('antes') || q.includes('anterior') || q.includes('mes pasado')) {
            const prevMonth = context.trends[context.trends.length - 2];
            if (!prevMonth) {
                return {
                    content: 'Todavía no tengo datos del mes anterior para comparar. Cuando pase un mes más, podré decirte cómo vas.',
                    suggestions: ['¿Cómo voy este mes?', 'Proyección de fin de mes', '¿Dónde gasto más?'],
                    actions: []
                };
            }

            const revenueChange = ((context.revenue - prevMonth.revenue) / prevMonth.revenue * 100);

            return {
                content: `Comparado con el mes pasado:

- **Ingresos**: ${revenueChange > 0 ? 'subieron' : 'bajaron'} un **${Math.abs(revenueChange).toFixed(1)}%** (de ${formatCurrency(prevMonth.revenue)} a ${formatCurrency(context.revenue)})

${revenueChange > 0
                        ? '✅ Vas en buena dirección. El siguiente paso es asegurarte de que el beneficio también suba.'
                        : '⚠️ Los ingresos han bajado. Puede ser por menos pedidos, ticket más bajo, o ambas cosas.'}

1. ${revenueChange > 0 ? '**Mantén el ritmo** y vigila que los gastos no suban más que los ingresos' : '**Averigua si hay menos pedidos** o si cada pedido vale menos'}
2. **Mira los gastos** para ver si algo ha cambiado

¿Quieres que investiguemos por qué?`,
                suggestions: ['¿Por qué cambió?', '¿Dónde gasto más?', 'Proyección de este mes'],
                actions: []
            };
        }

        if (q.includes('rider') || q.includes('personal') || q.includes('equipo') || q.includes('plantilla') || q.includes('salario')) {
            const salaryPct = context.expenses > 0 ? ((context.breakdown?.salaries || 0) / context.expenses * 100) : 0;
            return {
                content: `Los salarios son el **${salaryPct.toFixed(0)}%** de tus gastos totales (${formatCurrency(context.breakdown?.salaries || 0)}).

${salaryPct > 50
                        ? '⚠️ Más de la mitad de lo que gastas va a personal. Lo habitual es un 40-45%.\n\n1. **Revisa los horarios** — puede que haya horas donde tus riders están parados\n2. **Ajusta turnos** a las horas con más pedidos para aprovechar mejor cada hora'
                        : '✅ El gasto en personal está dentro de lo normal (menos del 50%).'}

¿Quieres que revise algo más sobre tu equipo?`,
                suggestions: ['¿Cómo optimizo turnos?', '¿Cuánto me cuesta cada rider?', 'Otros gastos'],
                actions: []
            };
        }

        if (q.includes('ticket') || q.includes('precio') || q.includes('cobro') || q.includes('venta') || q.includes('pedido')) {
            const avgTicket = context.orders > 0 ? context.revenue / context.orders : 0;
            return {
                content: `Cada pedido te deja **${formatCurrency(avgTicket)}** de media, y este mes llevas **${context.orders} pedidos**.

Si consigues que cada pedido valga un poco más, el impacto es grande:
- +0.50€/pedido = **${formatCurrency(context.orders * 0.5)}** más al mes
- +1.00€/pedido = **${formatCurrency(context.orders * 1.0)}** más al mes

1. **Sube un poco el precio del reparto** (0.25-0.50€) — los clientes apenas lo notan
2. **Ofrece extras** como entregas prioritarias o paquetes premium

¿Quieres que simulemos un escenario con otro precio?`,
                suggestions: ['Subir 0.50€ el reparto', '¿Cómo consigo más pedidos?', 'Proyección del mes'],
                actions: onOpenSimulator ? [{
                    label: 'Probar en Simulador',
                    action: onOpenSimulator,
                    type: 'primary' as const
                }] : []
            };
        }

        if (q.includes('impuesto') || q.includes('iva') || q.includes('fiscal') || q.includes('hacienda') || q.includes('modelo')) {
            const ivaEstimado = context.revenue * 0.21;
            return {
                content: `💡 **Resumen fiscal rápido**

De tus ingresos, Hacienda se lleva el **21% de IVA**, que son unos **${formatCurrency(ivaEstimado)}** este mes.

1. **Guarda siempre ese 21%** — no lo cuentes como tu dinero
2. **Guarda las facturas de todo** — el IVA de tus gastos reduce lo que pagas

⚠️ Esto es solo orientativo. Consulta siempre con tu gestor para las liquidaciones reales.

¿Algo más que quieras saber?`,
                suggestions: ['¿Cuánto aparto para impuestos?', '¿Cómo fue el mes pasado?', 'Proyección del mes'],
                actions: []
            };
        }

        if (q.includes('mejorar') || q.includes('consejo') || q.includes('optimizar') || q.includes('qué puedo') || q.includes('qué hago') || q.includes('cómo voy')) {
            const issues: string[] = [];
            if (context.margin < 15) issues.push('⚠️ Te quedas con poco de cada 100€');
            if (context.expenses > context.revenue * 0.85) issues.push('⚠️ Gastas demasiado de lo que ingresas');
            if (context.orders < 20) issues.push('💡 Pocos pedidos — intenta captar más clientes');

            return {
                content: `${issues.length > 0 ? `He detectado esto:\n${issues.join('\n')}\n\n` : '✅ No veo problemas graves. Vamos a ver cómo puedes mejorar.\n\n'}Lo más importante ahora:

1. **Esta semana**: Mira tus 3 gastos más altos y busca reducir un 5% en alguno
2. **Este mes**: Intenta que cada pedido valga 0.50-1€ más

¿Por dónde quieres empezar?`,
                suggestions: ['¿Dónde gasto más?', '¿Cómo subo el precio por pedido?', 'Proyección del mes'],
                actions: []
            };
        }

        // Default fallback
        return {
            content: `Tus números de este mes:
- Ingresos: **${formatCurrency(context.revenue)}**
- Te queda: **${formatCurrency(context.netProfit)}**
- De cada 100€, guardas: **${context.margin.toFixed(1)}€**
- Pedidos: **${context.orders}**

Puedo ayudarte con cosas como:
💰 ¿Dónde se me va el dinero?
📈 ¿Llegaré a mi objetivo?
📊 ¿Cómo me fue el mes pasado?
💡 ¿Qué puedo mejorar?

¿Qué te interesa?`,
            suggestions: ['¿Cómo voy este mes?', '¿Dónde gasto más?', '¿Qué puedo mejorar?'],
            actions: []
        };
    };

    // ── Follow-up suggestions ───────────────────────────────
    const generateFollowUpSuggestions = (question: string) => {
        const q = question.toLowerCase();

        if (q.includes('margen') || q.includes('beneficio') || q.includes('queda')) {
            return ['¿Dónde gasto más?', '¿Cómo subo precios?', 'Proyección del mes'];
        }
        if (q.includes('gasto') || q.includes('coste')) {
            return ['¿Cómo ahorro?', '¿Cómo fue el mes pasado?', '¿Qué más puedo hacer?'];
        }
        if (q.includes('proyección') || q.includes('objetivo') || q.includes('llegar')) {
            return ['¿Qué pasa si subo precios?', '¿Necesito más riders?', '¿Dónde gasto más?'];
        }
        if (q.includes('comparar') || q.includes('pasado') || q.includes('anterior')) {
            return ['¿Por qué cambió?', 'Proyección de este mes', '¿Qué puedo mejorar?'];
        }
        return ['¿Cómo voy este mes?', '¿Dónde gasto más?', '¿Qué puedo mejorar?'];
    };

    // ── Quick questions for chat tab ────────────────────────
    const quickQuestions = [
        { icon: BarChart3, text: '¿Cómo voy este mes?', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: DollarSign, text: '¿Dónde gasto más?', color: 'text-rose-600', bg: 'bg-rose-50' },
        { icon: Target, text: '¿Llegaré a mi objetivo?', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { icon: Lightbulb, text: '¿Qué puedo mejorar?', color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    // ── Insight helpers ─────────────────────────────────────
    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'positive': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'critical': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            default: return <Lightbulb className="w-5 h-5 text-blue-500" />;
        }
    };

    const getInsightBg = (type: string) => {
        switch (type) {
            case 'positive': return 'bg-emerald-50 border-emerald-200';
            case 'warning': return 'bg-amber-50 border-amber-200';
            case 'critical': return 'bg-rose-50 border-rose-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    if (!financialData) return null;

    return (
        <>
            {/* Floating Button — solo en modo independiente */}
            {externalIsOpen === undefined && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setInternalIsOpen(true);
                        setHasUnreadInsights(false);
                    }}
                    className={cn(
                        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all",
                        "bg-slate-900 text-white hover:bg-slate-800",
                        isOpen && "hidden"
                    )}
                >
                    <Bot className="w-5 h-5" />
                    <span className="font-medium text-sm">Asesor IA</span>
                    {hasUnreadInsights && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                            {insights.filter(i => i.type === 'critical' || i.type === 'warning').length || 1}
                        </span>
                    )}
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed top-24 right-6 z-50 w-[520px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[calc(100vh-120px)] flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Asesor Financiero</h3>
                                        <p className="text-[11px] text-white/60 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            Análisis con IA
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (externalIsOpen === undefined) {
                                            setInternalIsOpen(false);
                                        }
                                        if (onClose) {
                                            onClose();
                                        }
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Cerrar asesor financiero"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* 2 Tabs Only: Diagnóstico + Chat */}
                            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                                {[
                                    { id: 'diagnosis', label: 'Diagnóstico', icon: Stethoscope },
                                    { id: 'chat', label: 'Pregúntame', icon: MessageCircle },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'diagnosis' | 'chat')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                                            activeTab === tab.id
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-white/70 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ────────── TAB: DIAGNÓSTICO ────────── */}
                        {activeTab === 'diagnosis' && (() => {
                            const margin = financialData.margin || 0;
                            const expRatio = financialData.revenue > 0 ? financialData.expenses / financialData.revenue : 0;
                            const trendVal = trendData && trendData.length > 1
                                ? ((financialData.revenue - (trendData[trendData.length - 2]?.revenue || 0)) / (trendData[trendData.length - 2]?.revenue || 1)) * 100
                                : 0;

                            const factors = [
                                {
                                    label: 'Lo que te queda por pedido',
                                    value: `${margin.toFixed(1)}%`,
                                    score: margin >= 20 ? 100 : margin >= 15 ? 80 : margin >= 10 ? 60 : margin >= 5 ? 35 : 15,
                                    ideal: 'Ideal: +15%',
                                },
                                {
                                    label: 'Tendencia de ingresos',
                                    value: `${trendVal > 0 ? '+' : ''}${trendVal.toFixed(1)}%`,
                                    score: trendVal > 10 ? 100 : trendVal > 5 ? 85 : trendVal > 0 ? 70 : trendVal > -5 ? 50 : 30,
                                    ideal: 'Ideal: subiendo',
                                },
                                {
                                    label: 'Cuánto gastas de lo que ingresas',
                                    value: `${(expRatio * 100).toFixed(0)} céntimos/€`,
                                    score: expRatio < 0.6 ? 100 : expRatio < 0.7 ? 85 : expRatio < 0.8 ? 65 : expRatio < 0.9 ? 40 : 15,
                                    ideal: 'Ideal: <70 céntimos',
                                },
                            ];

                            const totalScore = Math.round(
                                factors[0].score * 0.40 +
                                factors[1].score * 0.30 +
                                factors[2].score * 0.30
                            );

                            const getScoreColor = (s: number) => {
                                if (s >= 70) return { text: 'text-emerald-500', stroke: 'stroke-emerald-500', label: '🟢 Vas bien' };
                                if (s >= 45) return { text: 'text-amber-500', stroke: 'stroke-amber-500', label: '🟡 Puedes mejorar' };
                                return { text: 'text-rose-500', stroke: 'stroke-rose-500', label: '🔴 Necesitas actuar' };
                            };

                            const { text: scoreText, stroke: scoreStroke, label: scoreLabelText } = getScoreColor(totalScore);

                            return (
                                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                                    <div className="space-y-4">
                                        {/* Score */}
                                        <div className="text-center py-3">
                                            <div className="relative inline-flex items-center justify-center w-24 h-24">
                                                <svg width={96} height={96} className="transform -rotate-90">
                                                    <circle cx={48} cy={48} r={40} fill="none" stroke="#e2e8f0" strokeWidth={8} />
                                                    <circle
                                                        cx={48} cy={48} r={40} fill="none"
                                                        stroke="currentColor" strokeWidth={8}
                                                        strokeDasharray={2 * Math.PI * 40}
                                                        strokeDashoffset={2 * Math.PI * 40 * (1 - totalScore / 100)}
                                                        strokeLinecap="round"
                                                        className={cn("transition-all duration-1000 ease-out", scoreStroke)}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className={cn("text-2xl font-black tabular-nums", scoreText)}>{totalScore}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">/100</span>
                                                </div>
                                            </div>
                                            <p className={cn("mt-1.5 text-sm font-bold", scoreText)}>{scoreLabelText}</p>
                                        </div>

                                        {/* Factors */}
                                        <div className="space-y-2">
                                            {factors.map((f, idx) => {
                                                const barColor = f.score >= 70 ? 'bg-emerald-500' : f.score >= 45 ? 'bg-amber-500' : 'bg-rose-500';
                                                return (
                                                    <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                                                            <span className="text-xs font-mono font-bold text-slate-900">{f.value}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${f.score}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className={cn('h-full rounded-full', barColor)}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-1">{f.ideal}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Insights with "Ask about this" buttons */}
                                        {insights.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Lightbulb className="w-3.5 h-3.5" />
                                                    Lo que he detectado
                                                </h4>
                                                {insights.map((insight, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={cn(
                                                            "p-3 rounded-xl border",
                                                            getInsightBg(insight.type)
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-2.5">
                                                            {getInsightIcon(insight.type)}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <h5 className="font-bold text-xs text-slate-800">{insight.title}</h5>
                                                                    {insight.metric && (
                                                                        <span className="text-[11px] font-bold text-slate-700 bg-white/60 px-1.5 py-0.5 rounded">
                                                                            {insight.metric}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                                                    {insight.description}
                                                                </p>
                                                                {insight.trend !== undefined && (
                                                                    <div className={cn(
                                                                        "mt-1 text-[10px] font-medium flex items-center gap-1",
                                                                        insight.trend > 0 ? "text-emerald-600" : "text-rose-600"
                                                                    )}>
                                                                        {insight.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                                        {insight.trend > 0 ? '+' : ''}{insight.trend.toFixed(1)}% vs mes anterior
                                                                    </div>
                                                                )}
                                                                {insight.question && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveTab('chat');
                                                                            sendMessage(insight.question!);
                                                                        }}
                                                                        className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                                                                    >
                                                                        <MessageCircle className="w-3 h-3" />
                                                                        {insight.question}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Quick Actions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {onOpenSimulator && (
                                                <button
                                                    onClick={onOpenSimulator}
                                                    className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                                                >
                                                    <PlayCircle className="w-4 h-4 text-amber-600" />
                                                    Simulador
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setActiveTab('chat');
                                                    sendMessage('¿Cómo voy este mes?');
                                                }}
                                                className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition-colors"
                                            >
                                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                                Análisis rápido
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('chat');
                                                    sendMessage('¿Cómo fue el mes pasado?');
                                                }}
                                                className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                                            >
                                                <Calendar className="w-4 h-4 text-emerald-600" />
                                                Comparar meses
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('chat');
                                                    sendMessage('¿Llegaré a mi objetivo?');
                                                }}
                                                className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors"
                                            >
                                                <Zap className="w-4 h-4 text-rose-600" />
                                                Proyección
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ────────── TAB: CHAT ────────── */}
                        {activeTab === 'chat' && (
                            <>
                                {/* Quick Question chips */}
                                <div className="p-3 bg-slate-50 border-b border-slate-200">
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {quickQuestions.map((q, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(q.text)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap border",
                                                    q.bg,
                                                    "border-transparent hover:border-current"
                                                )}
                                            >
                                                <q.icon className={cn("w-3.5 h-3.5", q.color)} />
                                                <span className={q.color}>{q.text}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 min-h-0 max-h-[400px]">
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex gap-3",
                                                message.type === 'user' ? "flex-row-reverse" : "flex-row"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                message.type === 'user' ? "bg-indigo-100" : "bg-slate-900"
                                            )}>
                                                {message.type === 'user' ? (
                                                    <User className="w-4 h-4 text-indigo-600" />
                                                ) : (
                                                    <Bot className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className={cn(
                                                "max-w-[85%] p-3 rounded-2xl text-sm",
                                                message.type === 'user'
                                                    ? "bg-indigo-600 text-white rounded-tr-sm"
                                                    : "bg-white border border-slate-200 rounded-tl-sm shadow-sm"
                                            )}>
                                                <div
                                                    className="prose prose-sm max-w-none leading-relaxed"
                                                    dangerouslySetInnerHTML={{
                                                        __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>').replace(/\n/g, '<br/>')
                                                    }}
                                                />

                                                {/* Actions */}
                                                {message.actions && message.actions.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                                        {message.actions.map((action, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={action.action}
                                                                className={cn(
                                                                    "w-full py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
                                                                    action.type === 'primary'
                                                                        ? "bg-slate-900 text-white hover:bg-slate-800"
                                                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                                )}
                                                            >
                                                                {action.label}
                                                                <ArrowRight className="w-3 h-3" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Suggestions */}
                                                {message.suggestions && message.type === 'assistant' && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                                                        {message.suggestions.map((suggestion, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => sendMessage(suggestion)}
                                                                className="block w-full text-left text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1.5 rounded transition-colors flex items-center gap-1"
                                                            >
                                                                <ArrowRight className="w-3 h-3" />
                                                                {suggestion}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 bg-white border-t border-slate-200">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="advisor-chat-input"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendFromInput()}
                                            placeholder="Pregúntame lo que quieras..."
                                            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                                        />
                                        <button
                                            onClick={handleSendFromInput}
                                            disabled={!inputValue.trim() || isLoading}
                                            aria-label="Enviar mensaje"
                                            className={cn(
                                                "p-2.5 rounded-xl transition-all",
                                                inputValue.trim() && !isLoading
                                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                            )}
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                                        Respuestas basadas en tus datos reales • Impulsado por IA
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FinanceAdvisorChat;
