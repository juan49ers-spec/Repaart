import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AcademyDashboard from './AcademyDashboard';
import AdminAcademyPanel from './AdminAcademyPanel';
import ModuleViewer from './ModuleViewer';
import { AcademyModule } from '../../hooks/useAcademy';

/**
 * Academy Main Component - Punto de entrada principal
 * Maneja la vista admin vs franquiciado y la navegación entre módulos
 */
const Academy: React.FC = () => {
    const { isAdmin } = useAuth();
    const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null);
    const [activeView, setActiveView] = useState<'student' | 'admin'>('student');

    // Si hay un módulo seleccionado, mostrar el visor
    if (selectedModule) {
        return (
            <ModuleViewer
                module={selectedModule as any}
                onBack={() => setSelectedModule(null)}
            />
        );
    }

    // Vista de administrador
    if (isAdmin && activeView === 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 animate-fade-in">
                {/* Toggle View Button */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-indigo-100 p-1 rounded-md text-indigo-600">🛡️</span>
                            Vista: Administrador
                        </h2>
                        <button
                            onClick={() => setActiveView('student')}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-bold transition text-sm flex items-center gap-2 border border-indigo-100"
                        >
                            👁️ Ver como Estudiante
                        </button>
                    </div>
                </div>
                <AdminAcademyPanel />
            </div>
        );
    }

    // Vista de estudiante (para admin también puede verla)
    return (
        <div className="min-h-screen bg-slate-50 animate-fade-in">
            {isAdmin && (
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-slate-100 p-1 rounded-md text-slate-600">🎓</span>
                            Vista: Estudiante
                        </h2>
                        <button
                            onClick={() => setActiveView('admin')}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold transition text-sm flex items-center gap-2 border border-slate-200"
                        >
                            ⚙️ Panel de Administración
                        </button>
                    </div>
                </div>
            )}
            <AcademyDashboard onModuleClick={(module) => setSelectedModule(module as AcademyModule)} />
        </div>
    );
};

export default Academy;
