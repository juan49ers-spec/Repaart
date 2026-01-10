import React, { type FC, type CSSProperties } from 'react';

interface RentingObject {
    count: number;
    pricePerUnit: number;
}

interface ExpenseBreakdown {
    payroll?: number;
    insurance?: number;
    fuel?: number;
    professionalServices?: number;
    renting?: RentingObject | number;
    appFlyder?: number;
    marketing?: number;
    other?: number;
    // Legacy fields
    labor?: number;
    cogs?: number;
}

interface ExpenseStackProps {
    breakdown: ExpenseBreakdown;
    totalExpenses: number;
}

interface ExpensePart {
    key: string;
    color: string;
    label: string;
    val: number;
}

const ExpenseStack: FC<ExpenseStackProps> = React.memo(({ breakdown, totalExpenses }) => {
    // Avoid rendering if no data
    if (!totalExpenses || !breakdown) return null;

    // Helper to safely get value from breakdown (which can be legacy or new)
    const getVal = (keys: string | string[]): number => {
        if (typeof keys === 'string') return breakdown[keys as keyof ExpenseBreakdown] as number || 0;
        return keys.reduce((acc, key) => acc + ((breakdown[key as keyof ExpenseBreakdown] as number) || 0), 0);
    };

    // Calculate groups for new data structure
    // New Structure: payroll, insurance, fuel, professionalServices, renting(obj/num?), appFlyder, marketing, other

    // Renting Logic: if it's an object {count, price}, calculate total. If number, use it.
    const rentingVal = typeof breakdown.renting === 'object'
        ? ((breakdown.renting as RentingObject).count * (breakdown.renting as RentingObject).pricePerUnit)
        : (breakdown.renting || 0);

    const values = {
        labor: getVal(['payroll']) + getVal(['insurance']), // Personal
        fleet: rentingVal + getVal(['fuel']), // Flota
        marketing: getVal(['marketing']), // Marketing
        ops: getVal(['professionalServices']) + getVal(['appFlyder']) + getVal(['other']), // Operativo
    };

    // Legacy Fallback (if 'labor' exists in breakdown, assume legacy)
    if (breakdown.labor !== undefined || breakdown.cogs !== undefined) {
        values.labor = breakdown.labor || 0;
        values.fleet = 0; // Legacy didn't have fleet specific?
        values.marketing = breakdown.marketing || 0;
        values.ops = breakdown.cogs || 0;
    }

    const parts: ExpensePart[] = [
        { key: 'labor', color: 'bg-blue-500', label: 'Personal', val: values.labor },
        { key: 'fleet', color: 'bg-orange-500', label: 'Flota', val: values.fleet },
        { key: 'marketing', color: 'bg-purple-500', label: 'Marketing', val: values.marketing },
        { key: 'ops', color: 'bg-emerald-500', label: 'Operativo', val: values.ops }
    ].filter(p => p.val > 0); // Only show if > 0

    return (
        <div className="w-full space-y-2">
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
                {parts.map(p => (
                    <div
                        key={p.key}
                        className={`h-full ${p.color}`}
                        style={{ width: `${(p.val / totalExpenses) * 100}%` } as CSSProperties}
                    />
                ))}
            </div>
            <div className="flex gap-4 flex-wrap">
                {parts.map(p => (
                    <div key={p.key} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                            {p.label} <span className="text-slate-500">({((p.val / totalExpenses) * 100).toFixed(0)}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

ExpenseStack.displayName = 'ExpenseStack';

export default ExpenseStack;
