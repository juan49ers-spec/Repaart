import { useState } from 'react';

/**
 * FlyderSyncButton - Placeholder Component
 * 
 * TODO: This component needs a proper Flyder integration service.
 * The original implementation referenced non-existent functions (mysqlConnect, getOrders).
 * Sync should be handled by a Cloud Function, not direct browser-to-MySQL connections.
 */
export const FlyderSyncButton = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const syncFromFlyder = async () => {
    setSyncing(true);
    setResult(null);

    try {
      // TODO: Replace with proper Cloud Function call
      // Example: const response = await httpsCallable(functions, 'syncFlyderOrders')();
      setResult('⚠️ Sync no implementado. Requiere Cloud Function.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setResult(`❌ Error: ${message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      <button
        onClick={syncFromFlyder}
        disabled={syncing}
        className={`bg-red-500 text-white px-5 py-3 rounded-lg font-bold transition-opacity ${syncing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-red-600'}`}
      >
        {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar Pedidos Flyder'}
      </button>
      {result && (
        <div className={`mt-2.5 p-2.5 text-white rounded-lg text-sm ${result.includes('✅') ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {result}
        </div>
      )}
    </div>
  );
};
