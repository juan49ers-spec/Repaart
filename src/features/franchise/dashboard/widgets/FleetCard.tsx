import { type FC } from 'react';
import { type LucideIcon } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import { Card } from '../../../../components/ui/primitives/Card';

type AlertLevel = 'neutral' | 'good' | 'warning' | 'bad';

interface FleetCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon?: LucideIcon;
    alertLevel?: AlertLevel;
    tooltip?: string;
}

const FleetCard: FC<FleetCardProps> = ({
    title,
    value,
    subtext,
    icon: Icon,
    alertLevel = 'neutral',
    tooltip
}) => {
    let colorClass = "text-gray-900";
    // bg-white is default in Card

    if (alertLevel === 'good') colorClass = "text-emerald-600";
    if (alertLevel === 'warning') colorClass = "text-amber-500";
    if (alertLevel === 'bad') colorClass = "text-rose-600";

    return (
        <Card className="hover:-translate-y-1 transition-transform duration-300 p-5">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                    {tooltip && <InfoTooltip text={tooltip} />}
                </div>
                {Icon && <Icon className={`w-4 h-4 text-gray-300`} />}
            </div>
            <h3 className={`text-2xl font-extrabold ${colorClass} tracking-tight`}>{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
        </Card>
    );
};

export default FleetCard;
