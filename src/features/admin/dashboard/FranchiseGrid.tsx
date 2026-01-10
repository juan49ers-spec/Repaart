import { type FC } from 'react';
import { Building, ArrowRight } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';

interface Franchise {
    uid?: string;
    id?: string;
    name: string;
    location?: string;
    revenue?: number;
}

interface FranchiseGridProps {
    franchises: Franchise[];
    onSelect: (franchiseId: string) => void;
}

const FranchiseGrid: FC<FranchiseGridProps> = ({ franchises, onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {franchises.map((franchise) => {
                // Random mock status logic if not present, just for visual pop
                const isHealthy = true;

                return (
                    <div
                        key={franchise.uid || franchise.id}
                        onClick={() => onSelect(franchise.uid || franchise.id || '')}
                        className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors">
                                <Building className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'}`}>
                                {isHealthy ? 'Activa' : 'Revisión'}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                            {franchise.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                            {franchise.location || 'Sede Principal'}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                            <div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Facturación</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                                    {formatMoney(franchise.revenue || 0)}€
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Add New Franchise Placeholder */}
            <div className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all cursor-not-allowed opacity-60">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                    <Building className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-500">Nueva Sede</h3>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Próximamente</p>
            </div>
        </div>
    );
};

export default FranchiseGrid;
