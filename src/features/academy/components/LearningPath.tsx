import React from 'react';
import { motion } from 'framer-motion';
import { AcademyModule } from '../../../services/academyService';
import { CheckCircle, Lock, Sparkles, Play, Trophy } from 'lucide-react';

interface LearningPathProps {
  modules: AcademyModule[];
  completedLessons: string[];
  allLessons: { module_id: string; id: string }[];
  currentModuleId?: string;
  onSelectModule: (moduleId: string) => void;
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
    <div className="relative py-12 px-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-5xl mx-auto space-y-6 relative">
        {modules.map((module, index) => {
          const progress = getModuleProgress(module.id || '');
          const isLocked = isModuleLocked(index);
          const isCompleted = progress === 100;
          const isCurrent = module.id === currentModuleId;
          const gradient = gradients[index % gradients.length];

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={!isLocked ? { 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 }
              } : {}}
              onClick={() => !isLocked && module.id && onSelectModule(module.id)}
              className={`relative cursor-pointer ${isLocked ? 'opacity-70' : ''}`}
            >
              {/* Conector con línea punteada */}
              {index > 0 && (
                <div className="absolute -top-6 left-8 w-0.5 h-6 border-l-2 border-dashed border-slate-300 dark:border-slate-600" />
              )}

              <div className={`
                relative overflow-hidden rounded-3xl
                ${isCurrent 
                  ? 'ring-4 ring-offset-4 ring-offset-white dark:ring-offset-slate-900 ring-blue-400 dark:ring-blue-500' 
                  : ''}
                ${isCompleted 
                  ? 'shadow-2xl shadow-emerald-500/20' 
                  : 'shadow-xl shadow-slate-200/50 dark:shadow-black/20'}
                transition-all duration-300
              `}>
                {/* Fondo con gradiente */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 
                  ${isCompleted ? 'opacity-20' : ''}
                `} />
                
                <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 sm:p-8">
                  <div className="flex items-start gap-5">
                    {/* Icono/Número del módulo */}
                    <motion.div 
                      className={`
                        relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl 
                        flex items-center justify-center shadow-lg
                        ${isCompleted 
                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30' 
                          : isLocked 
                            ? 'bg-slate-200 dark:bg-slate-700'
                            : `bg-gradient-to-br ${gradient} shadow-lg`
                        }
                      `}
                      whileHover={!isLocked ? { rotate: [0, -10, 10, 0], transition: { duration: 0.5 } } : {}}
                    >
                      {isCompleted ? (
                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      ) : isLocked ? (
                        <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                      ) : (
                        <span className="text-2xl sm:text-3xl font-black text-white">{index + 1}</span>
                      )}
                      
                      {/* Indicador de sparkle para el actual */}
                      {isCurrent && !isCompleted && !isLocked && (
                        <div className="absolute -top-1 -right-1">
                          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                        </div>
                      )}
                    </motion.div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Módulo {index + 1}
                        </span>
                        
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Completado
                          </span>
                        )}
                        
                        {isCurrent && !isCompleted && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                            <Play className="w-3 h-3" />
                            En progreso
                          </span>
                        )}
                        
                        {isLocked && (
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-full">
                            Bloqueado
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                        {module.title}
                      </h3>
                      
                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-4 line-clamp-2">
                        {module.description}
                      </p>

                      {/* Barra de progreso */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {isCompleted ? '¡Módulo completado!' : `${progress}% completado`}
                          </span>
                          <span className={`
                            font-bold
                            ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}
                          `}>
                            {progress}%
                          </span>
                        </div>
                        
                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                            className={`
                              h-full rounded-full
                              ${isCompleted 
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                                : `bg-gradient-to-r ${gradient}`
                              }
                            `}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Flecha indicadora */}
                    {!isLocked && (
                      <motion.div 
                        className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400"
                        whileHover={{ x: 5, backgroundColor: "#e2e8f0" }}
                      >
                        <Play className="w-5 h-5 ml-1" />
                      </motion.div>
                    )}
                  </div>
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
