import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Zap } from 'lucide-react';

export type CelebrationType = 'module_complete' | 'level_up';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: CelebrationType;
  title: string;
  subtitle?: string;
  xpGained?: number;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  rotation: number;
  duration: number;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  type = 'module_complete',
  title,
  subtitle,
  xpGained
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Generar partículas de confeti con valores aleatorios pre-calculados
    const colors = type === 'level_up'
      ? ['#facc15', '#f59e0b', '#fbbf24', '#fef08a', '#eab308'] // Golds
      : ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa']; // Rainbow

    const newParticles: Particle[] = Array.from({ length: type === 'level_up' ? 80 : 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() > 0.5 ? 360 : -360,
      duration: 2 + Math.random() * 2
    }));

    // Use requestAnimationFrame to defer the state update
    requestAnimationFrame(() => {
      setParticles(newParticles);
    });

    // Auto-cerrar después de 5 segundos
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, onClose, type]);

  const isLevelUp = type === 'level_up';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Confeti */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                y: -20,
                x: `${particle.x}%`,
                opacity: 1,
                rotate: 0
              }}
              animate={{
                y: typeof window !== 'undefined' ? window.innerHeight + 20 : 1000,
                opacity: 0,
                rotate: particle.rotation
              }}
              transition={{
                duration: particle.duration,
                ease: "linear"
              }}
              className="fixed top-0 w-3 h-3 rounded-sm z-[100] pointer-events-none"
              style={{ backgroundColor: particle.color, left: `${particle.x}%` }}
            />
          ))}

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-[100] p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden pointer-events-auto">
              {/* Background decoration */}
              <div
                className={`absolute inset-0 bg-gradient-to-br pointer-events-none ${isLevelUp
                    ? 'from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20'
                    : 'from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20'
                  }`}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                title="Cerrar"
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <div className="relative z-10">
                {/* Icono animado */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full shadow-2xl mb-6 ${isLevelUp
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-amber-500/30'
                      : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-pink-500/30'
                    }`}
                >
                  {isLevelUp ? (
                    <Zap className="w-12 h-12 text-white fill-white" />
                  ) : (
                    <Trophy className="w-12 h-12 text-white" />
                  )}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-black text-slate-900 dark:text-white mb-2"
                >
                  {isLevelUp ? '¡Nivel Alcanzado!' : '¡Felicitaciones!'}
                </motion.h2>

                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-600 dark:text-slate-400 mb-6"
                  >
                    {subtitle}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`rounded-2xl p-4 mb-6 ${isLevelUp
                      ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30'
                      : 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30'
                    }`}
                >
                  <p className={`text-xl font-black ${isLevelUp ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                    }`}>
                    {title}
                  </p>
                </motion.div>

                {xpGained && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring' }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-6"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">+{xpGained} XP Ganados</span>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-shadow w-full ${isLevelUp
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/30 hover:shadow-orange-500/40'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/30 hover:shadow-purple-500/40'
                    }`}
                >
                  ¡Continuar!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;
