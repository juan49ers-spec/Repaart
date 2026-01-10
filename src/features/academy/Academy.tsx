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
    const [activeView, setActiveView] = useState<'student' | 'admin'>(isAdmin ? 'admin' : 'student');

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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
                {/* Toggle View Bar - Floating Glass */}
                <div className="sticky top-4 z-50 px-4 md:px-8 max-w-7xl mx-auto mb-[-2rem]">
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-lg shadow-indigo-500/5 p-3 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 pl-2">
                            <span className="bg-indigo-100 dark:bg-indigo-500/10 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400">🛡️</span>
                            Vista de Administración
                        </h2>
                        <button
                            onClick={() => setActiveView('student')}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all text-xs tracking-wide border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30"
                        >
                            Ver como Estudiante
                        </button>
                    </div>
                </div>
                <div className="pt-8">
                    <AdminAcademyPanel />
                </div>
            </div>
        );
    }

    // Vista de estudiante (para admin también puede verla)
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {isAdmin && (
                <div className="sticky top-4 z-50 px-4 md:px-8 max-w-7xl mx-auto mb-[-2rem]">
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-lg shadow-indigo-500/5 p-3 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 pl-2">
                            <span className="bg-emerald-100 dark:bg-emerald-500/10 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400">🎓</span>
                            Vista de Estudiante
                        </h2>
                        <button
                            onClick={() => setActiveView('admin')}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-all text-xs tracking-wide"
                        >
                            Panel de Administración
                        </button>
                    </div>
                </div>
            )}
            <div className={isAdmin ? "pt-8" : ""}>
                <AcademyDashboard onModuleClick={(module) => setSelectedModule(module as AcademyModule)} />
            </div>
        </div>
    );
};

export default Academy;
