import { type FC } from 'react';
import { Users, User, Shield, Fuel, PenTool, AlertTriangle, FileText, Activity, Layers, Smartphone, Megaphone } from 'lucide-react';

interface InputCardProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    icon?: string;
    highlight?: boolean;
    variant?: 'dark' | 'light';
}

const InputCard: FC<InputCardProps> = ({ label, value, onChange, highlight, icon, variant = 'dark' }) => {
    // Icon mapping logic
    const getIcon = (name: string) => {
        switch (name) {
            case 'users': return <Users className="w-4 h-4 text-slate-400" />;
            case 'user': return <User className="w-4 h-4 text-slate-400" />;
            case 'shield': return <Shield className="w-4 h-4 text-slate-400" />;
            case 'fuel': return <Fuel className="w-4 h-4 text-amber-500" />;
            case 'tool': return <PenTool className="w-4 h-4 text-slate-400" />;
            case 'alert': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
            case 'file-text': return <FileText className="w-4 h-4 text-slate-400" />;
            case 'credit-card': return <FileText className="w-4 h-4 text-slate-400" />; // Fallback
            case 'briefcase': return <FileText className="w-4 h-4 text-slate-400" />; // Fallback
            case 'smartphone': return <Smartphone className="w-4 h-4 text-pink-400" />;
            case 'megaphone': return <Megaphone className="w-4 h-4 text-pink-400" />;
            case 'layers': return <Layers className="w-4 h-4 text-slate-400" />;
            default: return <Activity className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className={`${variant === 'light' ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-950 border-slate-800 hover:border-slate-700'} p-4 rounded-xl border ${highlight ? (variant === 'light' ? 'border-amber-500/50 bg-amber-50' : 'border-amber-500/30 bg-amber-500/5') : ''} transition-all group`}>
            <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-bold ${variant === 'light' ? 'text-slate-500 group-hover:text-slate-700' : 'text-slate-400 group-hover:text-slate-300'} block uppercase tracking-wider transition-colors`}>{label}</label>
                {icon && getIcon(icon)}
            </div>

            <div className="relative">
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className={`w-full ${variant === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500' : 'bg-slate-900 border-slate-700 text-white placeholder-slate-700 focus:ring-indigo-500'} border ${highlight ? 'border-amber-500/50' : ''} rounded-lg py-2.5 pl-4 pr-10 font-mono text-lg font-bold focus:ring-2 focus:border-transparent transition-all`}
                    placeholder="0.00"
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${variant === 'light' ? 'text-slate-400' : 'text-slate-600'} font-bold`}>€</span>
            </div>
            {highlight && <p className="text-[10px] text-amber-500/80 mt-1.5 font-medium">* Dato crítico para la rentabilidad</p>}
        </div>
    );
};

export default InputCard;
