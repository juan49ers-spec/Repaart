import React, { useMemo, useState } from 'react';
import {
    Users, Fuel, Briefcase, Bike, Shield,
    Smartphone, Megaphone, MoreHorizontal,
    TrendingUp, AlertTriangle, PieChart as PieIcon,
    ChevronDown, ChevronRight, CheckCircle2
} from 'lucide-react';
import { formatMoney } from '../../../lib/finance';
import { ExpenseData, RentingData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface ExpenseStepProps {
    data: ExpenseData;
    onChange: (data: ExpenseData) => void;
    total: number;
    totalHours: number;
    onTotalHoursChange: (val: number) => void;
}

// --- COLORS & CONFIG ---
const CATEGORY_COLORS = {
    team: '#6366f1',    // Indigo (Payroll)
    fleet: '#f43f5e',   // Rose (Motos, Gas, Repairs)
    services: '#10b981', // Emerald (Professional Services)
    ops: '#f59e0b'      // Amber (Marketing, App, Others)
};

// Input Helper
const InputRow = ({ label, icon: Icon, value, onChange, placeholder = "0", suffix = "€" }: any) => (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-700 group">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white transition-colors`}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm text-slate-300 font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <input
                type="number"
                min="0"
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-24 bg-transparent text-right text-white font-bold focus:outline-none focus:border-b border-indigo-500 transition-all font-mono"
            />
            <span className="text-xs text-slate-500 font-bold w-4">{suffix}</span>
        </div>
    </div>
);

// Section Toggle Helper
const SectionHeader = ({ id, title, icon: Icon, color, total: sectionTotal, activeSection, setActiveSection }: any) => (
    <button
        onClick={() => setActiveSection(activeSection === id ? null : id)}
        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${activeSection === id
            ? `bg-slate-900 border-${color}-500/50 shadow-lg shadow-${color}-500/10`
            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${activeSection === id ? `bg-${color}-500 text-white` : `bg-slate-900 text-${color}-400`}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-left">
                <h4 className={`font-bold ${activeSection === id ? 'text-white' : 'text-slate-300'}`}>{title}</h4>
                <p className="text-xs text-slate-500">{activeSection === id ? 'Edición activa' : 'Click para editar'}</p>
            </div>
        </div>
        <div className="text-right">
            <span className={`block font-mono font-bold ${activeSection === id ? 'text-white' : 'text-slate-400'}`}>
                {formatMoney(sectionTotal)}€
            </span>
            {activeSection === id ? <ChevronDown className="w-4 h-4 ml-auto mt-1 text-slate-500" /> : <ChevronRight className="w-4 h-4 ml-auto mt-1 text-slate-500" />}
        </div>
    </button>
);

const ExpenseStep: React.FC<ExpenseStepProps> = ({ data, onChange, total, totalHours, onTotalHoursChange }) => {

    const [activeSection, setActiveSection] = useState<string | null>('team');

    const updateField = (field: keyof ExpenseData, value: number) => {
        onChange({ ...data, [field]: value });
    };

    const updateRenting = (field: keyof RentingData, value: number) => {
        onChange({
            ...data,
            renting: { ...data.renting, [field]: value }
        });
    };

    // --- CALCULATIONS FOR CHART ---
    const chartData = useMemo(() => {
        const team = data.payroll + data.insurance;
        const fleet = (data.renting.count * data.renting.pricePerUnit) + data.fuel + data.repairs;
        const services = data.professionalServices + data.agencyFee + data.prlFee + data.accountingFee;
        const ops = data.appFlyder + data.marketing + data.incidents + data.other + (data.royaltyPercent ? (total * (data.royaltyPercent / 100)) : 0);

        return [
            { name: 'Equipo', value: team, color: CATEGORY_COLORS.team },
            { name: 'Flota', value: fleet, color: CATEGORY_COLORS.fleet },
            { name: 'Servicios', value: services, color: CATEGORY_COLORS.services },
            { name: 'Operativo', value: ops, color: CATEGORY_COLORS.ops },
        ].filter(item => item.value > 0);
    }, [data, total]);



    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full text-slate-200">

            {/* LEFT COLUMN: INPUTS (Scrollable) */}
            <div className="flex-1 space-y-4 lg:overflow-y-auto lg:pr-2 custom-scrollbar pb-20">

                {/* 1. TEAM SECTION */}
                <div className="space-y-2">
                    <SectionHeader
                        id="team"
                        title="Equipo Humano"
                        icon={Users}
                        color="indigo"
                        total={data.payroll + data.insurance}
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    />
                    {activeSection === 'team' && (
                        <div className="p-4 bg-slate-950/30 border border-slate-800/50 border-t-0 rounded-b-xl space-y-3 animate-in slide-in-from-top-2">
                            <InputRow label="Nóminas (Neto)" icon={Users} value={data.payroll} onChange={(v: number) => updateField('payroll', v)} />
                            <InputRow label="Seguros Sociales" icon={Shield} value={data.insurance} onChange={(v: number) => updateField('insurance', v)} />
                            <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex items-center gap-3">
                                <AlertTriangle className="w-4 h-4 text-indigo-400" />
                                <p className="text-xs text-indigo-300">
                                    Recuerda: El coste de empresa suele ser un <strong>30-35%</strong> superior al neto.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. FLEET SECTION */}
                <div className="space-y-2">
                    <SectionHeader
                        id="fleet"
                        title="Flota y Transporte"
                        icon={Fuel}
                        color="rose"
                        total={(data.renting.count * data.renting.pricePerUnit) + data.fuel + data.repairs}
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    />
                    {activeSection === 'fleet' && (
                        <div className="p-4 bg-slate-950/30 border border-slate-800/50 border-t-0 rounded-b-xl space-y-3 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                    <label className="text-xs text-slate-500 font-bold block mb-1">MOTOS</label>
                                    <input
                                        type="number"
                                        value={data.renting.count || ''}
                                        onChange={(e) => updateRenting('count', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                    <label className="text-xs text-slate-500 font-bold block mb-1">PRECIO/UNIDAD</label>
                                    <input
                                        type="number"
                                        value={data.renting.pricePerUnit || ''}
                                        onChange={(e) => updateRenting('pricePerUnit', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <InputRow label="Gasolina" icon={Fuel} value={data.fuel} onChange={(v: number) => updateField('fuel', v)} />
                            <InputRow label="Reparaciones" icon={Bike} value={data.repairs} onChange={(v: number) => updateField('repairs', v)} />
                        </div>
                    )}
                </div>

                {/* 3. SERVICES SECTION */}
                <div className="space-y-2">
                    <SectionHeader
                        id="services"
                        title="Servicios Profesionales"
                        icon={Briefcase}
                        color="emerald"
                        total={data.professionalServices + data.agencyFee + data.prlFee + data.accountingFee}
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    />
                    {activeSection === 'services' && (
                        <div className="p-4 bg-slate-950/30 border border-slate-800/50 border-t-0 rounded-b-xl space-y-3 animate-in slide-in-from-top-2">
                            <InputRow label="Gestoría" icon={Briefcase} value={data.agencyFee} onChange={(v: number) => updateField('agencyFee', v)} />
                            <InputRow label="PRL (Prevención)" icon={Shield} value={data.prlFee} onChange={(v: number) => updateField('prlFee', v)} />
                            <InputRow label="Contabilidad" icon={Briefcase} value={data.accountingFee} onChange={(v: number) => updateField('accountingFee', v)} />
                            <InputRow label="Otros Servicios" icon={MoreHorizontal} value={data.professionalServices} onChange={(v: number) => updateField('professionalServices', v)} />
                        </div>
                    )}
                </div>

                {/* 4. OPS & MARKETING */}
                <div className="space-y-2">
                    <SectionHeader
                        id="ops"
                        title="Marketing y Operativa"
                        icon={Megaphone}
                        color="amber"
                        total={data.appFlyder + data.marketing + data.incidents + data.other}
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    />
                    {activeSection === 'ops' && (
                        <div className="p-4 bg-slate-950/30 border border-slate-800/50 border-t-0 rounded-b-xl space-y-3 animate-in slide-in-from-top-2">
                            <InputRow label="Marketing Digital" icon={Megaphone} value={data.marketing} onChange={(v: number) => updateField('marketing', v)} />
                            <InputRow label="App Flyder" icon={Smartphone} value={data.appFlyder} onChange={(v: number) => updateField('appFlyder', v)} />
                            <InputRow label="Incidencias" icon={AlertTriangle} value={data.incidents} onChange={(v: number) => updateField('incidents', v)} />
                            <InputRow label="Otros Gastos" icon={MoreHorizontal} value={data.other} onChange={(v: number) => updateField('other', v)} />

                            <div className="my-4 pt-4 border-t border-slate-800">
                                <label className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 block">Royalty</label>
                                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-amber-500/20">
                                    <span className="text-sm text-slate-300">Porcentaje sobre Ventas</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={data.royaltyPercent || ''}
                                            onChange={(e) => updateField('royaltyPercent', parseFloat(e.target.value))}
                                            placeholder="5"
                                            className="w-16 bg-transparent text-right font-bold text-white border-b border-amber-500/50 focus:border-amber-500 focus:outline-none"
                                        />
                                        <span className="text-amber-500 font-bold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* EXTRA: Total Hours */}
                <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">Horas Operativas</h4>
                            <p className="text-xs text-slate-400">Total horas trabajadas por el equipo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={totalHours || ''}
                            onChange={(e) => onTotalHoursChange(parseFloat(e.target.value) || 0)}
                            className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 w-24 text-right font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                        />
                        <span className="text-xs font-bold text-slate-500">H</span>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: VISUALIZATIONS (Sticky) */}
            <div className="w-full lg:w-[380px] space-y-6">

                {/* 1. TOTAL CARD */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <PieIcon className="w-32 h-32 text-indigo-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Gastos</p>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                        {formatMoney(total)}€
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/50 w-fit px-3 py-1.5 rounded-full border border-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        IVA Estimadoo: {formatMoney(total * 0.21)}€ approx
                    </div>
                </div>

                {/* 2. CHART */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 h-[320px] relative">
                    <h3 className="text-sm font-bold text-white mb-4">Distribución de Gastos</h3>
                    {total > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: number) => formatMoney(value) + '€'}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                            <PieIcon className="w-12 h-12 opacity-20" />
                            <p className="text-sm">Añade gastos para ver el gráfico</p>
                        </div>
                    )}
                </div>

                {/* 3. ALERTS */}
                <div className="space-y-3">
                    {data.fuel > (total * 0.15) && total > 0 && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 text-sm">
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                            <div>
                                <p className="font-bold text-rose-400">Gasto en Gasolina Alto</p>
                                <p className="text-rose-200/70 text-xs">Supone el {((data.fuel / total) * 100).toFixed(1)}% del total.</p>
                            </div>
                        </div>
                    )}
                    {data.marketing < 100 && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 text-sm">
                            <Megaphone className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div>
                                <p className="font-bold text-indigo-400">Impulsa tu negocio</p>
                                <p className="text-indigo-200/70 text-xs">Invertir en marketing es clave para crecer.</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ExpenseStep;
