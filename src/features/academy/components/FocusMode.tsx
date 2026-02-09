import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Moon, Sun, Type } from 'lucide-react';

interface FocusModeProps {
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const FocusMode: React.FC<FocusModeProps> = ({ isActive, onToggle, children }) => {
  const [fontSize, setFontSize] = useState(16);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  return (
    <>
      {/* Botón para activar modo focus */}
      {!isActive && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-full shadow-2xl hover:shadow-3xl transition-shadow"
          title="Modo Focus"
        >
          <Maximize2 className="w-6 h-6" />
        </motion.button>
      )}

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 overflow-y-auto ${
              isDark ? 'bg-slate-950' : 'bg-white'
            }`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* Header con controles */}
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className={`sticky top-0 z-10 px-6 py-4 border-b ${
                isDark 
                  ? 'bg-slate-950/90 border-slate-800' 
                  : 'bg-white/90 border-slate-200'
              } backdrop-blur-md`}
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Control de tamaño de fuente */}
                  <div className="flex items-center gap-2">
                    <Type className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <button
                      onClick={() => setFontSize(Math.max(14, fontSize - 1))}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isDark 
                          ? 'hover:bg-slate-800 text-slate-300' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      A-
                    </button>
                    <span className={`text-sm font-medium w-8 text-center ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {fontSize}px
                    </span>
                    <button
                      onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isDark 
                          ? 'hover:bg-slate-800 text-slate-300' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      A+
                    </button>
                  </div>

                  {/* Toggle tema */}
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-slate-800 text-yellow-400' 
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  onClick={onToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir del modo focus</span>
                </button>
              </div>
            </motion.div>

            {/* Contenido */}
            <div className={`max-w-4xl mx-auto px-6 py-12 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FocusMode;
