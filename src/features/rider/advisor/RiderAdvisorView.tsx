import React, { useState, useRef, useEffect } from 'react';
import { Send, Ticket, Sparkles, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { sendRiderMessage, ChatTurn, RiderChatContext } from '../../../lib/gemini';
import { supportService } from '../../support/SupportService';
import { advisorHistoryService, AdvisorMessage } from '../../../services/advisorHistoryService';
import { cn } from '../../../lib/utils';

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
    { role: 'assistant', text: '¡Hola! 👋 Soy tu Asesor Avanzado. Estoy conectado a la base de datos de tu flota. Pregúntame lo que necesites.' },
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

  useEffect(() => {
    if (!user?.uid) return;
    advisorHistoryService.load(user.uid, 'rider')
      .then(history => {
        const turns: ChatTurn[] = history
          .slice(-20)
          .map(m => ({ role: m.role, parts: [{ text: m.text }] }));
        setChatHistory(turns);
      })
      .catch(() => {}); // silent fail
  }, [user?.uid]);

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

    if (user?.uid) {
      const now = new Date().toISOString();
      const toSave: AdvisorMessage[] = [
        { role: 'user', text, timestamp: now },
        { role: 'model', text: reply, timestamp: now },
      ];
      advisorHistoryService.append(user.uid, 'rider', toSave).catch(() => {});
    }
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
    <div className="flex flex-col h-full min-h-[calc(100vh-10rem)] relative pb-4">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-gradient-to-br from-emerald-500/5 via-indigo-500/5 to-purple-500/5 rounded-full blur-3xl animate-orb" />
          <div className="absolute bottom-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-tl from-indigo-500/5 via-fuchsia-500/5 to-rose-500/5 rounded-full blur-2xl" />
      </div>



      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-6 px-1 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={cn(
                "max-w-[85%] px-5 py-3.5 text-sm font-medium transition-all",
                m.role === 'user'
                  ? "bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-[1.5rem] rounded-br-[0.25rem] shadow-lg shadow-indigo-500/20 glow-sm"
                  : "glass-premium-v2 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-[1.5rem] rounded-bl-[0.25rem] shadow-sm backdrop-blur-xl"
            )}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-slide-up">
            <div className="glass-premium-v2 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] rounded-bl-[0.25rem] px-5 py-4 shadow-sm backdrop-blur-xl">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className={`w-2 h-2 bg-indigo-500/50 rounded-full animate-bounce ${
                      i === 1 ? 'animation-delay-75' : i === 2 ? 'animation-delay-150' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {suggestTicket && (
          <div className="flex justify-start animate-slide-up">
            <button
              type="button"
              onClick={handleCreateTicket}
              className="group flex flex-col items-start gap-1 glass-premium-v2 rounded-[1.5rem] p-4 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-300 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-all mb-2">
                <Ticket size={20} className="text-rose-500" />
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-rose-500 transition-colors">
                  CREAR TICKET
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Notificar al equipo de soporte
              </span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {!hasStarted && (
        <div className="flex flex-col gap-2 mb-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Navigation size={14} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                SUGERENCIAS RÁPIDAS
            </span>
          </div>
          {QUICK_SUGGESTIONS.map(s => (
            <button key={s} type="button" onClick={() => handleSend(s)}
              className="group text-left w-full glass-premium-v2 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-[1.5rem] hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles size={14} className="text-indigo-500" />
                 </div>
                 {s}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="relative flex items-center gap-2 mt-auto">
        <div className="relative flex-1 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pregúntale a Cockpit AI..."
            className="w-full relative glass-premium-v2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-white/10 rounded-[1.25rem] pl-5 pr-14 py-4 text-sm font-medium focus:outline-none text-slate-900 dark:text-white placeholder-slate-400/70 transition-all shadow-sm"
            />
            <button
            type="submit"
            aria-label="Enviar mensaje"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md disabled:opacity-50 disabled:grayscale transition-all duration-300 hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
            <Send className="w-4 h-4 ml-0.5" aria-hidden="true" />
            </button>
        </div>
      </form>
    </div>
  );
};

export default RiderAdvisorView;
