import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, TrendingUp, AlertCircle, AlertTriangle, Lightbulb, Target, TrendingDown, Calendar, DollarSign, PieChart, ArrowRight, BarChart3, Zap, CheckCircle, MessageCircle, PlayCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';

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
        breakdown?: any;
        metrics?: any;
        avgTicket?: number;
        costPerOrder?: number;
        historicalData?: any[];
    };
    trendData?: any[];
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
}

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
    const [activeTab, setActiveTab] = useState<'health' | 'chat' | 'insights' | 'actions'>('health');
    const [insights, setInsights] = useState<Insight[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user: _user } = useAuth();

    // Generate proactive insights on mount
    useEffect(() => {
        if (financialData) {
            const generatedInsights = generateProactiveInsights(financialData, trendData || []);
            setInsights(generatedInsights);
        }
    }, [financialData, trendData]);

    // Initial greeting with context
    useEffect(() => {
        if (messages.length === 0 && financialData) {
            const initialMessage = generateSmartGreeting(financialData, insights);
            setMessages([{
                id: 'welcome',
                type: 'assistant',
                content: initialMessage,
                timestamp: new Date(),
                suggestions: [
                    'Análisis completo del mes',
                    '¿Cómo comparo con meses anteriores?',
                    '¿Qué debo mejorar urgentemente?',
                    'Proyección para fin de mes'
                ]
            }]);
        }
    }, [financialData, insights]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const generateProactiveInsights = (data: any, trends: any[]): Insight[] => {
        const newInsights: Insight[] = [];
        const margin = data.margin || 0;
        const profit = data.netProfit || 0;
        const revenue = data.revenue || 0;
        const orders = data.orders || 0;
        const avgTicket = data.avgTicket || (orders > 0 ? revenue / orders : 0);

        // Comparación con mes anterior
        const prevMonth = trends.length > 1 ? trends[trends.length - 2] : null;
        const prevRevenue = prevMonth?.revenue || 0;
        const prevMargin = prevMonth?.margin || 0;
        const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
        const marginChange = prevMargin > 0 ? ((margin - prevMargin) / prevMargin) * 100 : 0;

        // Insight 1: Margen
        if (margin < 5) {
            newInsights.push({
                type: 'critical',
                title: 'Margen crítico',
                description: `Tu margen del ${margin.toFixed(1)}% está muy por debajo del óptimo (15-20%). Esto significa que estás ganando muy poco por cada pedido.`,
                metric: `${margin.toFixed(1)}%`,
                trend: marginChange
            });
        } else if (margin < 10) {
            newInsights.push({
                type: 'warning',
                title: 'Margen bajo',
                description: `Tu margen del ${margin.toFixed(1)}% es inferior al ideal. Hay espacio para mejorar la rentabilidad.`,
                metric: `${margin.toFixed(1)}%`,
                trend: marginChange
            });
        } else if (margin > 20) {
            newInsights.push({
                type: 'positive',
                title: '¡Excelente margen!',
                description: `Tu margen del ${margin.toFixed(1)}% está muy por encima de la media. Estás gestionando muy bien tus costes.`,
                metric: `${margin.toFixed(1)}%`,
                trend: marginChange
            });
        }

        // Insight 2: Beneficio
        if (profit < 0) {
            newInsights.push({
                type: 'critical',
                title: 'Pérdidas este mes',
                description: `Estás perdiendo ${formatCurrency(Math.abs(profit))}. Es urgente revisar tus gastos o aumentar ingresos.`,
                metric: formatCurrency(profit)
            });
        } else if (profit > 0 && profit < 2000) {
            newInsights.push({
                type: 'warning',
                title: 'Beneficio bajo',
                description: `Tu beneficio de ${formatCurrency(profit)} es inferior a lo recomendado para una franquicia de este tamaño.`,
                metric: formatCurrency(profit)
            });
        } else if (profit > 5000) {
            newInsights.push({
                type: 'positive',
                title: 'Buen beneficio',
                description: `Estás generando ${formatCurrency(profit)} de beneficio. ¡Sigue así!`,
                metric: formatCurrency(profit)
            });
        }

        // Insight 3: Ticket medio
        if (avgTicket < 7) {
            newInsights.push({
                type: 'warning',
                title: 'Ticket medio bajo',
                description: `Tu ticket medio de ${avgTicket.toFixed(2)}€ es inferior a la media de la red. Considera estrategias para aumentar el valor por pedido.`,
                metric: `${avgTicket.toFixed(2)}€`
            });
        }

        // Insight 4: Tendencia de ingresos
        if (revenueChange < -10) {
            newInsights.push({
                type: 'warning',
                title: 'Caída de ingresos',
                description: `Tus ingresos han caído un ${Math.abs(revenueChange).toFixed(1)}% respecto al mes pasado.`,
                metric: `${revenueChange.toFixed(1)}%`
            });
        } else if (revenueChange > 10) {
            newInsights.push({
                type: 'positive',
                title: 'Crecimiento de ingresos',
                description: `¡Tus ingresos han subido un ${revenueChange.toFixed(1)}% respecto al mes pasado!`,
                metric: `+${revenueChange.toFixed(1)}%`
            });
        }

        // Insight 5: Días restantes y proyección
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();
        const remainingDays = daysInMonth - currentDay;

        if (remainingDays > 0 && remainingDays < 10) {
            const dailyAvg = revenue / currentDay;
            const projectedRevenue = dailyAvg * daysInMonth;
            newInsights.push({
                type: 'info',
                title: 'Proyección fin de mes',
                description: `Te quedan ${remainingDays} días. Si mantienes el ritmo, cerrarás el mes con aproximadamente ${formatCurrency(projectedRevenue)}.`,
                metric: formatCurrency(projectedRevenue)
            });
        }

        return newInsights;
    };

    const generateSmartGreeting = (data: any, currentInsights: Insight[]) => {
        const margin = data.margin || 0;
        const profit = data.netProfit || 0;
        const revenue = data.revenue || 0;

        let greeting = '';

        if (currentInsights.some(i => i.type === 'critical')) {
            const criticalCount = currentInsights.filter(i => i.type === 'critical').length;
            greeting = `⚠️ **¡Atención!** He detectado ${criticalCount} ${criticalCount === 1 ? 'problema crítico' : 'problemas críticos'} que requieren tu acción inmediata.\n\n`;
            greeting += `Este mes llevas **${formatCurrency(revenue)}** en ingresos con un margen del **${margin.toFixed(1)}%**. `;
            greeting += `Tu beneficio actual es **${formatCurrency(profit)}**.\n\n`;
            greeting += `He identificado algunas áreas donde puedes mejorar. ¿Por dónde quieres empezar?`;
        } else if (currentInsights.some(i => i.type === 'warning')) {
            greeting = `👋 ¡Hola! Veo que hay algunas áreas de mejora este mes.\n\n`;
            greeting += `Llevas **${formatCurrency(revenue)}** en ingresos con un margen del **${margin.toFixed(1)}%**. `;
            greeting += `He preparado algunas recomendaciones para optimizar tus resultados. ¿Qué te gustaría revisar?`;
        } else if (currentInsights.some(i => i.type === 'positive')) {
            greeting = `🎉 ¡Excelentes noticias! Tus números van muy bien este mes.\n\n`;
            greeting += `Llevas **${formatCurrency(revenue)}** en ingresos con un margen del **${margin.toFixed(1)}%** y un beneficio de **${formatCurrency(profit)}**. `;
            greeting += `¿Te gustaría saber qué estás haciendo bien y cómo mantenerlo?`;
        } else {
            greeting = `👋 ¡Hola! Soy tu asesor financiero.\n\n`;
            greeting += `Este mes llevas **${formatCurrency(revenue)}** en ingresos con un margen del **${margin.toFixed(1)}%**. `;
            greeting += `Estoy aquí para ayudarte a entender tus números y encontrar oportunidades. ¿En qué puedo ayudarte?`;
        }

        return greeting;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value || 0);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await generateAIResponse(inputValue, financialData, trendData || [], messages);

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
                content: 'Lo siento, tuve un problema al procesar tu pregunta. ¿Podrías intentarlo de nuevo?',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateAIResponse = async (question: string, data: any, trends: any[], _history: Message[]) => {
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

        const prompt = `Eres un asesor financiero senior especializado en franquicias de delivery/reparto. Hablas español de España. Tu rol es analizar datos y dar recomendaciones accionables.

DATOS DEL MES (${context.month}):
- Ingresos: €${context.revenue?.toFixed(2)}
- Gastos: €${context.expenses?.toFixed(2)}
- Beneficio Neto: €${context.netProfit?.toFixed(2)}
- Margen: ${context.margin?.toFixed(1)}%
- Pedidos: ${context.orders}
- Ticket Medio: €${context.avgTicket?.toFixed(2)}
- Ratio gastos/ingresos: ${context.revenue > 0 ? ((context.expenses / context.revenue) * 100).toFixed(0) : 0}%

Desglose gastos: ${JSON.stringify(context.breakdown)}
Tendencias 3 meses: ${JSON.stringify(context.trends)}

PREGUNTA: "${question}"

REGLAS DE FORMATO:
1. Español profesional y cercano. Máximo 3 párrafos + 1 lista de acciones
2. Usa **negritas** solo para cifras clave
3. Numera las acciones concretas (máx 3)
4. Termina con una pregunta de seguimiento relevante
5. NO uses encabezados markdown (##). Usa emojis como separadores visuales
6. Sé directo: diagnóstico → causa → acción

RESPUESTA:`;

        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const suggestions = generateFollowUpSuggestions(question, context);

            return {
                content: text,
                suggestions,
                actions: []
            };
        } catch (error) {
            return generateLocalResponse(question, context);
        }
    };

    const generateLocalResponse = (question: string, context: any) => {
        const q = question.toLowerCase();

        if (q.includes('margen') || q.includes('beneficio') || q.includes('ganancia')) {
            return {
                content: `📊 **Análisis de tu margen**

Tu margen actual es del **${context.margin.toFixed(1)}%**, lo que significa que de cada 100€ que entran, te quedan ${context.margin.toFixed(1)}€ de beneficio.

${context.margin < 10
                        ? '⚠️ Tu margen está por debajo del óptimo (15-20%). Esto puede deberse a:\n\n1. **Gastos fijos elevados** - Revisa alquiler, seguros y servicios\n2. **Costes variables altos** - Combustible y mantenimiento\n3. **Ticket medio bajo** - Trata de aumentar el valor por pedido\n\n**Recomendación**: Usa el simulador para probar diferentes escenarios y ver cómo afectan a tu margen.'
                        : context.margin > 20
                            ? '🎉 ¡Excelente! Tu margen está muy por encima de la media. Estás gestionando muy bien:\n\n• Control de costes eficiente\n• Buena productividad por rider\n• Ticket medio saludable\n\n**Consejo**: Mantén este nivel y considera invertir en crecimiento.'
                            : '✅ Tu margen está en rango aceptable, pero hay margen de mejora:\n\n• Optimiza horarios para reducir horas improductivas\n• Negocia mejores tarifas con proveedores\n• Implementa upselling para subir el ticket medio'}

¿Quieres que analice algún aspecto específico?`,
                suggestions: ['¿Cómo subir mi margen?', 'Análisis detallado de gastos', 'Probar escenario en simulador'],
                actions: onOpenSimulator ? [{
                    label: 'Abrir Simulador',
                    action: onOpenSimulator,
                    type: 'primary' as const
                }] : []
            };
        }

        if (q.includes('gasto') || q.includes('gastar') || q.includes('coste') || q.includes('dinero')) {
            const topExpenses = Object.entries(context.breakdown || {})
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 3);

            return {
                content: `💰 **Análisis de tus gastos**

Tus gastos totales este mes son **${formatCurrency(context.expenses)}**.

**Top 3 gastos:**
${topExpenses.map(([key, value]: [string, any], idx) => {
                    const percentage = ((value / context.expenses) * 100).toFixed(1);
                    return `${idx + 1}. **${key}**: ${formatCurrency(value)} (${percentage}%)`;
                }).join('\n')}

**Distribución recomendada vs actual:**
• Salarios: Ideal 40-50% | Tuyo: ${((context.breakdown?.salaries || 0) / context.expenses * 100).toFixed(0)}%
• Combustible: Ideal 15-20% | Tuyo: ${((context.breakdown?.gasoline || 0) / context.expenses * 100).toFixed(0)}%
• Alquiler/Servicios: Ideal 10-15% | Tuyo: ${(((context.breakdown?.renting || 0) + (context.breakdown?.services || 0)) / context.expenses * 100).toFixed(0)}%

${context.expenses > context.revenue * 0.85 ? '⚠️ **Alerta**: Tus gastos superan el 85% de tus ingresos. Es importante reducir costes o aumentar ingresos.' : '✅ Tus gastos están en proporción saludable respecto a tus ingresos.'}

¿Quieres consejos para reducir algún gasto específico?`,
                suggestions: ['¿Dónde puedo ahorrar?', 'Comparar con mes pasado', 'Reducir combustible'],
                actions: []
            };
        }

        if (q.includes('proyección') || q.includes('final de mes') || q.includes('cerrar') || q.includes('previsión')) {
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const currentDay = today.getDate();
            const remainingDays = daysInMonth - currentDay;
            const dailyAvg = currentDay > 0 ? context.revenue / currentDay : 0;
            const projectedRevenue = dailyAvg * daysInMonth;
            const projectedProfit = (projectedRevenue * context.margin) / 100;
            const requiredPerDay = remainingDays > 0 ? Math.ceil((20000 - context.revenue) / remainingDays) : 0;

            return {
                content: `📈 **Proyección fin de mes**

Te quedan **${remainingDays} días** para cerrar el mes.

**Si mantienes tu ritmo actual:**
• Ingresos proyectados: **${formatCurrency(projectedRevenue)}**
• Beneficio estimado: **${formatCurrency(projectedProfit)}**
• Pedidos necesarios/día: **${Math.ceil(dailyAvg)}**

**Para alcanzar 20.000€ (meta estándar):**
• Necesitas **${formatCurrency(20000 - context.revenue)}** más
• Eso son **${requiredPerDay} pedidos/día** de media
• O aumentar tu ticket medio a **${((20000 - context.revenue) / remainingDays / 40).toFixed(2)}€**

**Acciones recomendadas:**
1. ${context.margin < 15 ? 'Mejora tu margen antes de buscar más volumen' : 'Aumenta marketing para más pedidos'}
2. ${context.orders < 30 ? 'Contrata 1 rider más para cubrir demanda' : 'Optimiza horarios actuales'}
3. Implementa promociones de "2x1" en horas valle

¿Quieres que calculemos un escenario personalizado?`,
                suggestions: ['Escenario optimista', 'Escenario conservador', 'Cómo llegar a 20k'],
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
                    content: 'No tengo datos del mes anterior para comparar. Intenta de nuevo más tarde cuando haya más historial.',
                    suggestions: ['Análisis de este mes', 'Ver tendencias', 'Proyección'],
                    actions: []
                };
            }

            const revenueChange = ((context.revenue - prevMonth.revenue) / prevMonth.revenue * 100);
            const marginChange = ((context.margin - prevMonth.margin) / prevMonth.margin * 100);

            return {
                content: `📊 **Comparativa con ${prevMonth.month || 'mes anterior'}**

**Ingresos:**
• Este mes: **${formatCurrency(context.revenue)}**
• Mes pasado: **${formatCurrency(prevMonth.revenue)}**
• Cambio: **${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%** ${revenueChange > 0 ? '📈' : '📉'}

**Margen:**
• Este mes: **${context.margin.toFixed(1)}%**
• Mes pasado: **${prevMonth.margin?.toFixed(1) || 'N/A'}%**
• Cambio: **${marginChange > 0 ? '+' : ''}${marginChange.toFixed(1)}%**

**Análisis:**
${revenueChange > 0 && marginChange > 0
                        ? '🎉 ¡Perfecto! Estás creciendo en ingresos Y mejorando tu rentabilidad. Esto es el holy grail de los negocios.'
                        : revenueChange > 0 && marginChange < 0
                            ? '⚠️ Estás vendiendo más pero ganando menos por cada venta. Revisa tus costes - probablemente hayas aumentado gastos.'
                            : revenueChange < 0 && marginChange > 0
                                ? '💡 Vendes menos pero más rentable. Esto puede ser una estrategia válida a corto plazo, pero necesitas recuperar volumen.'
                                : '🚨 Alerta: Menos ventas y menos rentabilidad. Es momento de tomar acciones correctivas urgentes.'}

¿Quieres ver el análisis detallado de qué cambió?`,
                suggestions: ['¿Por qué cambió el margen?', 'Tendencia últimos 3 meses', 'Comparar gastos'],
                actions: []
            };
        }

        if (q.includes('rider') || q.includes('personal') || q.includes('equipo') || q.includes('plantilla')) {
            const salaryPct = context.expenses > 0 ? ((context.breakdown?.salaries || 0) / context.expenses * 100) : 0;
            return {
                content: `👥 **Análisis de costes de personal**

Los salarios representan el **${salaryPct.toFixed(0)}%** de tus gastos totales (${formatCurrency(context.breakdown?.salaries || 0)}).

${salaryPct > 50 ? '⚠️ Superas el 50% recomendado. Opciones:\n1. **Optimiza turnos** — Elimina horas muertas entre pedidos\n2. **Mixto fijo/variable** — Vincula parte del salario a pedidos entregados\n3. **Cross-training** — Riders polivalentes para cubrir bajas sin contratar' :
                        '✅ Tu ratio de personal/gastos está dentro del rango saludable (<50%).'}

📊 Referencia del sector: 40-45% de gastos en personal es el benchmark.

¿Quieres que revise la eficiencia por rider?`,
                suggestions: ['Coste por rider', 'Optimizar turnos', 'Comparar con sector'],
                actions: []
            };
        }

        if (q.includes('ticket') || q.includes('precio') || q.includes('venta media')) {
            const avgTicket = context.orders > 0 ? context.revenue / context.orders : 0;
            return {
                content: `🎫 **Análisis del Ticket Medio**

Tu ticket medio actual es **${formatCurrency(avgTicket)}** con **${context.orders}** pedidos.

**Estrategias para subirlo:**
1. **Upselling**: Sugiere complementos al pedido (+0.50-1.50€/pedido)
2. **Combos**: Agrupa productos con descuento aparente (margen real +15%)
3. **Minimums de pedido**: Establece mínimo de 8-10€ para envío gratuito

**Impacto simulado:**
• +0.50€/ticket = **${formatCurrency(context.orders * 0.5)}/mes** más
• +1.00€/ticket = **${formatCurrency(context.orders * 1.0)}/mes** más
• +2.00€/ticket = **${formatCurrency(context.orders * 2.0)}/mes** más

¿Quieres que simulemos un escenario con ticket más alto?`,
                suggestions: ['Simular ticket +1€', 'Estrategias de upselling', 'Impacto en margen'],
                actions: onOpenSimulator ? [{
                    label: 'Simular escenario',
                    action: onOpenSimulator,
                    type: 'primary' as const
                }] : []
            };
        }

        if (q.includes('optimizar') || q.includes('mejorar') || q.includes('consejo') || q.includes('recomendación') || q.includes('qué puedo hacer')) {
            const topIssues: string[] = [];
            if (context.margin < 15) topIssues.push('🔴 Margen bajo — necesitas subir precios o cortar costes');
            if (context.expenses > context.revenue * 0.85) topIssues.push('🔴 Ratio gastos/ingresos peligroso (>85%)');
            if (context.orders < 20) topIssues.push('🟡 Pocos pedidos — trabaja captación de clientes');

            return {
                content: `🎯 **Plan de optimización personalizado**

${topIssues.length > 0 ? `**Problemas detectados:**\n${topIssues.join('\n')}\n` : '✅ No detecto problemas graves. Vamos a optimizar lo que ya funciona.\n'}
**Acciones prioritarias (por impacto):**
1. **Corto plazo** (esta semana): Revisa los 3 gastos más altos y negocia un 5% de descuento con proveedores
2. **Medio plazo** (este mes): Implementa combos para subir ticket medio +1€
3. **Largo plazo** (trimestre): Analiza qué franjas horarias son más rentables y concentra riders ahí

**KPI objetivo para el próximo mes:**
• Margen: **>15%** (actual: ${context.margin.toFixed(1)}%)
• Ratio gastos: **<75%** (actual: ${(context.expenses / context.revenue * 100).toFixed(0)}%)

¿Empezamos por alguna acción concreta?`,
                suggestions: ['Reducir gastos top 3', 'Subir ticket medio', 'Optimizar horarios'],
                actions: []
            };
        }

        if (q.includes('impuesto') || q.includes('iva') || q.includes('fiscal') || q.includes('hacienda') || q.includes('modelo')) {
            const ivaEstimado = context.revenue * 0.21;
            return {
                content: `🏛️ **Estimación fiscal rápida**

📋 **IVA (Modelo 303):**
• IVA repercutido estimado: **${formatCurrency(ivaEstimado)}**
• IVA soportado (gastos deducibles): depende de facturas registradas
• Resultado trimestral estimado: consulta con tu contable

💡 **Consejo:** Reserva siempre el **21%** de tus ingresos para IVA. Actualmente eso serían **${formatCurrency(ivaEstimado)}**.

⚠️ Recuerda: esto es una estimación orientativa. Consulta siempre con un asesor fiscal profesional para las liquidaciones reales.

¿Quieres que te ayude con algún cálculo financiero?`,
                suggestions: ['Reserva fiscal recomendada', 'Gastos deducibles', 'Proyección trimestral'],
                actions: []
            };
        }

        return {
            content: `🤔 Entiendo tu pregunta sobre "${question}".

Basándome en tus datos actuales:
• Ingresos: **${formatCurrency(context.revenue)}**
• Beneficio: **${formatCurrency(context.netProfit)}**
• Margen: **${context.margin.toFixed(1)}%**
• Pedidos: **${context.orders}**

¿Podrías ser más específico? Puedo ayudarte con:

📊 Margen y rentabilidad
💰 Desglose y optimización de gastos  
📈 Proyecciones y escenarios
📉 Comparativas con meses anteriores
👥 Costes de personal y riders
🎫 Ticket medio y pricing
🏛️ Estimación fiscal

¿Qué te interesa más?`,
            suggestions: ['Análisis completo', 'Problemas detectados', 'Oportunidades de mejora'],
            actions: []
        };
    };

    const generateFollowUpSuggestions = (question: string, _context: any) => {
        const q = question.toLowerCase();

        if (q.includes('margen') || q.includes('beneficio')) {
            return ['¿Cómo subir mi margen?', '¿Qué gastos puedo reducir?', 'Proyección para mes que viene'];
        }
        if (q.includes('gasto') || q.includes('coste')) {
            return ['¿Dónde estoy gastando de más?', 'Comparar con mes pasado', 'Consejos para ahorrar'];
        }
        if (q.includes('proyección') || q.includes('mes') || q.includes('final')) {
            return ['Escenario optimista', '¿Qué pasa si subo precios?', '¿Necesito más riders?'];
        }
        if (q.includes('comparar') || q.includes('anterior')) {
            return ['¿Por qué cambió el margen?', 'Tendencia últimos 3 meses', 'Análisis de ingresos'];
        }
        if (q.includes('pedido') || q.includes('venta')) {
            return ['¿Cuántos pedidos necesito?', 'Análisis de ticket medio', 'Optimizar horarios'];
        }

        return ['¿Por qué bajó mi beneficio?', '¿Cómo puedo mejorar?', 'Proyección mensual'];
    };

    const quickQuestions = [
        { icon: BarChart3, text: 'Análisis completo', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: TrendingUp, text: '¿Cómo voy este mes?', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { icon: AlertCircle, text: '¿Hay algún problema?', color: 'text-amber-600', bg: 'bg-amber-50' },
        { icon: Target, text: 'Proyección fin de mes', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { icon: DollarSign, text: '¿Dónde gasto más?', color: 'text-rose-600', bg: 'bg-rose-50' },
        { icon: Lightbulb, text: 'Consejos de mejora', color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

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
            {/* Floating Button */}
            {/* Floating Button - SOLO en modo independiente (sin control externo desde header) */}
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
                        "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/30",
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
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Asesor Financiero IA</h3>
                                        <p className="text-xs text-white/80 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            Análisis en tiempo real
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
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    aria-label="Cerrar asesor financiero"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                                {[
                                    { id: 'health', label: 'Salud', icon: Heart },
                                    { id: 'chat', label: 'Chat', icon: MessageCircle },
                                    { id: 'insights', label: 'Insights', icon: Lightbulb },
                                    { id: 'actions', label: 'Acciones', icon: Zap }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'health' | 'chat' | 'insights' | 'actions')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                                            activeTab === tab.id
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-white/70 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content based on active tab */}
                        {activeTab === 'health' && (() => {
                            const margin = financialData.margin || 0;
                            const expRatio = financialData.revenue > 0 ? financialData.expenses / financialData.revenue : 0;
                            const trendVal = trendData && trendData.length > 1
                                ? ((financialData.revenue - (trendData[trendData.length - 2]?.revenue || 0)) / (trendData[trendData.length - 2]?.revenue || 1)) * 100
                                : 0;

                            // Score factors
                            const factors = [
                                {
                                    label: 'Margen de beneficio',
                                    value: `${margin.toFixed(1)}%`,
                                    score: margin >= 20 ? 100 : margin >= 15 ? 80 : margin >= 10 ? 60 : margin >= 5 ? 35 : 15,
                                    weight: '35%',
                                    benchmark: 'Ideal: >15%',
                                },
                                {
                                    label: 'Tendencia ingresos',
                                    value: `${trendVal > 0 ? '+' : ''}${trendVal.toFixed(1)}%`,
                                    score: trendVal > 10 ? 100 : trendVal > 5 ? 85 : trendVal > 0 ? 70 : trendVal > -5 ? 50 : 30,
                                    weight: '25%',
                                    benchmark: 'Ideal: >0%',
                                },
                                {
                                    label: 'Ratio gastos/ingresos',
                                    value: `${(expRatio * 100).toFixed(0)}%`,
                                    score: expRatio < 0.6 ? 100 : expRatio < 0.7 ? 85 : expRatio < 0.8 ? 65 : expRatio < 0.9 ? 40 : 15,
                                    weight: '20%',
                                    benchmark: 'Ideal: <70%',
                                },
                                {
                                    label: 'Reserva fiscal',
                                    value: formatCurrency(financialData.revenue * 0.21),
                                    score: 70, // Simplified — reserva is auto-calculated
                                    weight: '10%',
                                    benchmark: '21% IVA reservado',
                                },
                                {
                                    label: 'Beneficio neto',
                                    value: formatCurrency(financialData.netProfit || 0),
                                    score: (financialData.netProfit || 0) > 5000 ? 100 : (financialData.netProfit || 0) > 2000 ? 75 : (financialData.netProfit || 0) > 0 ? 50 : 10,
                                    weight: '10%',
                                    benchmark: 'Ideal: >3.000€',
                                },
                            ];

                            const totalScore = Math.round(
                                factors[0].score * 0.35 +
                                factors[1].score * 0.25 +
                                factors[2].score * 0.20 +
                                factors[3].score * 0.10 +
                                factors[4].score * 0.10
                            );

                            const getScoreAttributes = (s: number) => {
                                if (s >= 70) return { text: 'text-emerald-500', stroke: 'stroke-emerald-500', label: 'Saludable' };
                                if (s >= 45) return { text: 'text-amber-500', stroke: 'stroke-amber-500', label: 'Mejorable' };
                                return { text: 'text-rose-500', stroke: 'stroke-rose-500', label: 'En riesgo' };
                            };

                            const { text: scoreText, stroke: scoreStroke, label: scoreLabelText } = getScoreAttributes(totalScore);

                            return (
                                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                                    <div className="space-y-4">
                                        {/* Big Score */}
                                        <div className="text-center py-4">
                                            <div className="relative inline-flex items-center justify-center w-28 h-28">
                                                <svg width={112} height={112} className="transform -rotate-90">
                                                    <circle cx={56} cy={56} r={48} fill="none" stroke="#e2e8f0" strokeWidth={10} />
                                                    <circle
                                                        cx={56} cy={56} r={48} fill="none"
                                                        stroke="currentColor" strokeWidth={10}
                                                        strokeDasharray={2 * Math.PI * 48}
                                                        strokeDashoffset={2 * Math.PI * 48 * (1 - totalScore / 100)}
                                                        strokeLinecap="round"
                                                        className={cn("transition-all duration-1000 ease-out", scoreStroke)}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className={cn("text-3xl font-black tabular-nums", scoreText)}>{totalScore}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">/100</span>
                                                </div>
                                            </div>
                                            <p className={cn("mt-2 text-sm font-bold", scoreText)}>{scoreLabelText}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Score calculado con 5 factores ponderados</p>
                                        </div>

                                        {/* Factors Breakdown */}
                                        <div className="space-y-2">
                                            {factors.map((f, idx) => {
                                                const barColor = f.score >= 70 ? 'bg-emerald-500' : f.score >= 45 ? 'bg-amber-500' : 'bg-rose-500';
                                                return (
                                                    <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-xs font-bold text-slate-700">{f.label}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono font-bold text-slate-900">{f.value}</span>
                                                                <span className="text-[9px] text-slate-400">({f.weight})</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn('h-full rounded-full transition-all duration-700', barColor)}
                                                                style={{ width: `${f.score}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-1">{f.benchmark}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* CTA to chat */}
                                        <button
                                            onClick={() => setActiveTab('chat')}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Pregúntale al Asesor
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {activeTab === 'chat' && (
                            <>
                                {/* Quick Questions */}
                                <div className="p-3 bg-slate-50 border-b border-slate-200">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold flex items-center gap-1">
                                        <Lightbulb className="w-3 h-3" />
                                        Preguntas Rápidas
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {quickQuestions.map((q, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setInputValue(q.text);
                                                    handleSendMessage();
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap border",
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
                                                message.type === 'user' ? "bg-indigo-100" : "bg-gradient-to-br from-indigo-500 to-purple-500"
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
                                                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
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
                                                                onClick={() => {
                                                                    setInputValue(suggestion);
                                                                    handleSendMessage();
                                                                }}
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
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Pregúntame sobre tus finanzas..."
                                            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!inputValue.trim() || isLoading}
                                            aria-label="Enviar mensaje"
                                            className={cn(
                                                "p-2.5 rounded-xl transition-all",
                                                inputValue.trim() && !isLoading
                                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                            )}
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                                        Tu asesor analiza datos en tiempo real • Respuestas impulsadas por IA
                                    </p>
                                </div>
                            </>
                        )}

                        {activeTab === 'insights' && (
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-amber-500" />
                                            Insights Detectados
                                        </h4>
                                        <span className="text-xs text-slate-500">{insights.length} hallazgos</span>
                                    </div>

                                    {insights.map((insight, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all hover:shadow-md",
                                                getInsightBg(insight.type)
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                {getInsightIcon(insight.type)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h5 className="font-bold text-sm text-slate-800">{insight.title}</h5>
                                                        {insight.metric && (
                                                            <span className="text-xs font-bold text-slate-700 bg-white/50 px-2 py-0.5 rounded">
                                                                {insight.metric}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        {insight.description}
                                                    </p>
                                                    {insight.trend !== undefined && (
                                                        <div className={cn(
                                                            "mt-2 text-xs font-medium flex items-center gap-1",
                                                            insight.trend > 0 ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {insight.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            {insight.trend > 0 ? '+' : ''}{insight.trend.toFixed(1)}% vs mes anterior
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {insights.length === 0 && (
                                        <div className="text-center py-8 text-slate-400">
                                            <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Analizando tus datos...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'actions' && (
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-indigo-500" />
                                        Acciones Recomendadas
                                    </h4>

                                    {[
                                        {
                                            title: 'Abrir Simulador',
                                            desc: 'Prueba diferentes escenarios sin riesgo',
                                            icon: PlayCircle,
                                            color: 'amber',
                                            action: onOpenSimulator
                                        },
                                        {
                                            title: 'Análisis de Gastos',
                                            desc: 'Ver desglose detallado de costes',
                                            icon: PieChart,
                                            color: 'rose',
                                            action: () => {
                                                setActiveTab('chat');
                                                setInputValue('¿Dónde gasto más?');
                                                handleSendMessage();
                                            }
                                        },
                                        {
                                            title: 'Proyección Mensual',
                                            desc: 'Ver estimación fin de mes',
                                            icon: Calendar,
                                            color: 'indigo',
                                            action: () => {
                                                setActiveTab('chat');
                                                setInputValue('Proyección fin de mes');
                                                handleSendMessage();
                                            }
                                        },
                                        {
                                            title: 'Comparar con Anterior',
                                            desc: 'Ver evolución respecto mes pasado',
                                            icon: TrendingUp,
                                            color: 'emerald',
                                            action: () => {
                                                setActiveTab('chat');
                                                setInputValue('Comparar con mes anterior');
                                                handleSendMessage();
                                            }
                                        }
                                    ].map((action, idx) => (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={action.action}
                                            className={cn(
                                                "w-full p-4 rounded-xl border transition-all hover:shadow-md text-left group",
                                                `bg-${action.color}-50 border-${action.color}-200 hover:border-${action.color}-300`
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                                    `bg-${action.color}-100`
                                                )}>
                                                    <action.icon className={cn("w-5 h-5", `text-${action.color}-600`)} />
                                                </div>
                                                <div className="flex-1">
                                                    <h5 className={cn("font-bold text-sm", `text-${action.color}-800`)}>
                                                        {action.title}
                                                    </h5>
                                                    <p className={cn("text-xs", `text-${action.color}-600`)}>
                                                        {action.desc}
                                                    </p>
                                                </div>
                                                <ArrowRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", `text-${action.color}-600`)} />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FinanceAdvisorChat;
