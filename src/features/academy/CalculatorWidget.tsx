import React, { useState, useEffect, useMemo, type FC, type ChangeEvent } from 'react';
import { TrendingUp, RefreshCw, Coins, type LucideIcon, ArrowRight } from 'lucide-react';
import { formatMoney } from '../../lib/finance';

type CalculatorType = 'profitability' | 'roi' | 'taxes';

interface ProfitabilityValues {
    orders?: number;
    ticket?: number;
    riders?: number;
    costPerOrder?: number;
}

interface ROIValues {
    investment?: number;
    monthlyProfit?: number;
}

interface TaxesValues {
    revenue?: number;
    expenses?: number;
}

type CalculatorValues = ProfitabilityValues | ROIValues | TaxesValues;

interface ProfitabilityResult {
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
}

interface ROIResult {
    months: number;
    annualRoi: number;
}

interface TaxesResult {
    ivaPagar: number;
    irpf: number;
    totalTaxes: number;
}

type CalculatorResult = ProfitabilityResult | ROIResult | TaxesResult | null;

interface CalculatorWidgetProps {
    type?: CalculatorType;
}

interface CalculatorConfig {
    title: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    render: () => React.ReactElement;
}

/**
 * CalculatorWidget - Componente interactivo para lecciones
 * Tipos soportados: 'profitability', 'roi', 'taxes'
 */
const CalculatorWidget: FC<CalculatorWidgetProps> = ({ type = 'profitability' }) => {
    // --- STATE MANAGEMENT ---
    const [values, setValues] = useState<CalculatorValues>(() => {
        if (type === 'profitability') return { orders: 800, ticket: 7.5, riders: 4, costPerOrder: 6.2 };
        if (type === 'roi') return { investment: 4000, monthlyProfit: 1200 };
        if (type === 'taxes') return { revenue: 6000, expenses: 4500 };
        return {};
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (type === 'profitability') setValues({ orders: 800, ticket: 7.5, riders: 4, costPerOrder: 6.2 });
            else if (type === 'roi') setValues({ investment: 4000, monthlyProfit: 1200 });
            else if (type === 'taxes') setValues({ revenue: 6000, expenses: 4500 });
        }, 0);
        return () => clearTimeout(timer);
    }, [type]);

    const result = useMemo((): CalculatorResult => {
        if (Object.keys(values).length === 0) return null;

        if (type === 'profitability') {
            const v = values as ProfitabilityValues;
            const revenue = (v.orders || 0) * (v.ticket || 0);
            const costs = (v.orders || 0) * (v.costPerOrder || 0);
            const profit = revenue - costs;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            return { revenue, costs, profit, margin } as ProfitabilityResult;
        }
        else if (type === 'roi') {
            const v = values as ROIValues;
            const months = (v.monthlyProfit || 0) > 0 ? (v.investment || 0) / (v.monthlyProfit || 0) : 0;
            const annualRoi = (v.investment || 0) > 0 ? (((v.monthlyProfit || 0) * 12) / (v.investment || 0)) * 100 : 0;
            return { months: Math.ceil(months), annualRoi } as ROIResult;
        }
        else if (type === 'taxes') {
            const v = values as TaxesValues;
            const ivaRepercutido = (v.revenue || 0) * 0.21;
            const ivaSoportado = (v.expenses || 0) * 0.21;
            const ivaPagar = ivaRepercutido - ivaSoportado;
            const profitPreTax = (v.revenue || 0) - (v.expenses || 0);
            const irpf = profitPreTax > 0 ? profitPreTax * 0.20 : 0;
            return { ivaPagar, irpf, totalTaxes: ivaPagar + irpf } as TaxesResult;
        }
        return null;
    }, [values, type]);

    const handleChange = (key: string, val: string): void => {
        setValues(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
    };

    const renderProfitability = (): React.ReactElement => {
        const v = values as ProfitabilityValues;
        const r = result as ProfitabilityResult | null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="orders">
                            Pedidos Mensuales
                        </label>
                        <input
                            id="orders"
                            type="number"
                            value={v.orders || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('orders', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Ej: 800"
                            aria-label="Número de pedidos mensuales"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="ticket">
                            Ticket Medio (€)
                        </label>
                        <input
                            id="ticket"
                            type="number"
                            value={v.ticket || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('ticket', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Ej: 15.50"
                            aria-label="Valor del ticket medio en euros"
                        />
                    </div>
                </div>

                {r && (
                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Ingresos</p>
                            <p className="text-xl font-black text-indigo-900">{formatMoney(r.revenue)}€</p>
                        </div>
                        <ArrowRight className="text-indigo-300 w-5 h-5" />
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Beneficio Est.</p>
                            <p className={`text-2xl font-black ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatMoney(r.profit)}€
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderROI = (): React.ReactElement => {
        const v = values as ROIValues;
        const r = result as ROIResult | null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="investment">
                            Inversión Inicial (€)
                        </label>
                        <input
                            id="investment"
                            type="number"
                            value={v.investment || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('investment', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Ej: 5000"
                            aria-label="Inversión inicial"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="monthlyProfit">
                            Beneficio Mensual (€)
                        </label>
                        <input
                            id="monthlyProfit"
                            type="number"
                            value={v.monthlyProfit || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('monthlyProfit', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Ej: 2000"
                            aria-label="Beneficio mensual estimado"
                        />
                    </div>
                </div>

                {r && (
                    <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 grid grid-cols-2 gap-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs text-purple-600 uppercase font-bold tracking-wider mb-1">Retorno</p>
                            <p className="text-3xl font-black text-purple-900">{r.months} <span className="text-base font-bold text-purple-500">Meses</span></p>
                        </div>
                        <div className="text-right relative z-10">
                            <p className="text-xs text-purple-600 uppercase font-bold tracking-wider mb-1">ROI Anual</p>
                            <p className="text-3xl font-black text-purple-900">{r.annualRoi.toFixed(0)}%</p>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 to-purple-50 pointer-events-none" />
                    </div>
                )}
            </div>
        );
    };

    const renderTaxes = (): React.ReactElement => {
        const v = values as TaxesValues;
        const r = result as TaxesResult | null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="revenue">
                            Ingresos Base (€)
                        </label>
                        <input
                            id="revenue"
                            type="number"
                            value={v.revenue || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('revenue', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Ej: 10000"
                            aria-label="Ingresos base"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="expenses">
                            Gastos Base (€)
                        </label>
                        <input
                            id="expenses"
                            type="number"
                            value={v.expenses || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('expenses', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Ej: 5000"
                            aria-label="Gastos base"
                        />
                    </div>
                </div>

                {r && (
                    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-orange-200/50 pb-3">
                                <span className="text-orange-800 font-medium text-sm">IVA a Pagar (Modelo 303):</span>
                                <span className="font-bold text-orange-900 text-lg">{formatMoney(r.ivaPagar)}€</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-orange-900 font-bold text-base uppercase tracking-wider">Total Trimestre:</span>
                                <span className="text-orange-900 font-black text-2xl">{formatMoney(r.totalTaxes * 3)}€</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const configs: Record<CalculatorType, CalculatorConfig> = {
        profitability: { title: 'Simulador de Rentabilidad', icon: TrendingUp, color: 'text-indigo-600', bgColor: 'bg-indigo-50', render: renderProfitability },
        roi: { title: 'Calculadora ROI', icon: RefreshCw, color: 'text-purple-600', bgColor: 'bg-purple-50', render: renderROI },
        taxes: { title: 'Estimador Fiscal', icon: Coins, color: 'text-orange-600', bgColor: 'bg-orange-50', render: renderTaxes },
    };

    const config = (configs as any)[type] || configs.profitability;
    const Icon = config.icon;

    return (
        <div className="my-8 max-w-lg mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden transform transition-all hover:scale-[1.01]">
            <div className={`p-5 ${config.bgColor} border-b border-slate-100 flex items-center gap-4`}>
                <div className={`p-2.5 rounded-xl bg-white shadow-sm ${config.color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{config.title}</h3>
            </div>
            <div className="p-8">
                {config.render()}
            </div>
        </div>
    );
};

export default CalculatorWidget;
