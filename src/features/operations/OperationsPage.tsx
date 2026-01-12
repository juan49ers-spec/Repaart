import { useState, Suspense } from 'react';
import { Calendar, Users, Bike, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

import RidersView from '../fleet/RidersView'; // New Backend-Connected View
import { VehiclesView } from '../fleet/vehicles/VehiclesView'; // New Atomic Component
import ErrorBoundary from '../../ui/feedback/ErrorBoundary';

// Lazy load the new Scheduler
// Lazy load the new Scheduler
// Lazy load the new Scheduler
// const DeliveryScheduler = lazy(() => import('../scheduler/DeliveryScheduler'));
import DeliveryScheduler from '../scheduler/DeliveryScheduler';
import { useAuth } from '../../context/AuthContext';

const OperationsPage = () => {
    console.log('🏗️ RENDERIZANDO PÁGINA DE OPERACIONES');

    // Get context if available from dashboard layout, or use standard hooks inside components
    const outletContext = useOutletContext<{ franchiseId?: string }>();
    const franchiseId = outletContext?.franchiseId || '';
    const { user } = useAuth();

    console.log('🏗️ Renderizando Página de Operaciones. Usuario:', user?.email, 'FranchiseID:', franchiseId);

    const [activeTab, setActiveTab] = useState<'scheduler' | 'riders' | 'motos'>('scheduler');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    console.log('🏗️ Renderizando componente padre Operations con ID:', franchiseId);

    return (
        <div className="h-full bg-slate-50 p-6 overflow-hidden flex flex-col space-y-6">

            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {activeTab === 'scheduler' && <Calendar className="w-6 h-6 text-indigo-600" />}
                        {activeTab === 'riders' && <Users className="w-6 h-6 text-blue-600" />}
                        {activeTab === 'motos' && <Bike className="w-6 h-6 text-orange-600" />}

                        {activeTab === 'scheduler' ? 'Planificador de Horarios' :
                            activeTab === 'riders' ? 'Grid de Talento' : 'Gestión de Flota'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {activeTab === 'scheduler' ? 'Visualiza y gestiona los turnos semanales.' :
                            activeTab === 'riders' ? 'Control de documentación y personal activo.' : 'Control de vehículos, mantenimiento y estados.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                        <button
                            onClick={() => setActiveTab('scheduler')}
                            className={`px - 4 py - 2 rounded - lg text - sm font - bold flex items - center gap - 2 transition - all ${activeTab === 'scheduler'
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
                            className={`px - 4 py - 2 rounded - lg text - sm font - bold flex items - center gap - 2 transition - all ${activeTab === 'riders'
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
                            className={`px - 4 py - 2 rounded - lg text - sm font - bold flex items - center gap - 2 transition - all ${activeTab === 'motos'
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
                                    franchiseId={franchiseId}
                                    selectedDate={selectedDate}
                                    onDateChange={setSelectedDate}
                                />
                            </div>
                        )}
                        {activeTab === 'riders' && (
                            <div className="h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300 p-4">
                                <RidersView franchiseId={franchiseId} />
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
