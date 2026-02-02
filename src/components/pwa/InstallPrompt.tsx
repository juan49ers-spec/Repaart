import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * InstallPrompt - Componente para instalar la PWA
 * 
 * Muestra un banner para instalar la app cuando está disponible
 * Se oculta automáticamente después de instalar
 * 
 * Usage:
 * ```tsx
 * <InstallPrompt 
 *   title="Instalar Repaart"
 *   description="Accede rápidamente desde tu pantalla de inicio"
 * />
 * ```
 */
interface InstallPromptProps {
  title?: string;
  description?: string;
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  title = 'Instalar Repaart',
  description = 'Accede rápidamente desde tu pantalla de inicio',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Capturar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    // Escuchar cuando se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      const result = await deferredPrompt.prompt();
      
      if (result.outcome === 'accepted') {
        console.log('[PWA] App installed');
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('[PWA] Install error:', error);
    } finally {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Guardar en localStorage para no mostrar de nuevo
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // No mostrar si ya está instalada o si el usuario la dismissió recientemente
  if (isInstalled || !isVisible) return null;

  // Verificar si el usuario dismissió en las últimas 24 horas
  const dismissed = localStorage.getItem('installPromptDismissed');
  if (dismissed) {
    const hoursSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'rounded-2xl shadow-2xl',
        'p-4 z-50',
        'animate-in slide-in-from-bottom-4',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {description}
          </p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
