import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
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
    };
    trendData?: any[];
    month: string;
}

const FinanceAdvisorChat: React.FC<FinanceAdvisorChatProps> = ({
    financialData,
    trendData,
    month: _month
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnreadInsights, setHasUnreadInsights] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user: _user } = useAuth();

    // Initial greeting with context
    useEffect(() => {
        if (messages.length === 0 && financialData) {
            const initialMessage = generateInitialInsight(financialData);
            setMessages([{
                id: 'welcome',
                type: 'assistant',
                content: initialMessage,
                timestamp: new Date(),
                suggestions: [
                    '¿Por qué bajó mi beneficio?',
                    '¿Cómo puedo mejorar mi margen?',
                    '¿Estoy gastando demasiado?',
                    'Explícame mis números'
                ]
            }]);
        }
    }, [financialData]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const generateInitialInsight = (data: any) => {
        const margin = data.margin || 0;
        const profit = data.netProfit || 0;
        
        if (margin < 5) {
            return `👋 ¡Hola! Veo que tu margen este mes es del **${margin.toFixed(1)}%**, lo cual está por debajo del óptimo. No te preocupes, estoy aquí para ayudarte a identificar por qué y qué puedes hacer. ¿Qué te gustaría revisar primero?`;
        } else if (margin > 20) {
            return `🎉 ¡Excelentes noticias! Tu margen de **${margin.toFixed(1)}%** está muy por encima de la media. Estás haciendo un gran trabajo gestionando tu franquicia. ¿Te gustaría saber qué está funcionando especialmente bien?`;
        } else {
            return `👋 ¡Hola! Este mes llevas un margen del **${margin.toFixed(1)}%** con un beneficio de **${formatCurrency(profit)}**. Estoy aquí para ayudarte a entender tus números y encontrar oportunidades de mejora. ¿En qué puedo ayudarte?`;
        }
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
            // Call Gemini AI with financial context
            const response = await generateAIResponse(inputValue, financialData, trendData || [], messages);
            
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: response.content,
                timestamp: new Date(),
                suggestions: response.suggestions
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
        // Prepare context for AI
        const context = {
            month: data.month,
            revenue: data.revenue,
            expenses: data.expenses,
            netProfit: data.netProfit,
            margin: data.margin,
            orders: data.orders,
            breakdown: data.breakdown,
            metrics: data.metrics,
            trends: trends?.slice(-3) || []
        };

        const prompt = `Eres un asesor financiero experto y empático para franquicias de delivery. 

DATOS FINANCIEROS ACTUALES (${context.month}):
- Ingresos: €${context.revenue?.toFixed(2)}
- Gastos: €${context.expenses?.toFixed(2)}
- Beneficio Neto: €${context.netProfit?.toFixed(2)}
- Margen: ${context.margin?.toFixed(1)}%
- Pedidos: ${context.orders}

Desglose de gastos:
${JSON.stringify(context.breakdown, null, 2)}

Métricas clave:
${JSON.stringify(context.metrics, null, 2)}

TENDENCIAS (últimos 3 meses):
${JSON.stringify(context.trends, null, 2)}

PREGUNTA DEL USUARIO: "${question}"

INSTRUCCIONES:
1. Responde en español de forma conversacional y empática
2. Usa markdown para destacar números importantes (negritas)
3. Sé específico con los datos proporcionados
4. Ofrece consejos prácticos y accionables
5. Mantén un tono profesional pero cercano
6. Si detectas problemas, explica por qué ocurren y cómo solucionarlos
7. Si hay buenas noticias, celebra los logros
8. Máximo 3-4 párrafos para ser conciso

RESPUESTA:`;

        try {
            // Use the existing Gemini API integration
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

            // Generate contextual suggestions based on the conversation
            const suggestions = generateFollowUpSuggestions(question, context);

            return {
                content: text,
                suggestions
            };
        } catch (error) {
            // Fallback to local logic if API fails
            return generateLocalResponse(question, context);
        }
    };

    const generateLocalResponse = (question: string, context: any) => {
        const q = question.toLowerCase();
        
        if (q.includes('margen') || q.includes('beneficio')) {
            return {
                content: `Tu margen actual es del **${context.margin.toFixed(1)}%**. ${context.margin < 10 
                    ? 'Está por debajo del óptimo (15-20%). Recomiendo revisar tus gastos fijos, especialmente si hay alguno que haya subido recientemente.' 
                    : '¡Excelente! Estás dentro del rango saludable. Mantén el control de tus costes variables para seguir así.'}`,
                suggestions: ['¿Cómo subir mi margen?', '¿Qué gastos puedo reducir?', 'Comparar con mes anterior']
            };
        }
        
        if (q.includes('gasto') || q.includes('gastar') || q.includes('coste')) {
            return {
                content: `Tus gastos totales son **${formatCurrency(context.expenses)}**. El desglose muestra que tus mayores costes son: ${Object.entries(context.breakdown || {})
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([key, value]: [string, any]) => `${key}: ${formatCurrency(value)}`)
                    .join(', ')}.`,
                suggestions: ['¿Dónde estoy gastando de más?', 'Comparar gastos con mes pasado', 'Consejos para reducir costes']
            };
        }

        return {
            content: `Entiendo tu pregunta sobre "${question}". Basándome en tus datos de ${context.month}, tienes un beneficio de **${formatCurrency(context.netProfit)}** con **${context.orders}** pedidos. ¿Te gustaría que profundizáramos en algún aspecto específico de tus finanzas?`,
            suggestions: ['Análisis completo', 'Problemas detectados', 'Oportunidades de mejora']
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
        if (q.includes('pedido') || q.includes('venta')) {
            return ['¿Cuántos pedidos necesito para mi objetivo?', 'Análisis de ticket medio', 'Comparar con otros meses'];
        }
        
        return ['¿Por qué bajó mi beneficio?', '¿Cómo puedo mejorar?', 'Proyección mensual'];
    };

    const quickQuestions = [
        { icon: TrendingUp, text: '¿Cómo voy este mes?', color: 'text-emerald-600' },
        { icon: AlertCircle, text: '¿Hay algún problema?', color: 'text-amber-600' },
        { icon: Lightbulb, text: '¿Qué puedo mejorar?', color: 'text-indigo-600' },
    ];

    if (!financialData) return null;

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setIsOpen(true);
                    setHasUnreadInsights(false);
                }}
                className={cn(
                    "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all",
                    "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30",
                    isOpen && "hidden"
                )}
            >
                <Bot className="w-5 h-5" />
                <span className="font-medium text-sm">Tu Asesor</span>
                {hasUnreadInsights && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                        1
                    </span>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Asesor Financiero</h3>
                                    <p className="text-xs text-white/70 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        IA Avanzada
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Quick Questions */}
                        <div className="p-3 bg-slate-50 border-b border-slate-200">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">
                                Preguntas Rápidas
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {quickQuestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setInputValue(q.text);
                                            handleSendMessage();
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all whitespace-nowrap"
                                    >
                                        <q.icon className={cn("w-3.5 h-3.5", q.color)} />
                                        {q.text}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
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
                                        "max-w-[80%] p-3 rounded-2xl text-sm",
                                        message.type === 'user' 
                                            ? "bg-indigo-600 text-white rounded-tr-sm" 
                                            : "bg-white border border-slate-200 rounded-tl-sm shadow-sm"
                                    )}>
                                        <div 
                                            className="prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{
                                                __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
                                            }}
                                        />
                                        
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
                                                        className="block w-full text-left text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1.5 rounded transition-colors"
                                                    >
                                                        → {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                    placeholder="Escribe tu pregunta sobre tus finanzas..."
                                    className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
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
                                Tu asesor analiza tus datos en tiempo real
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FinanceAdvisorChat;
