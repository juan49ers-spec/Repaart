import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Building2, ChevronDown } from 'lucide-react';

interface FranchiseOption {
    id: string;
    name: string;
}

interface OperationsFranchiseSelectorProps {
    selectedFranchiseId: string | undefined | null;
    onSelect: (franchiseId: string) => void;
}

// Simple lightweight selector for Operations View
const OperationsFranchiseSelector: React.FC<OperationsFranchiseSelectorProps> = ({ selectedFranchiseId, onSelect }) => {
    const [franchises, setFranchises] = useState<FranchiseOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFranchises = async () => {
            try {
                // Fetch all franchises (assuming 'franchises' collection holds metadata)
                // Or fetch from 'users' where role == 'franchise'.
                // For this architecture, let's assume we can query users_config or franchises.
                // Let's try fetching from 'franchises' collection directly if it exists,
                // otherwise fallback to a mocked list or users query.

                // Optimized: Query logic
                // Phase 4 Task 12 says: Implement AdminFranchiseSelector
                // We'll use a simple query for now.
                const snap = await getDocs(collection(db, 'franchises'));
                const list = snap.docs.map(d => ({
                    id: d.id,
                    name: d.data().name || d.data().displayName || `Franquicia ${d.id.substring(0, 4)}`
                }));
                // Fallback if empty (e.g. if we only use users_config)
                if (list.length === 0) {
                    // Try users_config where role 'franchise'?
                    // For MVP, if empty, we might just show the current ID to allow manual input or debugging
                }
                setFranchises(list);
            } catch (e) {
                console.error("Error loading franchises", e);
            } finally {
                setLoading(false);
            }
        };
        loadFranchises();
    }, []);

    if (loading) return <div className="text-xs text-slate-500">Cargando sedes...</div>;

    return (
        <div className="relative group">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 border border-indigo-100">
                    <Building2 size={18} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Franquicia</span>
                    <select
                        value={selectedFranchiseId || ''}
                        onChange={(e) => onSelect(e.target.value)}
                        title="Seleccionar sede"
                        className="bg-transparent text-slate-900 font-bold text-sm focus:outline-none appearance-none cursor-pointer min-w-[150px]"
                    >
                        {franchises.length > 0 ? (
                            franchises.map(f => (
                                <option key={f.id} value={f.id} className="bg-white text-slate-900">
                                    {f.name}
                                </option>
                            ))
                        ) : (
                            <option value={selectedFranchiseId || ''} className="bg-white text-slate-900">{selectedFranchiseId || 'Seleccionar...'}</option>
                        )}
                    </select>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
            </div>
        </div>
    );
};

export default OperationsFranchiseSelector;
