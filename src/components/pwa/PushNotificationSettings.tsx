import React, { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { ResponsiveCard } from '../ui/primitives/Card';
import { Switch } from '../ui/forms/Switch';

/**
 * PushNotificationSettings - Panel de configuración de notificaciones
 * 
 * Permite al usuario activar/desactivar notificaciones push
 * 
 * Usage:
 * ```tsx
 * <PushNotificationSettings />
 * ```
 */
export const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    subscription,
    subscribe,
    unsubscribe,
    requestPermission
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (subscription) {
        // Desactivar
        const success = await unsubscribe();
        if (success) {
          setMessage('Notificaciones desactivadas');
        }
      } else {
        // Activar
        if (permission !== 'granted') {
          const newPermission = await requestPermission();
          if (newPermission !== 'granted') {
            setMessage('Permiso denegado. Activa las notificaciones en la configuración de tu navegador.');
            setIsLoading(false);
            return;
          }
        }

        const success = await subscribe();
        if (success) {
          setMessage('¡Notificaciones activadas!');
        } else {
          setMessage('Error al activar notificaciones');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error al cambiar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <ResponsiveCard className="p-6">
        <div className="flex items-center gap-4 text-slate-500">
          <BellOff className="w-6 h-6" />
          <p>Las notificaciones push no están soportadas en este navegador</p>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveCard className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            subscription 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          )}>
            {subscription ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Notificaciones Push
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {subscription 
                ? 'Recibirás notificaciones incluso cuando la app esté cerrada'
                : 'Activa para recibir alertas importantes'
              }
            </p>
            
            {message && (
              <div className={cn(
                'mt-3 p-3 rounded-lg text-sm flex items-center gap-2',
                message.includes('Error') || message.includes('denegado')
                  ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
              )}>
                {message.includes('Error') || message.includes('denegado') ? (
                  <><BellOff className="w-4 h-4" /> {message}</>
                ) : (
                  <><Check className="w-4 h-4" /> {message}</>
                )}
              </div>
            )}
          </div>
        </div>

        <Switch
          checked={!!subscription}
          onChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      {permission === 'denied' && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Has bloqueado las notificaciones. Para activarlas, ve a la configuración de tu navegador &gt; Privacidad y seguridad &gt; Notificaciones.
          </p>
        </div>
      )}
    </ResponsiveCard>
  );
};

// Helper
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default PushNotificationSettings;
