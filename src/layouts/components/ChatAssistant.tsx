import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';


// --- SOLF SYSTEM PROMPT (Context from "Yesterday") ---
const SYSTEM_PROMPT = `
# [ROL Y OBJETIVO]
Eres "Asistente Repaart", un especialista de soporte al cliente virtual. Tu misión principal es ayudar a los usuarios a resolver sus dudas sobre los servicios de la empresa de reparto "Repaart" de manera amable, eficiente y precisa. Tu conocimiento se basa *exclusivamente* en la documentación proporcionada. Tu tono debe ser siempre servicial, paciente y orientado a encontrar una solución.

# [CONTEXTO]
La única fuente de verdad para tus respuestas es la documentación que se te ha proporcionado sobre los procedimientos, políticas, áreas de servicio y funcionamiento de "Repaart". No debes inventar información, hacer suposiciones ni utilizar conocimiento externo a estos documentos. El objetivo es proporcionar confianza y claridad al usuario.

# [INSTRUCCIONES DE OPERACIÓN PASO A PASO]
Sigue este proceso de manera estricta en cada interacción:

1.  **Recepción y Análisis:** Saluda amablemente al usuario y analiza su pregunta para entender su necesidad principal.

2.  **Búsqueda en Documentación:** Consulta *únicamente* la documentación proporcionada para encontrar la información relevante que responda a la consulta del usuario. (Nota: En esta implementación, "documentación" se refiere a los datos financieros y de contexto que se te inyectan dinámicamente).

3.  **Respuesta Inicial Breve:** Proporciona una respuesta inicial que sea corta, directa y clara a la pregunta del usuario.

4.  **Evaluación y Solicitud de Detalles:**
    * Si la respuesta inicial resuelve completamente la duda, finaliza la interacción de forma cordial.
    * Si la documentación contiene información más detallada que podría ser útil pero requiere más contexto del usuario (como un número de pedido, una dirección, o un tipo de incidencia), pregunta de forma proactiva por esos detalles. Explica por qué necesitas esa información.

5.  **Manejo de Incertidumbre (Fallback):**
    * Si después de buscar en la documentación no encuentras una respuesta clara o la consulta es demasiado específica o sensible (e.g., quejas graves, problemas de seguridad), NO intentes adivinar.
    * En su lugar, utiliza la siguiente respuesta estandarizada: "No he encontrado una respuesta clara en mi documentación para tu consulta. Para asegurar que recibes la información correcta y el mejor soporte posible, te recomiendo contactar directamente con nuestro equipo de soporte humano. Ellos podrán ayudarte en detalle."

# [RESTRICCIONES]
- **NO** utilices información externa a la documentación proporcionada.
- **NO** inventes respuestas ni procedimientos.
- **SIEMPRE** mantén un tono amable y solucionador.
- **SIEMPRE** sigue el flujo de "respuesta corta -> pedir detalles si es necesario".
- **NUNCA** prometas soluciones que no estén explícitamente descritas en la documentación.
`;

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface ChatAssistantProps {
    contextData: any; // We can improve this type later if we know the shape of financial data
    isOpen?: boolean;
    onClose?: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ contextData, isOpen, onClose }) => {
    // const [isOpen, setIsOpen] = useState(false); // Controlled by parent
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: '¡Hola! Soy el asistente inteligente de SOLF. ¿En qué puedo ayudarte hoy con tu operativa?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Gemini
    // eslint-disable-next-line
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_KEY || '');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatContextData = (data: any) => {
        if (!data) return "No hay datos financieros cargados actualmente.";

        try {
            return `
DATOS ACTUALES DEL NEGOCIO (Presupuesto/Real):
- Ingresos Totales: ${data.revenue ? data.revenue.toFixed(2) : '0'} €
- Beneficio Neto (Estimado): ${data.taxes?.netProfitPostTax ? data.taxes.netProfitPostTax.toFixed(2) : '0'} €
- Gastos Totales: ${data.expenses ? data.expenses.toFixed(2) : '0'} €
- Pedidos Totales: ${data.orders || '0'}
- Margen de Seguridad: ${data.metrics?.safetyMargin ? data.metrics.safetyMargin.toFixed(1) : '0'}%
- Punto de Equilibrio: ${data.metrics?.breakEvenOrders || '0'} pedidos
- Coste por Km: ${data.metrics?.costPerKm ? data.metrics.costPerKm.toFixed(3) : '0'} €/km
- Ticket Medio: ${data.metrics?.avgTicket ? data.metrics.avgTicket.toFixed(2) : '0'} €
            `.trim();
        } catch {
            return "Error al leer datos financieros.";
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Check for missing key
            if (!import.meta.env.VITE_GOOGLE_AI_KEY) {
                throw new Error("Falta la API Key de Gemini (VITE_GOOGLE_AI_KEY) en .env");
            }

            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // Build history for context
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            // Prepare System Context with Data
            const currentContext = formatContextData(contextData);
            const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${currentContext}\n\nINSTRUCCION: Usa estos datos reales para responder si el usuario pregunta por métricas.`;

            // Chat Session
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: fullSystemPrompt }] },
                    { role: 'model', parts: [{ text: "Entendido. Tengo acceso a tus métricas financieras actualizadas y responderé basándome en ellas." }] },
                    ...history
                ],
                // @ts-ignore - maxOutputTokens is valid but sometimes types lag
                generationConfig: {
                    maxOutputTokens: 500,
                },
            });

            const result = await chat.sendMessage(userMsg);
            const response = result.response.text();

            setMessages(prev => [...prev, { role: 'model', text: response }]);

        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message || 'No pude conectar con el cerebro de IA.'}` }]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-open greeting once
    useEffect(() => {
        const timer = setTimeout(() => {
            // Optional: Auto open specific logic
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Draggable Logic (Desktop only)
    const [position, setPosition] = useState({ bottom: 24, right: 24 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (window.innerWidth < 768) return; // Disable drag on mobile (sheet mode)
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newRight = window.innerWidth - e.clientX - dragOffset.x;
        const newBottom = window.innerHeight - e.clientY - dragOffset.y;
        setPosition({
            right: Math.max(10, Math.min(window.innerWidth - 60, newRight)),
            bottom: Math.max(10, Math.min(window.innerHeight - 60, newBottom))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    // If closed, render nothing (controlled by parent)
    if (!isOpen) return null;

    return (
        <>
            {/* Mobile Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm animate-fade-in" onClick={() => onClose && onClose()} />

            {/* Chat Window */}
            <div
                style={{
                    bottom: window.innerWidth >= 768 ? `${position.bottom}px` : '0',
                    right: window.innerWidth >= 768 ? `${position.right}px` : '0',
                    left: window.innerWidth >= 768 ? 'auto' : '0'
                }}
                className={`fixed bg-white z-[70] flex flex-col overflow-hidden transition-all duration-300 shadow-2xl border-blue-100
                    md:rounded-2xl md:border
                    ${window.innerWidth < 768
                        ? 'min-h-[85vh] max-h-[85vh] rounded-t-[32px] animate-slide-up-mobile safe-bottom'
                        : `animate-fade-in-up ${isExpanded ? 'w-[600px] h-[70vh]' : 'w-80 h-96'}`
                    }
                `}
            >
                {/* Header with Drag Handler */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`bg-gradient-to-r from-slate-800 to-slate-900 p-4 md:p-3 flex justify-between items-center text-white shrink-0 ${window.innerWidth >= 768 ? 'cursor-move' : ''}`}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xs tracking-wide">SOLF AI</h3>
                            <p className="text-[9px] text-blue-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-white/10 rounded transition"
                        >
                            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => onClose && onClose()}
                            className="p-1 hover:bg-red-500/80 rounded transition"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                    {messages.map((m, idx) => (
                        <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl p-2.5 text-xs shadow-sm ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                                }`}>
                                {m.role === 'model' && (
                                    <p className="text-[9px] font-bold text-blue-500 mb-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> AI
                                    </p>
                                )}
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {m.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none p-3 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75" />
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta algo..."
                        className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className={`p-2 rounded-lg bg-blue-600 text-white shadow-sm transition-all ${(!input.trim() || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-95'
                            }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </>
    );
};

export default ChatAssistant;
