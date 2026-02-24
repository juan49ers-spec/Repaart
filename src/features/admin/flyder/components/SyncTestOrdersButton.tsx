import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import { Play, RefreshCw, Check, AlertCircle, Beaker } from 'lucide-react';

export const SyncTestOrdersButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!window.confirm('¿Sincronizar los 2,150 pedidos de Flyder Test Business?')) {
      return;
    }

    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const syncFn = httpsCallable(functions, 'syncTestBusinessOrders');
      const response = await syncFn({});
      const data = response.data as any;
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error sincronizando pedidos de test');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Beaker className="w-6 h-6 text-purple-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Sincronizar Pedidos de Test
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Sincroniza los 2,150 pedidos faltantes de &quot;Flyder Test Business&quot; (ID: 12).
            Estos son los últimos pedidos que faltan para completar los 102,720.
          </p>

          {!result && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 shadow-lg disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Sincronizar Pedidos de Test
                </>
              )}
            </button>
          )}

          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-medium">¡Completado!</span>
              </div>
              <p className="text-sm text-green-600">
                Pedidos de test sincronizados: <strong>{result.stats?.synced || 0}</strong>
              </p>
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

export default SyncTestOrdersButton;
