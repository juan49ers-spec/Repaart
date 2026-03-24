import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { suggestSupportSolution } from '../../../../lib/gemini';

interface TicketSolutionSuggestionProps {
  subject: string;
  description: string;
  onResolved: () => void;
}

export const TicketSolutionSuggestion: React.FC<TicketSolutionSuggestionProps> = ({
  subject,
  description,
  onResolved,
}) => {
  const [suggestion, setSuggestion] = useState<{ text: string; confidence: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (description.length < 20) {
        setSuggestion(null);
        return;
      }
      const result = await suggestSupportSolution(subject || 'Consulta General', description);
      if (result?.isSolvable) {
        setSuggestion({ text: result.suggestion, confidence: result.confidence });
      } else {
        setSuggestion(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [subject, description]);

  if (!suggestion) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-3 shadow-sm">
      <div className="p-2 bg-white rounded-lg shadow-sm shrink-0 h-fit">
        <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="text-xs font-bold text-emerald-800 mb-1">
            💡 Posible solución
          </h4>
          <span className="text-[10px] text-emerald-600 font-semibold">{suggestion.confidence}% confianza</span>
        </div>
        <p className="text-xs text-emerald-700">{suggestion.text}</p>
        <button
          type="button"
          onClick={onResolved}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Marcar como resuelto
        </button>
      </div>
    </div>
  );
};
