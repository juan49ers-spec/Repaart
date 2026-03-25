import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * InstallPrompt - Componente para instalar la PWA
 * 
 * Muestra un banner para instalar la app cuando está disponible.
 * Soporta de manera nativa Android/Desktop (beforeinstallprompt)
 * y muestra instrucciones manuales para iOS (Safari).
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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Verificar si ya está instalada (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Comprobar dismiss previo (últimas 24h)
    const dismissed = localStorage.getItem('installPromptDismissed');
    let canShow = true;
    if (dismissed) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) canShow = false;
    }

    if (!canShow) return;

    // 3. Detección de iOS (Safari/Chrome en iPhone/iPad no lanzan beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIos(true);
      setIsVisible(true);
    }

    // 4. Capturar el evento beforeinstallprompt (Android / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isIosDevice) {
        setIsVisible(true);
      }
    };

    // 5. Escuchar cuando se instala satisfactoriamente
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
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-24 xl:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px]',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'rounded-2xl shadow-2xl',
        'p-5 z-50',
        'animate-in slide-in-from-bottom-5',
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
          {title}
        </h3>
        <button
          onClick={handleDismiss}
          className="p-1 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isIos ? (
        // UI Especial para iOS (Instrucciones manuales)
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Instala Repaart en tu dispositivo para tener notificaciones y acceso directo a tu agenda.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
            <ol className="text-sm text-slate-700 dark:text-slate-300 space-y-3 font-medium">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs">1</span>
                Pulsa el botón de Compartir <Share className="w-4 h-4 text-blue-500 mx-1 inline" /> en la barra inferior (o superior) de Safari.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs">2</span>
                Desliza hacia abajo y selecciona <strong>Añadir a la pantalla de inicio</strong> <PlusSquare className="w-4 h-4 text-slate-500 mx-1 inline" />.
              </li>
            </ol>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full mt-1 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold transition-transform active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      ) : (
        // UI Estándar para Android / Desktop (Automático)
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <Download className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex gap-3 mt-1">
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Instalar App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
