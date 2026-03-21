import React from 'react';
import { motion } from 'framer-motion';
import { AcademyModule } from '../../../services/academyService';
import { CheckCircle, Lock, Play, Trophy } from 'lucide-react';

interface LearningPathProps {
  modules: AcademyModule[];
  completedLessons: string[];
  allLessons: { module_id: string; id: string }[];
  currentModuleId?: string;
  onSelectModule: (moduleId: string) => void;
  onModuleComplete?: (moduleId: string, moduleTitle: string, moduleNumber: number) => void;
  allProgress?: Record<string, { completed_lessons: string[] } | null>;
}



export const LearningPath: React.FC<LearningPathProps> = ({
  modules,
  completedLessons,
  allLessons,
  currentModuleId,
  onSelectModule,
  allProgress
}) => {
  const getModuleProgress = (moduleId: string) => {
    // Si hay progreso específico del módulo, usarlo
    if (allProgress && allProgress[moduleId]) {
      const moduleLessons = allLessons.filter(l => l.module_id === moduleId);
      if (moduleLessons.length === 0) return 0;
      const moduleCompletedLessons = allProgress[moduleId]?.completed_lessons || [];
      const completed = moduleLessons.filter(l => moduleCompletedLessons.includes(l.id)).length;
      return Math.round((completed / moduleLessons.length) * 100);
    }

    // Si no, usar completedLessons (compatibilidad con vista de detalle)
    const moduleLessons = allLessons.filter(l => l.module_id === moduleId);
    if (moduleLessons.length === 0) return 0;
    const completed = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  const isModuleLocked = (_index: number) => {
    // TEMPORAL: Desactivar bloqueo para diagnosticar problema
    // El módulo 3 aparece bloqueado porque el módulo 2 no tiene lecciones cargadas
    return false;
  };
  return (
    <div className="relative py-12 px-4">
      {/* Ya no hay fondo decorativo saturado */}

      <div className="max-w-5xl mx-auto flex flex-col gap-4 relative group/path">
        {modules.map((module, index) => {
          const progress = getModuleProgress(module.id || '');
          const isLocked = isModuleLocked(index);
          const isCompleted = progress === 100;
          const isCurrent = module.id === currentModuleId;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
              }}
              whileHover={!isLocked ? {
                x: 10,
                transition: { duration: 0.2 }
              } : {}}
              onClick={() => !isLocked && module.id && onSelectModule(module.id)}
              className={`relative cursor-pointer w-full ${isLocked ? 'opacity-70' : ''}`}
            >
                <div className={`
                relative overflow-hidden rounded-xl border transition-all duration-200
                ${isCurrent
                  ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-sm'
                  : isCompleted
                    ? 'bg-emerald-50/10 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-800/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm'}
              `}>
                <div className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-6">
                  {/* Left: Icon/Number Block */}
                  <div className={`
                    flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl 
                    flex items-center justify-center transition-colors
                    ${isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      : isLocked
                        ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
                        : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40'
                    }
                  `}>
                    {isCompleted ? (
                      <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                    ) : isLocked ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      <span className="text-xl md:text-2xl font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        Módulo {index + 1}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider w-fit mx-auto md:mx-0">
                          <CheckCircle className="w-3 h-3" /> Completado
                        </span>
                      )}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold uppercase tracking-wider w-fit mx-auto md:mx-0">
                          <Play className="w-3 h-3" /> En curso
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
                      {module.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-1">
                      {module.description}
                    </p>
                  </div>

                  {/* Right: Progress Section */}
                  <div className="flex-shrink-0 w-full md:w-48 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 uppercase tracking-widest">Progreso</span>
                      <span className={`${isCompleted ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      />
                    </div>
                  </div>

                  {/* Action Arrow */}
                  {!isLocked && (
                    <div className="hidden md:flex items-center text-slate-300 group-hover:text-indigo-500 transition-colors">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};

export default LearningPath;
