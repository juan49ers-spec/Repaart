
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Invoice } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
    invoices: Invoice[];
}

export const RevenueTrendChart: React.FC<Props> = ({ invoices }) => {
    const data = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return {
                month: d.toLocaleString('es-ES', { month: 'short' }),
                monthIndex: d.getMonth(),
                year: d.getFullYear(),
                total: 0
            };
        });

        const getInvoiceDate = (date: any): Date => {
            if (!date) return new Date();
            if (date instanceof Date) return date;
            if (typeof date.toDate === 'function') return date.toDate();
            if (date._seconds) return new Date(date._seconds * 1000);
            return new Date(date);
        };

        const chartData = [...last6Months];

        invoices.forEach(inv => {
            const date = getInvoiceDate(inv.issueDate);
            const monthIndex = date.getMonth();
            const year = date.getFullYear();

            const monthData = chartData.find(d => d.monthIndex === monthIndex && d.year === year);
            if (monthData) {
                monthData.total += inv.total;
            }
        });

        return chartData;
    }, [invoices]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-80">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tendencia de Facturación</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Total']}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === 5 ? '#10b981' : '#cbd5e1'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
