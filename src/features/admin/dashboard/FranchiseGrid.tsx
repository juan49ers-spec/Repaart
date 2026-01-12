import React, { type FC } from 'react';
import { Building } from 'lucide-react';
import FranchiseCard, { Franchise as FranchiseCardType } from './FranchiseCard';

interface Franchise {
    uid?: string;
    id?: string;
    name: string;
    location?: string;
    revenue?: number;
    status?: 'active' | 'pending' | 'suspended' | 'banned';
}

interface FranchiseGridProps {
    franchises: Franchise[];
    onSelect?: (id: string) => void;
}

const FranchiseGrid: FC<FranchiseGridProps> = ({ franchises, onSelect: _onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {franchises.map((franchise) => {
                const uid = franchise.uid || franchise.id || '';

                // Map to FranchiseCard component format
                const cardData: FranchiseCardType = {
                    uid: uid,
                    name: franchise.name,
                    location: franchise.location,
                    status: franchise.status || 'active',
                    metrics: {
                        revenue: franchise.revenue,
                        orders: 0 // Default if not provided
                    }
                };

                return (
                    <FranchiseCard key={uid} franchise={cardData} />
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
