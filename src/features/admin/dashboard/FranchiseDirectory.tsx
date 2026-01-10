import { type FC, type MouseEvent } from 'react';
import { Users, Search, Sliders } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';

interface FranchiseMetrics {
    profit: number;
    revenue: number;
}

interface Franchise {
    id: string;
    name: string;
    email: string;
    metrics: FranchiseMetrics;
}

interface FranchiseDirectoryProps {
    franchises: Franchise[];
    onSelectFranchise: (id: string, name: string) => void;
    setSelectedScorecard: (franchise: Franchise) => void;
}

const FranchiseDirectory: FC<FranchiseDirectoryProps> = ({ franchises, onSelectFranchise, setSelectedScorecard }) => {
    console.log('DEBUG: FranchiseDirectory mounted');
    return (
        <div className="space-y-4">
            {/* TABLE: Hidden on Mobile, Visible on Desktop */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center backdrop-blur-sm">
                    <h3 className="font-bold text-slate-800 flex items-center text-lg">
                        <Users className="w-5 h-5 mr-3 text-blue-500" /> Directorio de Franquicias
                    </h3>
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input type="text" placeholder="Buscar..." className="bg-transparent border-none text-sm focus:outline-none text-slate-600 placeholder-slate-400 w-32" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 pl-8">Franquicia</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Ingresos</th>
                                <th className="px-6 py-4 text-right">Beneficio</th>
                                <th className="px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {franchises.map((f) => (
                                <tr
                                    key={f.id}
                                    onClick={() => setSelectedScorecard(f)}
                                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4 pl-8">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-500 mr-4 shadow-sm group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-600 transition-all">
                                                {f.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{f.name}</p>
                                                <p className="text-xs text-slate-400">{f.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {f.metrics.profit > 0 ? (
                                            <span className="inline-flex w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-white ring-2 ring-emerald-100" />
                                        ) : (
                                            <span className="inline-flex w-3 h-3 rounded-full bg-rose-500 shadow-sm border border-white ring-2 ring-rose-100" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600 font-medium font-mono">{formatMoney(f.metrics.revenue, 0)}€</td>
                                    <td className={`px-6 py-4 text-right font-bold font-mono ${f.metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatMoney(f.metrics.profit, 0)}€
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onSelectFranchise(f.id, f.name); }}
                                            className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
                                            title="Editar Datos"
                                        >
                                            <Sliders className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MOBILE CARD VIEW: Visible on Mobile, Hidden on Desktop */}
            <div className="md:hidden space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center text-lg px-2">
                    <Users className="w-5 h-5 mr-3 text-blue-500" /> Directorio
                </h3>
                {franchises.map((f) => (
                    <div
                        key={f.id}
                        onClick={() => setSelectedScorecard(f)}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 active:scale-95 transition-transform"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-500 mr-3 shadow-sm">
                                    {f.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{f.name}</p>
                                    <p className="text-xs text-slate-400 truncate max-w-[150px]">{f.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.metrics.profit > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {f.metrics.profit > 0 ? 'Rentable' : 'Pérdidas'}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-blue-50 pt-3">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Ingresos</p>
                                <p className="font-mono font-bold text-blue-900">{formatMoney(f.metrics.revenue, 0)}€</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Beneficio</p>
                                <p className={`font-mono font-bold ${f.metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatMoney(f.metrics.profit, 0)}€
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-3 pt-2">
                            <button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onSelectFranchise(f.id, f.name); }}
                                className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:bg-blue-100"
                            >
                                <Sliders className="w-3 h-3 mr-1" /> Gestionar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FranchiseDirectory;
