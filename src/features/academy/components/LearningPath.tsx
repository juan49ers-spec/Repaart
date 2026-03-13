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

const gradients = [
  'from-rose-400 via-pink-500 to-purple-600',
  'from-blue-400 via-indigo-500 to-purple-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-amber-400 via-orange-500 to-red-600',
  'from-violet-400 via-purple-500 to-fuchsia-600',
];

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
      {/* Fondo decorativo mejorado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300 dark:bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-300 dark:bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto flex flex-col gap-4 relative group/path">
        {modules.map((module, index) => {
          const progress = getModuleProgress(module.id || '');
          const isLocked = isModuleLocked(index);
          const isCompleted = progress === 100;
          const isCurrent = module.id === currentModuleId;
          const gradient = gradients[index % gradients.length];

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
                relative overflow-hidden rounded-2xl border transition-all duration-300
                ${isCurrent
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/10'
                  : isCompleted
                    ? 'bg-emerald-50/30 dark:bg-emerald-900/5 border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm'}
              `}>
                <div className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-6">
                  {/* Left: Icon/Number Block */}
                  <div className={`
                    flex-shrink-0 w-16 h-16 rounded-2xl 
                    flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110
                    ${isCompleted
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 rotate-3'
                      : isLocked
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : `bg-gradient-to-br ${gradient} -rotate-3 group-hover:rotate-0`
                    }
                  `}>
                    {isCompleted ? (
                      <Trophy className="w-8 h-8 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-7 h-7 text-slate-400" />
                    ) : (
                      <span className="text-2xl font-black text-white">{index + 1}</span>
                    )}
                  </div>

                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400">
                        Módulo {index + 1}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider w-fit mx-auto md:mx-0">
                          <CheckCircle className="w-3 h-3" /> Completado
                        </span>
                      )}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider animate-pulse w-fit mx-auto md:mx-0">
                          <Play className="w-3 h-3" /> En curso
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                      {module.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-1">
                      {module.description}
                    </p>
                  </div>

                  {/* Right: Progress Section */}
                  <div className="flex-shrink-0 w-full md:w-48 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className="text-slate-400 uppercase tracking-widest">Progreso</span>
                      <span className={`${isCompleted ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : `bg-gradient-to-r ${gradient}`}`}
                      />
                    </div>
                  </div>

                  {/* Action Arrow */}
                  {!isLocked && (
                    <div className="hidden md:flex items-center text-slate-300 group-hover:text-blue-500 transition-colors">
                      <Play className="w-6 h-6 fill-current" />
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
