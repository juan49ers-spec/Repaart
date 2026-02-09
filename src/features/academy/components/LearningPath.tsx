import React from 'react';
import { motion } from 'framer-motion';
import { AcademyModule } from '../../../services/academyService';
import { CheckCircle, Lock, ChevronRight } from 'lucide-react';

interface LearningPathProps {
  modules: AcademyModule[];
  completedLessons: string[];
  allLessons: { module_id: string; id: string }[];
  currentModuleId?: string;
  onSelectModule: (moduleId: string) => void;
}

export const LearningPath: React.FC<LearningPathProps> = ({
  modules,
  completedLessons,
  allLessons,
  currentModuleId,
  onSelectModule
}) => {
  const getModuleProgress = (moduleId: string) => {
    const moduleLessons = allLessons.filter(l => l.module_id === moduleId);
    if (moduleLessons.length === 0) return 0;
    const completed = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  const isModuleLocked = (index: number) => {
    if (index === 0) return false;
    const prevModule = modules[index - 1];
    const prevProgress = getModuleProgress(prevModule.id || '');
    return prevProgress < 100;
  };

  return (
    <div className="relative py-8">
      {/* Línea de progreso vertical */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-700" />
      
      <div className="space-y-8">
        {modules.map((module, index) => {
          const progress = getModuleProgress(module.id || '');
          const isLocked = isModuleLocked(index);
          const isCompleted = progress === 100;
          const isCurrent = module.id === currentModuleId;
          const isEven = index % 2 === 0;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'} gap-8`}
            >
              {/* Nodo central */}
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                <motion.div
                  whileHover={!isLocked ? { scale: 1.1 } : {}}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-lg ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-blue-500 text-white shadow-blue-500/30 ring-4 ring-blue-200 dark:ring-blue-900'
                      : isLocked
                      ? 'bg-slate-300 dark:bg-slate-600 text-slate-500'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>
              </div>

              {/* Tarjeta del módulo */}
              <div className={`w-5/12 ${isEven ? 'text-right pr-8' : 'text-left pl-8'}`}>
                <motion.div
                  whileHover={!isLocked ? { y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } : {}}
                  onClick={() => !isLocked && module.id && onSelectModule(module.id)}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                      : isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/30'
                      : isLocked
                      ? 'border-slate-200 dark:border-slate-700 opacity-60'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-3 ${isEven ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Módulo {index + 1}
                    </span>
                    {isCompleted && (
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                        Completado
                      </span>
                    )}
                    {isCurrent && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                        En progreso
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {module.description}
                  </p>

                  {/* Barra de progreso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Progreso</span>
                      <span className={`font-bold ${
                        isCompleted ? 'text-emerald-600' : 'text-blue-600'
                      }`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${
                          isCompleted 
                            ? 'bg-emerald-500' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                      />
                    </div>
                  </div>

                  {!isLocked && (
                    <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${
                      isEven ? 'justify-end' : 'justify-start'
                    } ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>
                      <span>{isCompleted ? 'Ver de nuevo' : 'Continuar'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Espacio vacío para el otro lado */}
              <div className="w-5/12" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPath;
