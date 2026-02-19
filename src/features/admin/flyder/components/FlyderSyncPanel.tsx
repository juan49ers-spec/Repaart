import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import {
  Database,
  MapPin,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  Tag,
  Shield,
  BarChart3,
  Beaker
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { FixFranchisesButton } from './FixFranchisesButton';
import { BulkSyncButton } from './BulkSyncButton';
import { CreateTestFranchiseButton } from './CreateTestFranchiseButton';
import { SyncRemainingButton } from './SyncRemainingButton';
import { CleanSyncButton } from './CleanSyncButton';
import { SyncTestOrdersButton } from './SyncTestOrdersButton';

interface FranchiseMapping {
  id: string;
  flyderBusinessId: number;
  flyderBusinessName: string;
  repaartFranchiseId: string;
  createdAt: any;
}

interface SyncProgress {
  totalOrders: number;
  processedOrders: number;
  syncedOrders: number;
  skippedOrders: number;
  failedOrders: number;
  batchesCompleted: number;
  currentBatch: number;
  estimatedTotalBatches: number;
}

export const FlyderSyncPanel: React.FC = () => {
  const [mappings, setMappings] = useState<FranchiseMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creatingMain, setCreatingMain] = useState(false);
  const [createResult, setCreateResult] = useState<any>(null);
  const [assigningIds, setAssigningIds] = useState(false);
  const [assignResult, setAssignResult] = useState<any>(null);
  const [ensuring, setEnsuring] = useState(false);
  const [ensureResult, setEnsureResult] = useState<any>(null);
  const [counting, setCounting] = useState(false);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [checkingBusinesses, setCheckingBusinesses] = useState(false);
  const [businessesStatus, setBusinessesStatus] = useState<any>(null);
  const [creatingMappings, setCreatingMappings] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);

  // Form for new mapping
  const [formData, setFormData] = useState({
    flyderBusinessId: '',
    flyderBusinessName: '',
    repaartFranchiseId: ''
  });

  const createMainFranchises = async () => {
    if (!window.confirm(
      '¿Crear las 7 franquicias principales de Flyder?\n\n' +
      'Se crearán:\n' +
      '- Repaart Cáceres (ID: 6)\n' +
      '- Repaart Plasencia (ID: 9)\n' +
      '- Repaart Martos (ID: 19)\n' +
      '- Repaart Toledo (ID: 22)\n' +
      '- Repaart Torremolinos (ID: 15)\n' +
      '- Reepart Navalmoral (ID: 7)\n' +
      '- Honze Cuenca (ID: 28)'
    )) {
      return;
    }

    setCreatingMain(true);
    setError(null);
    setCreateResult(null);

    try {
      const createFn = httpsCallable(functions, 'createMainFlyderFranchises');
      const response = await createFn({});
      const data = response.data as any;
      setCreateResult(data);
      setSuccess(`Franquicias creadas: ${data.results.created.length}`);
    } catch (err: any) {
      setError(err.message || 'Error creando franquicias');
      console.error(err);
    } finally {
      setCreatingMain(false);
    }
  };

  const assignFlyderIds = async () => {
    if (!window.confirm(
      '¿Asignar Flyder IDs a las franquicias principales?\n\n' +
      'Se asignarán los IDs a:\n' +
      '- Repaart Cáceres → ID 6\n' +
      '- Repaart Plasencia → ID 9\n' +
      '- Repaart Martos → ID 19\n' +
      '- Repaart Toledo → ID 22\n' +
      '- Repaart Torremolinos → ID 15\n' +
      '- Reepart Navalmoral → ID 7\n' +
      '- Honze Cuenca → ID 28'
    )) {
      return;
    }

    setAssigningIds(true);
    setError(null);
    setAssignResult(null);

    try {
      const assignFn = httpsCallable(functions, 'assignFlyderIdsToFranchises');
      const response = await assignFn({});
      const data = response.data as any;
      setAssignResult(data);
      setSuccess(`IDs asignados: ${data.results.updated.length}`);
    } catch (err: any) {
      setError(err.message || 'Error asignando IDs');
      console.error(err);
    } finally {
      setAssigningIds(false);
    }
  };

  const ensureFranchises = async () => {
    if (!window.confirm(
      '¿Crear/Actualizar franquicias principales?\n\n' +
      'Esto creará o actualizará:\n' +
      '- Repaart Cáceres (ID: 6)\n' +
      '- Repaart Plasencia (ID: 9)\n' +
      '- Repaart Martos (ID: 19)\n' +
      '- Repaart Toledo (ID: 22)\n' +
      '- Repaart Torremolinos (ID: 15)\n' +
      '- Reepart Navalmoral (ID: 7)\n' +
      '- Honze Cuenca (ID: 28)'
    )) {
      return;
    }

    setEnsuring(true);
    setError(null);
    setEnsureResult(null);

    try {
      const ensureFn = httpsCallable(functions, 'ensureMainFranchisesExist');
      const response = await ensureFn({});
      const data = response.data as any;
      setEnsureResult(data);
      setSuccess(`Franquicias aseguradas: ${data.results.created.length} creadas, ${data.results.updated.length} actualizadas`);
    } catch (err: any) {
      setError(err.message || 'Error asegurando franquicias');
      console.error(err);
    } finally {
      setEnsuring(false);
    }
  };

  const countOrders = async () => {
    setCounting(true);
    setError(null);
    setOrderStats(null);

    try {
      const countFn = httpsCallable(functions, 'countRepaartOrders');
      const response = await countFn({});
      const data = response.data as any;
      setOrderStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'Error contando pedidos');
      console.error(err);
    } finally {
      setCounting(false);
    }
  };

  const checkBusinesses = async () => {
    setCheckingBusinesses(true);
    setError(null);
    setBusinessesStatus(null);

    try {
      const checkFn = httpsCallable(functions, 'getFlyderBusinessesWithOrders');
      const response = await checkFn({});
      const data = response.data as any;
      setBusinessesStatus(data);
    } catch (err: any) {
      setError(err.message || 'Error verificando franquicias');
      console.error(err);
    } finally {
      setCheckingBusinesses(false);
    }
  };

  const createMissingMaps = async () => {
    setCreatingMappings(true);
    setError(null);

    try {
      const createFn = httpsCallable(functions, 'createMissingMappings');
      const response = await createFn({});
      const data = response.data as any;
      setSuccess(`Mapeos creados: ${data.results.created.length}`);
      loadMappings();
    } catch (err: any) {
      setError(err.message || 'Error creando mapeos');
      console.error(err);
    } finally {
      setCreatingMappings(false);
    }
  };

  const createTestFranchiseHandler = async () => {
    setCreatingTest(true);
    setError(null);

    try {
      const createFn = httpsCallable(functions, 'createTestFranchise');
      const response = await createFn({});
      const data = response.data as any;
      setSuccess(`Franquicia de test ${data.action === 'created' ? 'creada' : 'ya existía'}`);
      loadMappings();
    } catch (err: any) {
      setError(err.message || 'Error creando franquicia de test');
      console.error(err);
    } finally {
      setCreatingTest(false);
    }
  };

  // Load mappings on mount
  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const listMappingsFn = httpsCallable(functions, 'listFranchiseMappings');
      const result = await listMappingsFn({});
      const data = result.data as any;
      setMappings(data.mappings || []);
    } catch (err: any) {
      setError(err.message || 'Error cargando mapeos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const createMappingFn = httpsCallable(functions, 'createFranchiseMapping');
      await createMappingFn({
        flyderBusinessId: parseInt(formData.flyderBusinessId),
        flyderBusinessName: formData.flyderBusinessName,
        repaartFranchiseId: formData.repaartFranchiseId
      });

      setSuccess('Mapeo creado exitosamente');
      setFormData({ flyderBusinessId: '', flyderBusinessName: '', repaartFranchiseId: '' });
      loadMappings();
    } catch (err: any) {
      setError(err.message || 'Error creando mapeo');
      console.error(err);
    }
  };

  const startSync = async () => {
    setError(null);
    setSuccess(null);
    setSyncing(true);
    setProgress(null);

    // Sincronizar por meses para evitar timeout
    const months = [
      { start: '2024-01-01', end: '2024-01-31', label: 'Enero 2024' },
      { start: '2024-02-01', end: '2024-02-29', label: 'Febrero 2024' },
      { start: '2024-03-01', end: '2024-03-31', label: 'Marzo 2024' },
      { start: '2024-04-01', end: '2024-04-30', label: 'Abril 2024' },
      { start: '2024-05-01', end: '2024-05-31', label: 'Mayo 2024' },
      { start: '2024-06-01', end: '2024-06-30', label: 'Junio 2024' },
      { start: '2024-07-01', end: '2024-07-31', label: 'Julio 2024' },
      { start: '2024-08-01', end: '2024-08-31', label: 'Agosto 2024' },
      { start: '2024-09-01', end: '2024-09-30', label: 'Septiembre 2024' },
      { start: '2024-10-01', end: '2024-10-31', label: 'Octubre 2024' },
      { start: '2024-11-01', end: '2024-11-30', label: 'Noviembre 2024' },
      { start: '2024-12-01', end: '2024-12-31', label: 'Diciembre 2024' },
      { start: '2025-01-01', end: '2025-01-31', label: 'Enero 2025' },
      { start: '2025-02-01', end: '2025-02-15', label: 'Febrero 2025 (hasta hoy)' }
    ];

    let totalSynced = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const month of months) {
      try {
        console.log(`Sincronizando ${month.label}...`);
        const syncFn = httpsCallable(functions, 'syncFlyderHistoricalOrders');
        const result = await syncFn({
          startDate: month.start,
          endDate: month.end,
          batchSize: 500
        });

        const data = result.data as any;
        totalSynced += data.progress.syncedOrders;
        totalSkipped += data.progress.skippedOrders;
        totalFailed += data.progress.failedOrders;
        
        console.log(`${month.label}: ${data.progress.syncedOrders} sincronizados`);
      } catch (err: any) {
        console.error(`Error en ${month.label}:`, err);
        setError(`Error en ${month.label}: ${err.message}`);
      }
    }

    setProgress({
      totalOrders: totalSynced + totalSkipped + totalFailed,
      processedOrders: totalSynced + totalSkipped + totalFailed,
      syncedOrders: totalSynced,
      skippedOrders: totalSkipped,
      failedOrders: totalFailed,
      batchesCompleted: months.length,
      currentBatch: months.length,
      estimatedTotalBatches: months.length
    });
    
    setSuccess(`Sincronización completada: ${totalSynced} pedidos sincronizados`);
    setSyncing(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Sincronización Flyder
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Importa pedidos históricos de Flyder hacia Repaart
          </p>
        </div>
        <button
          onClick={loadMappings}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Fix Franchises Section */}
      <FixFranchisesButton />

      {/* Bulk Sync Button */}
      <BulkSyncButton />

      {/* Create Test Franchise Button */}
      <CreateTestFranchiseButton />

      {/* Sync Remaining Orders Button */}
      <SyncRemainingButton />

      {/* Clean Sync Button - Professional */}
      <CleanSyncButton />

      {/* Sync Test Orders Button */}
      <SyncTestOrdersButton />

      {/* Create Main Franchises */}
      <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Crear Franquicias Principales
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Crea las 7 franquicias principales que tienen la mayoría de pedidos en Flyder: 
              Cáceres, Plasencia, Martos, Toledo, Torremolinos, Navalmoral y Cuenca.
            </p>

            <button
              onClick={createMainFranchises}
              disabled={creatingMain}
              className={cn(
                'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                creatingMain
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              )}
            >
              {creatingMain ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Crear 7 Franquicias Principales
                </>
              )}
            </button>

            {createResult && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{createResult.results.created.length}</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Creadas</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{createResult.results.alreadyExist.length}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Ya existían</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{createResult.results.errors.length}</p>
                  <p className="text-xs text-red-700 dark:text-red-300">Errores</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Flyder IDs */}
      <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Tag className="w-6 h-6 text-emerald-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Asignar Flyder IDs
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Asigna los Flyder IDs a las franquicias principales para que puedan recibir sus pedidos históricos.
            </p>

            <button
              onClick={assignFlyderIds}
              disabled={assigningIds}
              className={cn(
                'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                assigningIds
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              )}
            >
              {assigningIds ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4" />
                  Asignar IDs a Franquicias
                </>
              )}
            </button>

            {assignResult && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{assignResult.results.updated.length}</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Actualizadas</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">{assignResult.results.notFound.length}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">No encontradas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ensure Main Franchises */}
      <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-cyan-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Asegurar Franquicias Principales
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Crea o actualiza las 7 franquicias principales con sus Flyder IDs correctos y crea los mapeos necesarios.
            </p>

            <button
              onClick={ensureFranchises}
              disabled={ensuring}
              className={cn(
                'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                ensuring
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              )}
            >
              {ensuring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Asegurando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Asegurar Franquicias
                </>
              )}
            </button>

            {ensureResult && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{ensureResult.results.created.length}</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Creadas</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{ensureResult.results.updated.length}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Actualizadas</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-600">{ensureResult.results.skipped.length}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">Ya OK</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {progress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border-l-4 border-blue-500">
            <p className="text-xs text-slate-500 uppercase">Total</p>
            <p className="text-2xl font-bold">{progress.totalOrders}</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-green-500">
            <p className="text-xs text-slate-500 uppercase">Sincronizados</p>
            <p className="text-2xl font-bold">{progress.syncedOrders}</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-amber-500">
            <p className="text-xs text-slate-500 uppercase">Omitidos</p>
            <p className="text-2xl font-bold">{progress.skippedOrders}</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-red-500">
            <p className="text-xs text-slate-500 uppercase">Fallidos</p>
            <p className="text-2xl font-bold">{progress.failedOrders}</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {syncing && progress && (
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso</span>
            <span className="text-sm text-slate-500">
              Batch {progress.currentBatch} / {progress.estimatedTotalBatches}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${(progress.processedOrders / progress.totalOrders) * 100}%`
              }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {progress.processedOrders} de {progress.totalOrders} pedidos procesados
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* Order Statistics */}
      <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Estadísticas de Pedidos
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Verifica cuántos pedidos hay en Repaart y cuántos se han sincronizado desde Flyder.
            </p>

            <button
              onClick={countOrders}
              disabled={counting}
              className={cn(
                'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                counting
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              {counting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Contando...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Ver Estadísticas
                </>
              )}
            </button>

            {orderStats && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{orderStats.totalOrders}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Total Pedidos</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{orderStats.flyderOrders}</p>
                    <p className="text-xs text-green-700 dark:text-green-300">De Flyder</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{orderStats.repaartOnlyOrders}</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Solo Repaart</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pedidos por Franquicia:
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {orderStats.franchiseStats.map((f: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-200 dark:border-slate-700 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{f.name}</span>
                          {f.flyderBusinessId && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                              Flyder ID: {f.flyderBusinessId}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-600">{f.orderCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verify Flyder Businesses */}
      <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Verificar Franquicias de Flyder
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Verifica qué franquicias de Flyder tienen pedidos y cuáles faltan por mapear para sincronizar todos los pedidos.
            </p>

            <div className="flex gap-2">
              <button
                onClick={checkBusinesses}
                disabled={checkingBusinesses}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                  checkingBusinesses
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                )}
              >
                {checkingBusinesses ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Verificar Franquicias
                  </>
                )}
              </button>

              <button
                onClick={createMissingMaps}
                disabled={creatingMappings}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                  creatingMappings
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                )}
              >
                {creatingMappings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Crear Mapeos Faltantes
                  </>
                )}
              </button>
            </div>

            {businessesStatus && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{businessesStatus.totalBusinesses}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Franquicias con pedidos</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{businessesStatus.missingMappings?.length || 0}</p>
                    <p className="text-xs text-red-700 dark:text-red-300">Sin mapeo</p>
                  </div>
                </div>

                {businessesStatus.missingMappings?.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                      ⚠️ Franquicias sin mapeo ({businessesStatus.missingMappings.length}):
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {businessesStatus.missingMappings.map((b: any, i: number) => (
                        <div key={i} className="text-sm text-red-600 dark:text-red-400 flex justify-between">
                          <span>{b.name} (ID: {b.flyderId})</span>
                          <span className="font-bold">{b.orderCount} pedidos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Botón para crear franquicia de test - SIEMPRE visible */}
                <button
                  onClick={createTestFranchiseHandler}
                  disabled={creatingTest}
                  className={cn(
                    'mt-3 w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2',
                    creatingTest
                      ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  )}
                >
                  {creatingTest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creando franquicia de test...
                    </>
                  ) : (
                    <>
                      <Beaker className="w-4 h-4" />
                      Crear Franquicia de Test (ID: 12)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mappings List */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapeos de Franquicias ({mappings.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mappings.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No hay mapeos configurados
              </p>
            ) : (
              mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {mapping.flyderBusinessName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Flyder ID: {mapping.flyderBusinessId}
                      </p>
                      <p className="text-xs text-slate-500">
                        → {mapping.repaartFranchiseId}
                      </p>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Mapping Form */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Crear Nuevo Mapeo
          </h3>

          <form onSubmit={createMapping} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                ID de Negocio Flyder
              </label>
              <input
                type="number"
                required
                value={formData.flyderBusinessId}
                onChange={(e) => setFormData({ ...formData, flyderBusinessId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                placeholder="Ej: 14"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre de Negocio Flyder
              </label>
              <input
                type="text"
                required
                value={formData.flyderBusinessName}
                onChange={(e) => setFormData({ ...formData, flyderBusinessName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                placeholder="Ej: Repaart Sevilla"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                ID de Franquicia Repaart
              </label>
              <input
                type="text"
                required
                value={formData.repaartFranchiseId}
                onChange={(e) => setFormData({ ...formData, repaartFranchiseId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                placeholder="Ej: sevilla-franchise-001"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              Crear Mapeo
            </button>
          </form>
        </div>
      </div>

      {/* Sync Button */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Sincronizar Pedidos Históricos
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Importa todos los pedidos desde 2024 hasta hoy
            </p>
          </div>
          <button
            onClick={startSync}
            disabled={syncing || mappings.length === 0}
            className={cn(
              'px-6 py-3 rounded-lg font-medium flex items-center gap-2',
              syncing || mappings.length === 0
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {syncing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Iniciar Sincronización
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlyderSyncPanel;
