// src/features/rider/advisor/RiderAdvisorView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { sendRiderMessage, ChatTurn, RiderChatContext } from '../../../lib/gemini';
import { supportService } from '../../support/SupportService';

interface DisplayMessage {
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_SUGGESTIONS = [
  '¿Cuándo trabajo esta semana?',
  '¿Qué hago si tengo un accidente?',
  'Tengo un problema con la app',
];

export const RiderAdvisorView: React.FC = () => {
  const { user } = useAuth();
  const { myShifts } = useRiderStore();
  const riderName = user?.displayName?.split(' ')[0] ?? 'Rider';

  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: 'assistant', text: '¡Hola! 👋 Soy tu asesor virtual. Pregúntame lo que necesites.' },
  ]);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestTicket, setSuggestTicket] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getRiderContext = (): RiderChatContext => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const upcomingShifts = myShifts
      .filter(s => new Date(s.startAt) >= now && new Date(s.startAt) <= weekEnd)
      .slice(0, 5)
      .map(s => {
        const start = new Date(s.startAt);
        return {
          date: start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
          startHour: start.getHours(),
          duration: Math.round((new Date(s.endAt).getTime() - start.getTime()) / 3600000),
        };
      });

    return { riderName, upcomingShifts };
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setHasStarted(true);
    setInput('');
    setSuggestTicket(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    const { text: reply, suggestTicket: ticket, updatedHistory } = await sendRiderMessage(
      text,
      getRiderContext(),
      chatHistory
    );

    setChatHistory(updatedHistory);
    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    setSuggestTicket(ticket);
    setLoading(false);
  };

  const handleCreateTicket = async () => {
    if (!user) return;
    const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
    const subject = `[Chat Rider] ${lastUserMsg?.parts[0]?.text?.slice(0, 60) ?? 'Problema técnico'}`;
    const body = chatHistory
      .map(m => `${m.role === 'user' ? riderName : 'Asesor'}: ${m.parts[0]?.text}`)
      .join('\n');

    try {
      await supportService.createTicket({
        userId: user.uid,
        franchiseId: user.franchiseId ?? '',
        franchiseName: '',
        subject,
        message: body,
        priority: 'normal',
        category: 'technical',
      });
      setSuggestTicket(false);
      toast.success('Ticket creado. Te responderemos pronto.');
    } catch {
      toast.error('No se pudo crear el ticket. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-700 to-orange-900 rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base">Hola, {riderName} 👋</h2>
            <p className="text-orange-200 text-xs">Pregúntame lo que necesites</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-orange-500 text-white rounded-br-none'
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce ${
                      i === 1 ? 'animation-delay-75' : i === 2 ? 'animation-delay-150' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {suggestTicket && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleCreateTicket}
              className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              <Ticket className="w-4 h-4" />
              Crear ticket de soporte
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {!hasStarted && (
        <div className="flex flex-col gap-2 mb-3">
          {QUICK_SUGGESTIONS.map(s => (
            <button key={s} type="button" onClick={() => handleSend(s)}
              className="text-left rounded-xl border border-orange-200 text-orange-700 bg-orange-50 px-4 py-2.5 text-sm hover:bg-orange-100 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu pregunta aquí..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-400"
        />
        <button
          type="submit"
          aria-label="Enviar mensaje"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
};

export default RiderAdvisorView;
