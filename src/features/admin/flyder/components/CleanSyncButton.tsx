import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import { Play, RefreshCw, Check, AlertCircle, Trash2 } from 'lucide-react';

export const CleanSyncButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCleanSync = async () => {
    if (!window.confirm(
      '⚠️ ATENCIÓN: Sincronización Limpia\n\n' +
      'Esto hará:\n' +
      '1. Borrar TODOS los pedidos de Flyder existentes en Repaart\n' +
      '2. Sincronizar exactamente los 102,720 pedidos de Flyder desde cero\n\n' +
      'Al final tendrás exactamente los pedidos que hay en Flyder, ni más ni menos.\n\n' +
      '¿Estás seguro?'
    )) {
      return;
    }

    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const syncFn = httpsCallable(functions, 'cleanAndSyncAllOrders');
      const response = await syncFn({});
      const data = response.data as any;
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error en sincronización limpia');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Sincronización Limpia (Professional)
          </h3>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Borra todos los pedidos de Flyder existentes y sincroniza exactamente los 102,720 pedidos 
            que hay en Flyder. Al final tendrás el número exacto, ni más ni menos.
          </p>

          {!result && (
            <button
              onClick={handleCleanSync}
              disabled={syncing}
              className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 shadow-lg disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Sincronización Limpia Total
                </>
              )}
            </button>
          )}

          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <Check className="w-5 h-5" />
                <span className="font-medium">¡Sincronización limpia completada!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-white dark:bg-slate-800 rounded">
                  <span className="text-slate-500">Borrados: </span>
                  <strong>{result.stats?.deleted || 0}</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded">
                  <span className="text-slate-500">En Flyder: </span>
                  <strong>{result.stats?.flyderTotal || 0}</strong>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded">
                  <span className="text-green-700">Sincronizados: </span>
                  <strong className="text-green-700">{result.stats?.synced || 0}</strong>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                  <span className="text-blue-700">Total Final: </span>
                  <strong className="text-blue-700">{result.stats?.finalTotal || 0}</strong>
                </div>
              </div>
              
              {result.stats?.finalTotal !== result.stats?.flyderTotal && (
                <p className="mt-3 text-sm text-amber-600">
                  ⚠️ Diferencia: {result.stats?.skipped || 0} pedidos omitidos (sin mapeo de franquicia)
                </p>
              )}
              
              <button
                onClick={() => setResult(null)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Ejecutar de nuevo
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanSyncButton;
