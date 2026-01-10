import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { sendMessageToGemini } from '../../lib/gemini';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface ChatAssistantProps {
    contextData: any;
    isOpen?: boolean;
    onClose?: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ contextData, isOpen, onClose }) => {
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: '¡Hola! Soy REPAART AI. Conozco toda la app y el manual operativo. ¿En qué te ayudo?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatContextData = (data: any) => {
        if (!data) return "Sin datos financieros cargados.";
        // Simplified metric summary
        return `Ingresos: ${data.revenue || 0}€, Pedidos: ${data.orders || 0}`;
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Context Injection
            const currentRoute = location.pathname;
            const financialContext = formatContextData(contextData);

            // We prepend context to the message so the AI knows where the user is
            // but we don't show this technical prefix to the user in the UI
            const promptWithContext = `
            [CONTEXTO ACTUAL]
            - Ruta: ${currentRoute}
            - Datos Rapidos: ${financialContext}
            
            [MENSAJE USUARIO]
            ${userMsg}
            `;

            const response = await sendMessageToGemini(promptWithContext);
            setMessages(prev => [...prev, { role: 'model', text: response }]);

        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, he tenido un problema de conexión.' }]);
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
                            title={isExpanded ? "Minimizar" : "Maximizar"}
                            aria-label={isExpanded ? "Minimizar chat" : "Maximizar chat"}
                        >
                            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => onClose && onClose()}
                            className="p-1 hover:bg-red-500/80 rounded transition"
                            title="Cerrar chat"
                            aria-label="Cerrar chat"
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
                        title="Enviar mensaje"
                        aria-label="Enviar mensaje"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </>
    );
};

export default ChatAssistant;
