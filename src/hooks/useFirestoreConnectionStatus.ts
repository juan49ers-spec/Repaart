import { useState, useEffect } from 'react';
import { onSnapshotsInSync } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logMessage } from '../services/errorLogger';

/**
 * useFirestoreConnectionStatus - Hook para detectar el estado de conexión a Firestore
 * 
 * Muestra si la app está sincronizada con el servidor o trabajando localmente
 * Útil para mostrar indicadores de conexión en la UI
 * 
 * Usage:
 * ```typescript
 * const { isOnline, isSyncing } = useFirestoreConnectionStatus();
 * 
 * return (
 *   <div>
 *     {isOnline ? '🟢 Online' : '🟡 Offline'}
 *     {isSyncing && 'Sincronizando...'}
 *   </div>
 * );
 * ```
 */
export function useFirestoreConnectionStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Escuchar cambios de sincronización
    const unsubscribe = onSnapshotsInSync(db, () => {
      // Se llama cuando todos los snapshots están sincronizados con el servidor
      setIsOnline(true);
      setIsSyncing(false);
    });

    // Detectar estado online/offline del navegador
    const handleOnline = () => {
      setIsOnline(true);
      logMessage('Conexión restaurada', 'info');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logMessage('Conexión perdida - trabajando offline', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Estado inicial ya manejado por el inicializador de useState

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isSyncing,
    status: isOnline ? 'online' : 'offline',
  };
}

export default useFirestoreConnectionStatus;
