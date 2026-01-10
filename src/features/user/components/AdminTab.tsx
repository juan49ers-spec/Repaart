import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, ArrowRight, Activity, Users, Ticket, BarChart3 } from 'lucide-react';
import RealMadridWidget from './RealMadridWidget';

interface AdminTabProps {
    setViewMode: (mode: string) => void;
}

const AdminTab: FC<AdminTabProps> = () => {
    const navigate = useNavigate();

    return (
        <div className="animate-in fade-in duration-500 space-y-8">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-500" />
                        Command Center
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Gestión centralizada de la red de franquicias</p>
                </div>
                {/* Micro Stats */}
                <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sistema Online
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- REAL MADRID WIDGET (Hero Card) --- */}
                <div className="lg:col-span-1">
                    <RealMadridWidget />
                </div>

                {/* --- ACTION GRID --- */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Card: Users */}
                    <div
                        onClick={() => navigate('/admin/users')}
                        className="group relative p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-200 hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24 transform rotate-12" />
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-4">
                            <User className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">Gestión de Usuarios</h3>
                        <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">Control de accesos, roles y permisos de toda la red.</p>
                        <div className="flex items-center text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                            ACCEDER <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                    </div>

                    {/* Card: Franchises */}
                    <div
                        onClick={() => navigate('/admin/network')} // Assuming this route exists or similar
                        className="group relative p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100 hover:border-emerald-200 hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Store className="w-24 h-24 transform rotate-12" />
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                            <Store className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">Red de Franquicias</h3>
                        <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">Monitorización de unidades operativas y rendimiento.</p>
                        <div className="flex items-center text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                            EXPLORAR <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                    </div>

                    {/* Card: Support */}
                    <div
                        onClick={() => navigate('/admin/support')}
                        className="group relative p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-100 hover:border-amber-200 hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Ticket className="w-24 h-24 transform rotate-12" />
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform mb-4">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-amber-700 transition-colors">Tickets de Soporte</h3>
                        <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">Resolución de incidencias y asistencia técnica.</p>
                        <div className="flex items-center text-xs font-bold text-amber-500 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                            VER TICKETS <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                    </div>

                    {/* Card: Analytics/Audit */}
                    <div
                        onClick={() => navigate('/admin/audit')}
                        className="group relative p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200 hover:border-slate-300 hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BarChart3 className="w-24 h-24 transform rotate-12" />
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform mb-4">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-slate-900 transition-colors">Auditoría del Sistema</h3>
                        <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">Logs de actividad y seguridad global.</p>
                        <div className="flex items-center text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                            AUDITAR <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminTab;
