import { type FC } from 'react';
import { AlertCircle, AlertTriangle, Info, type LucideIcon } from 'lucide-react';

type AlertLevel = 'high' | 'warning' | 'med';

interface Alert {
    level: AlertLevel;
    type: string;
    message: string;
    timestamp?: Date;
}

interface AlertItemProps {
    alert: Alert;
}

interface AlertStyle {
    bg: string;
    border: string;
    text: string;
    icon: LucideIcon;
    iconColor: string;
}

const alertConfig: Record<AlertLevel, AlertStyle> = {
    high: {
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        text: 'text-rose-800',
        icon: AlertCircle,
        iconColor: 'text-rose-500'
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: 'text-amber-800',
        icon: AlertTriangle,
        iconColor: 'text-amber-500'
    },
    med: { // 'med' mapped to info/blue for now or similar to warning
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'text-blue-800',
        icon: Info,
        iconColor: 'text-blue-500'
    }
};

const AlertItem: FC<AlertItemProps> = ({ alert }) => {
    const config = alertConfig[alert.level] || alertConfig.med;
    const Icon = config.icon;

    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${config.bg} ${config.border} animate-in slide-in-from-right-2 duration-300`}>
            <div className={`mt-0.5 ${config.iconColor}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className={`text-sm font-bold ${config.text}`}>
                    {alert.type === 'support_bottleneck' && 'Sobrecarga de Soporte'}
                    {alert.type === 'high_traffic_low_conversion' && 'Tráfico Sospechoso'}
                    {/* Add more mappings as needed, fallback to raw type if necessary */}
                    {!['support_bottleneck', 'high_traffic_low_conversion'].includes(alert.type) && alert.type}
                </p>
                <p className={`text-xs ${config.text} opacity-80 mt-0.5`}>
                    {alert.message}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                    Detectado: {alert.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
};

export default AlertItem;
