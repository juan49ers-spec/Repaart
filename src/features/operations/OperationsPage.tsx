import { useState, Suspense, useEffect } from 'react';
import { Calendar, Users, Bike, Loader2, Store } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

import RidersView from '../fleet/RidersView';
import { VehiclesView } from '../fleet/vehicles/VehiclesView';
import ErrorBoundary from '../../components/ui/feedback/ErrorBoundary';
import DeliveryScheduler from '../scheduler/DeliveryScheduler';

const OperationsPage = () => {
    // console.log('🏗️ RENDERIZANDO PÁGINA DE OPERACIONES');

    const outletContext = useOutletContext<{ franchiseId?: string }>();
    const { user, impersonatedFranchiseId } = useAuth();
    // Rudimentary admin check. Ideally use a custom claim or role from context if reliable.
    const isAdmin = user?.email?.includes('admin') || false;

    // Franchise State for Admin Selector
    const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>(outletContext?.franchiseId || '');
    const [franchises, setFranchises] = useState<any[]>([]);
    const [loadingFranchises, setLoadingFranchises] = useState(false);

    // Use impersonatedFranchiseId first (admin impersonation mode), then selector, then context
    const activeFranchiseId = impersonatedFranchiseId || (isAdmin ? selectedFranchiseId : (outletContext?.franchiseId || ''));

    // Load Franchises if Admin
    useEffect(() => {
        if (isAdmin && !outletContext?.franchiseId) {
            const loadFranchises = async () => {
                setLoadingFranchises(true);
                try {
                    // Fetch franchises (users with role 'franchise')
                    const q = query(collection(db, 'users'), where('role', '==', 'franchise'));
                    const snap = await getDocs(q);
                    const list = snap.docs.map(d => {
                        const data = d.data();
                        return {
                            id: data.franchiseId || d.id,
                            uid: d.id,
                            ...data
                        };
                    });
                    setFranchises(list);
                    if (list.length > 0 && !selectedFranchiseId) {
                        setSelectedFranchiseId(list[0].id);
                    }
                } catch (e) {
                    console.error("Error loading franchises", e);
                } finally {
                    setLoadingFranchises(false);
                }
            };
            loadFranchises();
        } else if (outletContext?.franchiseId) {
            setSelectedFranchiseId(outletContext.franchiseId);
        }
    }, [isAdmin, outletContext]);


    const [activeTab, setActiveTab] = useState<'scheduler' | 'riders' | 'motos'>('scheduler');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div className="h-full bg-slate-50 p-6 overflow-hidden flex flex-col space-y-2">

            {/* Header & Tabs */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-200 pb-2 shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {activeTab === 'scheduler' && <Calendar className="w-6 h-6 text-indigo-600" />}
                        {activeTab === 'riders' && <Users className="w-6 h-6 text-blue-600" />}
                        {activeTab === 'motos' && <Bike className="w-6 h-6 text-orange-600" />}

                        {activeTab === 'scheduler' ? 'Planificador de Horarios' :
                            activeTab === 'riders' ? 'Grid de Talento' : 'Gestión de Flota'}
                    </h1>

                    {/* Admin Franchise Context Indicator or Selector */}
                    {isAdmin ? (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-1.5 self-start">
                            <div className="p-1 bg-white rounded-md shadow-sm">
                                <Store className="w-4 h-4 text-indigo-600" />
                            </div>

                            {outletContext?.franchiseId ? (
                                // Locked Context
                                <span className="text-sm font-bold text-indigo-900 px-1">
                                    Viendo Franquicia: <span className="opacity-70">{activeFranchiseId}</span>
                                </span>
                            ) : (
                                // Selector Context
                                <select
                                    className="bg-transparent text-sm font-bold text-indigo-900 border-none focus:ring-0 cursor-pointer min-w-[200px]"
                                    value={selectedFranchiseId}
                                    onChange={(e) => setSelectedFranchiseId(e.target.value)}
                                    disabled={loadingFranchises}
                                    aria-label="Seleccionar Franquicia"
                                >
                                    {loadingFranchises && <option>Cargando franquicias...</option>}
                                    {franchises.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.franchiseName || f.name || 'Franquicia sin nombre'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm mt-1">
                            {activeTab === 'scheduler' ? 'Visualiza y gestiona los turnos semanales.' :
                                activeTab === 'riders' ? 'Control de documentación y personal activo.' : 'Control de vehículos, mantenimiento y estados.'}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 self-end xl:self-auto">
                    <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                        <button
                            onClick={() => setActiveTab('scheduler')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'scheduler'
                                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50'
                                } `}
                        >
                            <Calendar className="w-4 h-4" />
                            <span className="hidden md:inline">Horarios</span>
                        </button>
                        <div className="w-px bg-slate-200 mx-1 my-2" />
                        <button
                            onClick={() => setActiveTab('riders')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'riders'
                                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200/50'
                                } `}
                        >
                            <Users className="w-4 h-4" />
                            <span className="hidden md:inline">Equipo</span>
                        </button>
                        <div className="w-px bg-slate-200 mx-1 my-2" />
                        <button
                            onClick={() => setActiveTab('motos')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'motos'
                                ? 'bg-white text-orange-700 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-orange-600 hover:bg-slate-200/50'
                                } `}
                        >
                            <Bike className="w-4 h-4" />
                            <span className="hidden md:inline">Flota</span>
                        </button>
                    </div>
                </div>
            </div >

            {/* Content Area */}
            < div className="flex-1 overflow-hidden relative rounded-2xl bg-white border border-slate-200 shadow-sm" >
                <ErrorBoundary>
                    <Suspense fallback={
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    }>
                        {activeTab === 'scheduler' && (
                            <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <DeliveryScheduler
                                    franchiseId={activeFranchiseId}
                                    selectedDate={selectedDate}
                                    onDateChange={setSelectedDate}
                                    readOnly={isAdmin}
                                />
                            </div>
                        )}
                        {activeTab === 'riders' && (
                            <div className="h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300 p-4">
                                <RidersView franchiseId={activeFranchiseId} />
                            </div>
                        )}
                        {activeTab === 'motos' && (
                            <div className="h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300 p-4">
                                <VehiclesView />
                            </div>
                        )}
                    </Suspense>
                </ErrorBoundary>
            </div >
        </div >
    );
};

export default OperationsPage;
