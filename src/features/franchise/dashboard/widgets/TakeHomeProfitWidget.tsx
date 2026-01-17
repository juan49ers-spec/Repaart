import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, X, TrendingUp, Trophy, Zap, Fuel, Users } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../components/ui/primitives/Card';
import { SectionHeader } from '../../../../components/ui/primitives/SectionHeader';
import { DataRow } from '../../../../components/ui/primitives/DataRow';
import { StatValue } from '../../../../components/ui/primitives/StatValue';
import { Badge, BadgeIntent } from '../../../../components/ui/primitives/Badge';

// Internal MoneyRain Component for gamification
const MoneyRain = () => {
    const [items, setItems] = useState<any[]>([]);

    React.useEffect(() => {
        const newItems = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            delay: Math.random() * 2 + 's',
            duration: Math.random() * 2 + 3 + 's',
            rotation: Math.random() * 360 + 'deg',
            scale: Math.random() * 0.5 + 0.8,
            type: ['bill-50', 'bill-100', 'bill-200', 'coin', 'coin'][Math.floor(Math.random() * 5)]
        }));
        setItems(newItems);
    }, []);

    const renderItem = (type: string) => {
        switch (type) {
            case 'bill-50':
                return (
                    <div className="w-12 h-6 bg-orange-400/90 rounded-[2px] border border-orange-600 shadow-sm flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-orange-300"></div>
                        <span className="text-[8px] font-bold text-orange-900 leading-none">50€</span>
                    </div>
                );
            case 'bill-100':
                return (
                    <div className="w-14 h-7 bg-emerald-500/90 rounded-[2px] border border-emerald-700 shadow-sm flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-300"></div>
                        <span className="text-[9px] font-bold text-emerald-900 leading-none">100€</span>
                    </div>
                );
            case 'bill-200':
                return (
                    <div className="w-14 h-7 bg-yellow-400/90 rounded-[2px] border border-yellow-600 shadow-sm flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-yellow-200"></div>
                        <span className="text-[9px] font-bold text-yellow-900 leading-none">200€</span>
                    </div>
                );
            case 'coin':
                return (
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full border border-amber-600 shadow-sm flex items-center justify-center relative z-10">
                        <div className="w-3 h-3 rounded-full border border-amber-600/50" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[10001] overflow-hidden">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="absolute top-[-50px] animate-fall-sway opacity-0"
                    style={{
                        left: item.left,
                        animationDelay: item.delay,
                        animationDuration: item.duration,
                        transform: `scale(${item.scale})`,
                        '--tw-enter-rotate': item.rotation,
                    } as any}
                >
                    <div className="drop-shadow-md">
                        {renderItem(item.type)}
                    </div>
                </div>
            ))}
            <style>
                {`
                @keyframes fall-sway {
                    0% { transform: translateY(-50px) rotate(0deg) translateX(0px); opacity: 0; }
                    10% { opacity: 1; }
                    25% { transform: translateY(25vh) rotate(45deg) translateX(30px); }
                    50% { transform: translateY(50vh) rotate(-45deg) translateX(-30px); }
                    75% { transform: translateY(75vh) rotate(20deg) translateX(15px); }
                    100% { transform: translateY(110vh) rotate(0deg) translateX(0px); opacity: 0; }
                }
                .animate-fall-sway {
                    animation-name: fall-sway;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: 1;
                    animation-fill-mode: forwards;
                }
                `}
            </style>
        </div>
    );
};

// Internal StormRain Component for negative results
const StormRain = () => {
    const [items, setItems] = useState<any[]>([]);

    React.useEffect(() => {
        const newItems = Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            delay: Math.random() * 1 + 's',
            duration: Math.random() * 0.5 + 0.5 + 's',
        }));
        setItems(newItems);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[10001] overflow-hidden bg-slate-900/10">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="absolute top-[-20px] w-[2px] h-4 bg-slate-400 dark:bg-slate-500 rounded-full opacity-60 animate-rain"
                    style={{
                        left: item.left,
                        animationDelay: item.delay,
                        animationDuration: item.duration,
                    } as any}
                />
            ))}
            <style>
                {`
                @keyframes rain {
                    0% { transform: translateY(-20px) scaleY(1); opacity: 0; }
                    10% { opacity: 0.8; }
                    100% { transform: translateY(110vh) scaleY(1.5); opacity: 0; }
                }
                .animate-rain {
                    animation-name: rain;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                `}
            </style>
        </div>
    );
};

interface TakeHomeProfitWidgetProps {
    revenue: number;
    totalExpenses: number;
    irpfPercent?: number;
    trend?: number[];
    annualNetProfit?: number;
    onDetailClick?: () => void;
}

import { useNavigate } from 'react-router-dom';

// ... (imports remain matching, just adding useNavigate)

const TakeHomeProfitWidget: React.FC<TakeHomeProfitWidgetProps> = ({
    revenue,
    totalExpenses,
    irpfPercent = 20,
    annualNetProfit,
    onDetailClick: _onDetailClick,
}) => {
    const [showYTDModal, setShowYTDModal] = useState(false);
    const navigate = useNavigate();

    const operatingProfit = revenue - totalExpenses;
    const estimatedTax = operatingProfit > 0 ? (operatingProfit * irpfPercent) / 100 : 0;
    const takeHomeProfit = operatingProfit - estimatedTax;
    const margin = revenue > 1 ? (takeHomeProfit / revenue) * 100 : 0;

    const isProfitable = (annualNetProfit || 0) > 0;

    const getConfig = (): { badge: string; intent: BadgeIntent } => {
        if (margin >= 20) return { badge: `${margin.toFixed(0)}%`, intent: 'success' };
        if (margin >= 10) return { badge: `${margin.toFixed(0)}%`, intent: 'warning' };
        if (margin > 0) return { badge: `${margin.toFixed(0)}%`, intent: 'danger' };
        return { badge: '0%', intent: 'danger' };
    };

    const config = getConfig();

    return (
        <Card className="h-full flex flex-col">
            <SectionHeader
                title="Tu Bolsillo"
                subtitle={null}
                icon={<Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                action={<Badge intent={config.intent} title="Margen Neto">{config.badge}</Badge>}
            />

            <div className="mb-4">
                <StatValue
                    value={formatMoney(takeHomeProfit)}
                    unit="€"
                    size="xl"
                />
            </div>

            <div className="flex-1 space-y-2">
                <DataRow
                    label="Ingresos Brutos"
                    value={`${formatMoney(revenue)}€`}
                    color="bg-blue-500"
                />
                <DataRow
                    label="Gastos + IRPF"
                    value={`- ${formatMoney(totalExpenses + estimatedTax)}€`}
                    color="bg-rose-500"
                />
            </div>

            {/* Elegant Centered Annual Summary Pill */}
            <div className="mt-auto pt-6 flex justify-center">
                <button
                    onClick={() => {
                        setShowYTDModal(true);
                    }}
                    className="px-6 py-2.5 rounded-full bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-400/10 shadow-sm hover:shadow-indigo-500/10 hover:scale-[1.02] transition-all flex items-center gap-4 group"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">
                        Resumen Anual
                    </span>
                    <div className="h-4 w-[1px] bg-indigo-200/50 dark:bg-indigo-500/20" />
                    <div className="flex items-center gap-2">
                        <Wallet className={`w-4 h-4 ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`} />
                        <span className={`text-sm font-black tracking-tight ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isProfitable ? '+' : ''}{formatMoney(annualNetProfit || 0)}€
                        </span>
                    </div>
                </button>
            </div>

            {/* YTD Achievement Modal - "Fino y Elegante" Redesign */}
            {showYTDModal && createPortal(
                <div className="fixed inset-0 z-[9999] isolation-auto">
                    {/* Background Overlay */}
                    <div
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowYTDModal(false)}
                    />

                    {/* Confetti/Rain Effects */}
                    {isProfitable ? <MoneyRain /> : <StormRain />}

                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-[360px] p-6 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 pointer-events-auto relative overflow-hidden">

                            {/* Header Section */}
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform rotate-[-6deg]">
                                        <Trophy className="w-8 h-8 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2">Hitos 2026</h3>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
                                            <Zap className="w-3 h-3 fill-current" /> Rendimiento Auditado
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowYTDModal(false)}
                                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Main Stat Card - Clean & Airy */}
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl p-8 mb-8 text-center border border-emerald-100/50 dark:border-emerald-500/10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Acumulado Neto Anual</h4>
                                <div className="text-4xl font-black tracking-tighter text-emerald-500 dark:text-emerald-400 drop-shadow-sm">
                                    +{formatMoney(annualNetProfit || 0)}€
                                </div>
                            </div>

                            {/* Achievement List - Elegant Clean Cards */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-500">
                                        <Fuel size={20} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">Combustible Óptimo</h5>
                                        <p className="text-[11px] text-slate-500 font-medium">Gasto -8% vs media sector</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-500">
                                        <Users size={20} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">Eficiencia RRHH</h5>
                                        <p className="text-[11px] text-slate-500 font-medium">Cuadrante ajustado 100%</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
                                        <TrendingUp size={20} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">Servicio Record</h5>
                                        <p className="text-[11px] text-slate-500 font-medium">1.240 pedidos en un mes</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button - Dark & Bold */}
                            <button
                                onClick={() => {
                                    setShowYTDModal(false);
                                    navigate('/dashboard'); // Return to main dashboard
                                }}
                                className="w-full py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                            >
                                Mantener el Rumbo
                            </button>

                        </div>
                    </div>
                </div>,
                document.body
            )}
        </Card>
    );
};

export default TakeHomeProfitWidget;
