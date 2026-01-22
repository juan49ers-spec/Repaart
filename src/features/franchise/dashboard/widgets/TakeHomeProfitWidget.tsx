import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Trophy, Activity, ShieldCheck } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { cn } from '../../../../lib/utils';

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
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[10001] overflow-hidden">
            {items.map((item) => (
                <div key={item.id} className="absolute top-[-50px] animate-fall-sway opacity-0" style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration, transform: `scale(${item.scale})` } as any} >
                    <div className="drop-shadow-md">{renderItem(item.type)}</div>
                </div>
            ))}
            <style>{`@keyframes fall-sway { 0% { transform: translateY(-50px) rotate(0deg) translateX(0px); opacity: 0; } 10% { opacity: 1; } 25% { transform: translateY(25vh) rotate(45deg) translateX(30px); } 50% { transform: translateY(50vh) rotate(-45deg) translateX(-30px); } 75% { transform: translateY(75vh) rotate(20deg) translateX(15px); } 100% { transform: translateY(110vh) rotate(0deg) translateX(0px); opacity: 0; } } .animate-fall-sway { animation-name: fall-sway; animation-timing-function: ease-in-out; animation-iteration-count: 1; animation-fill-mode: forwards; }`}</style>
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
                <div key={item.id} className="absolute top-[-20px] w-[2px] h-4 bg-slate-400 dark:bg-slate-500 rounded-full opacity-60 animate-rain" style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration, } as any} />
            ))}
            <style>{`@keyframes rain { 0% { transform: translateY(-20px) scaleY(1); opacity: 0; } 10% { opacity: 0.8; } 100% { transform: translateY(110vh) scaleY(1.5); opacity: 0; } } .animate-rain { animation-name: rain; animation-timing-function: linear; animation-iteration-count: infinite; }`}</style>
        </div>
    );
};

interface TakeHomeProfitWidgetProps {
    revenue: number;
    totalExpenses: number;
    irpfPercent?: number;
    trend?: number[];
    annualNetProfit?: number;
    year?: string | number;
    onDetailClick?: () => void;
}

const TakeHomeProfitWidget: React.FC<TakeHomeProfitWidgetProps> = ({
    revenue,
    totalExpenses,
    irpfPercent = 20,
    annualNetProfit,
    year = new Date().getFullYear(),
}) => {
    const [showYTDModal, setShowYTDModal] = useState(false);

    const operatingProfit = revenue - totalExpenses;
    const estimatedTax = operatingProfit > 0 ? (operatingProfit * irpfPercent) / 100 : 0;
    const takeHomeProfit = operatingProfit - estimatedTax;
    const margin = revenue > 1 ? (takeHomeProfit / revenue) * 100 : 0;

    const isProfitable = (annualNetProfit || 0) > 0;

    return (
        <div className="workstation-card workstation-scanline p-6 h-full flex flex-col group/card transition-all mechanical-press overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-ruby-50 dark:bg-ruby-900/10 rounded-lg">
                        <Wallet className="w-3.5 h-3.5 text-ruby-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                            En Tu Bolsillo
                        </h3>
                    </div>
                </div>
                <div className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded tabular-nums",
                    margin >= 10 ? 'text-emerald-600 bg-emerald-50' : 'text-ruby-600 bg-ruby-50'
                )}>
                    {margin.toFixed(1)}% margen
                </div>
            </div>

            {/* MAIN VALUE DISPLAY */}
            <div className="mb-5">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {formatMoney(takeHomeProfit)}€
                    </span>
                    <span className="text-xs font-medium text-slate-400 ml-1">liquidez</span>
                </div>
            </div>

            {/* HIGH-DENSITY BREAKDOWN */}
            <div className="space-y-1 mb-6">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ingresos Netos</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">+{formatMoney(revenue)}€</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gastos Totales</span>
                    <span className="text-xs font-bold text-rose-600 tabular-nums">-{formatMoney(totalExpenses + estimatedTax)}€</span>
                </div>
            </div>

            {/* YEARLY ANALYTICS PORT */}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowYTDModal(true); }}
                    className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-ruby-600 dark:hover:bg-ruby-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-lg"
                >
                    <Activity className="w-3.5 h-3.5" />
                    Informe Anual {year}
                    <div className="h-3 w-px bg-white/20 dark:bg-slate-900/20" />
                    <span className={cn("tabular-nums", isProfitable ? 'text-emerald-400 dark:text-emerald-600' : 'text-ruby-400')}>
                        {isProfitable ? '+' : ''}{formatMoney(annualNetProfit || 0)}€
                    </span>
                </button>
            </div>

            {/* YTD MODAL - GLASS PREMIUM */}
            {showYTDModal && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowYTDModal(false)} />
                    {isProfitable ? <MoneyRain /> : <StormRain />}

                    <div className="glass-premium rounded-[2.5rem] w-full max-w-[380px] p-8 text-center animate-in zoom-in-95 duration-300 relative z-10 overflow-hidden shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-ruby-600/10 text-ruby-600 rounded-[2rem] flex items-center justify-center shadow-inner ring-1 ring-ruby-600/20 rotate-[-8deg]">
                                <Trophy className="w-10 h-10" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">HITOS <span className="text-ruby-600">ANUALES</span></h3>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Ciclo de Rendimiento {year}</p>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 py-8 rounded-3xl mb-8 group overflow-hidden relative">
                            <div className="absolute inset-0 workstation-scanline opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Neto Acumulado</p>
                            <div className="text-4xl font-black italic tracking-tighter text-emerald-500 dark:text-emerald-400 tabular-nums">
                                +{formatMoney(annualNetProfit || 0)}€
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 text-left">
                            <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                                <ShieldCheck className="w-5 h-5 text-ruby-600" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Eficiencia Verificada</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-tight font-bold">Margen operativo +12% vs media red</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowYTDModal(false)}
                            className="ruby-button w-full mechanical-press"
                        >
                            CERRAR
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TakeHomeProfitWidget;
