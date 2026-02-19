import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import {
  Building2,
  Check,
  AlertCircle,
  RefreshCw,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

export const FixFranchisesButton: React.FC = () => {
  const [correcting, setCorrecting] = useState(false);
  const [listing, setListing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [franchiseStatus, setFranchiseStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listFranchises = async () => {
    setListing(true);
    setError(null);
    try {
      const listFn = httpsCallable(functions, 'listFranchiseStatus');
      const response = await listFn({});
      const data = response.data as any;
      setFranchiseStatus(data);
    } catch (err: any) {
      setError(err.message || 'Error listando franquicias');
    } finally {
      setListing(false);
    }
  };

  const correctFranchises = async () => {
    if (!window.confirm(
      '¿Corregir y crear franquicias?\n\n' +
      'CORRECCIONES:\n' +
      '- "Trasero" → "Repaart Jaén" (Flyder ID: 13)\n' +
      '- "Alcalá de Guadaira" → "Repaart Sevilla" (Flyder ID: 14)\n\n' +
      'NUEVAS FRANQUICIAS:\n' +
      '- Repaart Cáceres (ID: 6)\n' +
      '- Repaart Plasencia (ID: 9)\n' +
      '- Repaart Torremolinos (ID: 15)\n' +
      '- Repaart Martos (ID: 19)\n' +
      '- Repaart Toledo (ID: 22)\n' +
      '- Reepart Navalmoral (ID: 7)\n' +
      '- Honze Cuenca (ID: 28)\n\n' +
      'Se crearán automáticamente los mapeos para sincronizar pedidos.'
    )) {
      return;
    }

    setCorrecting(true);
    setError(null);
    setResult(null);

    try {
      const correctFn = httpsCallable(functions, 'correctAndCreateFranchises');
      const response = await correctFn({});
      const data = response.data as any;
      setResult(data);
      
      const msg = `✅ Completado:\n` +
        `${data.results.corrected.length} corregidas\n` +
        `${data.results.created.length} creadas\n` +
        `${data.results.mappingsCreated.length} mapeos creados`;
      
      alert(msg);
    } catch (err: any) {
      setError(err.message || 'Error corrigiendo franquicias');
      console.error(err);
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Edit3 className="w-6 h-6 text-indigo-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Corregir y Crear Franquicias
          </h3>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Corrige las franquicias existentes (Trasero → Jaén, Alcalá de Guadaira → Sevilla) 
            y crea las 7 franquicias faltantes de Flyder con sus mapeos.
          </p>

          <div className="flex gap-2">
            <button
              onClick={listFranchises}
              disabled={listing}
              className={cn(
                'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                listing
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-slate-600 text-white hover:bg-slate-700'
              )}
            >
              {listing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Ver Estado
                </>
              )}
            </button>
            
            <button
              onClick={correctFranchises}
              disabled={correcting}
              className={cn(
                'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                correcting
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              {correcting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Corregir y Crear
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">{result.results.corrected.length}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Corregidas</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{result.results.created.length}</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Creadas</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.results.alreadyExist.length}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Ya existían</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{result.results.mappingsCreated.length}</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Mapeos</p>
                </div>
              </div>

              {result.results.corrected.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                    ✏️ Franquicias corregidas:
                  </p>
                  <div className="space-y-1">
                    {result.results.corrected.map((f: any, i: number) => (
                      <div key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <Edit3 className="w-3 h-3" />
                        {f.oldName} → {f.newName} (ID: {f.flyderId})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.results.created.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    ✅ Franquicias creadas:
                  </p>
                  <div className="space-y-1">
                    {result.results.created.map((f: any, i: number) => (
                      <div key={i} className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        {f.name} (Flyder ID: {f.flyderId})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.results.errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    ❌ Errores: {result.results.errors.length}
                  </p>
                </div>
              )}
            </div>
          )}

          {franchiseStatus && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  📋 Franquicias ({franchiseStatus.franchiseCount}) y Mapeos ({franchiseStatus.mappingCount})
                </p>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Ver detalles
                    </>
                  )}
                </button>
              </div>
              
              {showDetails && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-slate-500 mb-1">Franquicias:</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {franchiseStatus.franchises.map((f: any, i: number) => (
                      <div key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{f.name}</span>
                          {f.flyderBusinessId ? (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                              Flyder ID: {f.flyderBusinessId}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full">
                              Sin ID
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs font-medium text-slate-500 mb-1 mt-3">Mapeos:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {franchiseStatus.mappings.map((m: any, i: number) => (
                      <div key={i} className="text-xs text-slate-500 flex items-center justify-between py-0.5">
                        <span>{m.flyderBusinessName} (ID: {m.flyderBusinessId})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixFranchisesButton;
