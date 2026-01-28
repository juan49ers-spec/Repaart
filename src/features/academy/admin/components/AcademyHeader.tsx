import React from 'react';
import { ArrowLeft, Video, Eye, Plus } from 'lucide-react';

interface AcademyHeaderProps {
    onBack: () => void;
    onViewStudent: () => void;
    onCreateModule: () => void;
}

const AcademyHeader: React.FC<AcademyHeaderProps> = ({
    onBack,
    onViewStudent,
    onCreateModule
}) => {
    return (
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-lg mb-4 p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 dark:text-white">
                            Academy Studio
                        </h1>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400">
                            Panel de administración
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onViewStudent}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 font-semibold text-xs border border-slate-200 dark:border-slate-600 transition-all"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Vista estudiante</span>
                    </button>
                    <button
                        onClick={onCreateModule}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-xs transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nuevo módulo
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AcademyHeader;