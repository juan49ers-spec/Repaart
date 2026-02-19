import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import { Play, RefreshCw, Check, AlertCircle, Database } from 'lucide-react';

export const SyncRemainingButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!window.confirm(
      '¿Sincronizar TODOS los pedidos faltantes?\n\n' +
      'Este proceso sincronizará todos los pedidos mes por mes. ' +
      'Puede tardar varios minutos. No cierres la página.'
    )) {
      return;
    }

    setSyncing(true);
    setError(null);
    setResult(null);

    // Generar meses desde 2024-01 hasta 2025-02
    const months = [];
    for (let year = 2024; year <= 2025; year++) {
      for (let month = 1; month <= 12; month++) {
        if (year === 2025 && month > 2) break;
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = `${year}-${String(month).padStart(2, '0')}-31`;
        months.push({ start, end, label: `${month}/${year}` });
      }
    }

    let totalSynced = 0;
    let totalSkipped = 0;

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      try {
        const syncFn = httpsCallable(functions, 'syncAllRemainingOrders');
        const response = await syncFn({
          startDate: month.start,
          endDate: month.end
        });
        const data = response.data as any;
        
        if (data.stats) {
          totalSynced += data.stats.synced;
          totalSkipped += data.stats.skipped;
        }

        // Pequeña pausa entre meses
        if (i < months.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (err: any) {
        console.error(`Error en ${month.label}:`, err);
        setError(`Error en ${month.label}: ${err.message}`);
      }
    }

    setResult({
      success: true,
      message: `Sincronización completada`,
      stats: { synced: totalSynced, skipped: totalSkipped }
    });
    setSyncing(false);
  };

  return (
    <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Database className="w-6 h-6 text-green-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Sincronizar Pedidos Faltantes
          </h3>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Sincroniza todos los pedidos de Flyder que aún no están en Repaart. 
            Esta función verifica primero cuáles faltan y solo sincroniza esos.
          </p>

          {!result && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 shadow-lg disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Sincronizar Todos los Faltantes
                </>
              )}
            </button>
          )}

          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <Check className="w-5 h-5" />
                <span className="font-medium">¡Sincronización completada!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-white dark:bg-slate-800 rounded">
                  <span className="text-slate-500">Total en Flyder: </span>
                  <strong>{result.stats?.total || 0}</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded">
                  <span className="text-slate-500">Ya existían: </span>
                  <strong>{result.stats?.existing || 0}</strong>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded">
                  <span className="text-green-700">Sincronizados: </span>
                  <strong className="text-green-700">{result.stats?.synced || 0}</strong>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded">
                  <span className="text-amber-700">Omitidos: </span>
                  <strong className="text-amber-700">{result.stats?.skipped || 0}</strong>
                </div>
              </div>
              
              <button
                onClick={() => setResult(null)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Sincronizar de nuevo
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

export default SyncRemainingButton;
