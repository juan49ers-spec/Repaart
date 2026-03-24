import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { validateWeeklySchedule } from '../../../lib/gemini';

interface ShiftCoverageInsightProps {
  shifts: { startAt: string; endAt: string; riderName?: string }[];
}

type CoverageResult = {
  score: number;
  status: 'optimal' | 'warning' | 'critical';
  feedback: string;
  missingCoverage: string[];
};

const STATUS_STYLES: Record<
  'optimal' | 'warning' | 'critical',
  { border: string; bg: string; iconComponent: React.ElementType; iconClass: string; badge: string }
> = {
  optimal: {
    border: 'border-l-green-400',
    bg: 'bg-green-50',
    iconComponent: CheckCircle,
    iconClass: 'w-4 h-4 text-green-600',
    badge: 'text-green-700',
  },
  warning: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-50',
    iconComponent: AlertTriangle,
    iconClass: 'w-4 h-4 text-amber-600',
    badge: 'text-amber-700',
  },
  critical: {
    border: 'border-l-red-400',
    bg: 'bg-red-50',
    iconComponent: AlertCircle,
    iconClass: 'w-4 h-4 text-red-600',
    badge: 'text-red-700',
  },
};

export const ShiftCoverageInsight: React.FC<ShiftCoverageInsightProps> = ({ shifts }) => {
  const [result, setResult] = useState<CoverageResult | null | 'loading'>(
    shifts.length > 0 ? 'loading' : null
  );

  useEffect(() => {
    let cancelled = false;
    if (shifts.length === 0) {
      // Use a microtask to avoid synchronous setState inside the effect body
      Promise.resolve().then(() => { if (!cancelled) setResult(null); });
      return () => { cancelled = true; };
    }
    Promise.resolve().then(() => { if (!cancelled) setResult('loading'); });
    validateWeeklySchedule(shifts)
      .then(r => { if (!cancelled) setResult(r); })
      .catch(() => { if (!cancelled) setResult(null); });
    return () => { cancelled = true; };
  }, [shifts]);

  if (!result) return null;

  if (result === 'loading') {
    return (
      <div data-testid="coverage-skeleton" className="mt-4 mx-4 h-16 rounded-xl bg-slate-100 animate-pulse" />
    );
  }

  const styles = STATUS_STYLES[result.status];
  const StatusIcon = styles.iconComponent;

  return (
    <div className={`mt-4 mx-4 rounded-xl border border-slate-200 border-l-4 ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-slate-400" />
          <StatusIcon className={styles.iconClass} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.badge}`}>{result.feedback}</p>
          {result.missingCoverage.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {result.missingCoverage.map((item, i) => (
                <li key={i} className="text-xs text-slate-600 list-disc list-inside">{item}</li>
              ))}
            </ul>
          )}
        </div>
        <span className={`text-xs font-bold shrink-0 ${styles.badge}`}>{result.score}/100</span>
      </div>
    </div>
  );
};
