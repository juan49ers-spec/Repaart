import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, AlertCircle, Lightbulb, X, Bot } from 'lucide-react';
import { DashboardAlert, DashboardAlertContext } from '../../../../lib/gemini';

interface DashboardAlertBannerProps {
  franchiseId: string;
  financialData: DashboardAlertContext['financial'] | null;
  shiftsData: DashboardAlertContext['shifts'] | null;
  ridersData: DashboardAlertContext['riders'] | null;
  alertData: DashboardAlert | null | 'loading';
  onOpenAdvisor?: () => void;
}

const TYPE_CONFIG = {
  positive: { bg: 'bg-green-50', border: 'border-green-400', icon: TrendingUp, iconColor: 'text-green-600' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-400', icon: AlertTriangle, iconColor: 'text-amber-600' },
  critical: { bg: 'bg-red-50',   border: 'border-red-400',   icon: AlertCircle,   iconColor: 'text-red-600'   },
  info:     { bg: 'bg-blue-50',  border: 'border-blue-400',  icon: Lightbulb,     iconColor: 'text-blue-600'  },
} as const;

export const DashboardAlertBanner: React.FC<DashboardAlertBannerProps> = ({
  alertData, onOpenAdvisor,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alertData === null) return null;

  if (alertData === 'loading') {
    return <div data-testid="alert-skeleton" className="mx-4 mb-4 h-16 rounded-xl bg-slate-100 animate-pulse" />;
  }

  const { bg, border, icon: Icon, iconColor } = TYPE_CONFIG[alertData.type];

  return (
    <div className={`mx-4 mb-4 flex items-start gap-3 rounded-xl border-l-4 p-4 ${bg} ${border}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{alertData.title}</p>
        <p className="text-slate-600 text-sm mt-0.5">{alertData.message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onOpenAdvisor && (
          <button
            onClick={onOpenAdvisor}
            className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Bot className="h-3.5 w-3.5" />
            Hablar con el asesor
          </button>
        )}
        <button onClick={() => setDismissed(true)} title="Descartar" className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DashboardAlertBanner;
