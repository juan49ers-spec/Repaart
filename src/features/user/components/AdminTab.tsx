import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import RealMadridWidget from './RealMadridWidget';

interface AdminTabProps {
    setViewMode: (mode: string) => void;
}

const AdminTab: FC<AdminTabProps> = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4">Consola de Administración</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* WIDGET REAL MADRID (Full Width on Mobile, 1 Col on Desktop) */}
                <div className="md:col-span-2 lg:col-span-1">
                    <RealMadridWidget />
                </div>

                <div onClick={() => navigate('/admin/users')} className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">Gestión de Usuarios</h3>
                    <p className="text-sm text-slate-500 mt-2">Crea, edita o elimina usuarios y asigna roles de franquicia.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminTab;
