import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2 } from 'lucide-react';

interface ModuleSkeletonProps {
  count?: number;
}

export const ModuleSkeleton: React.FC<ModuleSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-lg"
        >
          <div className="flex items-start gap-5">
            {/* Skeleton Icon */}
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse" />
            
            {/* Skeleton Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mt-4" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const EmptyState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <motion.div
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-3xl mb-6"
    >
      <BookOpen className="w-12 h-12 text-purple-400" />
    </motion.div>
    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
      ¡Próximamente!
    </h3>
    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
      Estamos preparando contenido increíble para ti. <br />
      Vuelve pronto para comenzar tu viaje de aprendizaje.
    </p>
  </motion.div>
);

export const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="w-12 h-12 text-purple-500" />
    </motion.div>
    <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
      Cargando tu ruta de aprendizaje...
    </p>
  </div>
);
