import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import {
  Building2,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Users,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface ImportResult {
  imported: Array<{
    businessId: number;
    name: string;
    franchiseId: string;
    email: string;
    tempPassword: string;
  }>;
  skipped: Array<{
    businessId: number;
    name: string;
    reason: string;
  }>;
  errors: Array<{
    businessId: number;
    name: string;
    error: string;
  }>;
  mappingsCreated: Array<{
    mappingId: string;
    flyderBusinessId: number;
    repaartFranchiseId: string;
  }>;
}

interface ImportStatus {
  importedFromFlyder: number;
  totalFranchises: number;
  totalMappings: number;
}

export const FlyderFranchiseImport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const getStatusFn = httpsCallable(functions, 'getImportStatus');
      const response = await getStatusFn({});
      setStatus((response.data as any).stats);
    } catch (err) {
      console.error('Error loading status:', err);
    }
  };

  const startImport = async () => {
    if (!window.confirm('¿Estás seguro de que quieres importar todas las franquicias de Flyder?\n\nSe crearán usuarios en Firebase Auth y documentos en Firestore.')) {
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const importFn = httpsCallable(functions, 'importFlyderFranchises');
      const response = await importFn({});
      
      const data = response.data as any;
      setResult(data.results);
      
      // Recargar estado
      await loadStatus();
      
      alert(`✅ Importación completada:\n${data.results.imported.length} franquicias importadas\n${data.results.skipped.length} omitidas\n${data.results.errors.length} errores`);
    } catch (err: any) {
      setError(err.message || 'Error en la importación');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const copyCredentials = () => {
    if (!result?.imported.length) return;
    
    const text = result.imported.map(f => 
      `${f.name}\nEmail: ${f.email}\nPassword: ${f.tempPassword}\n---`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    alert('Credenciales copiadas al portapapeles');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Importar Franquicias desde Flyder
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Importa automáticamente todas las franquicias de Flyder a Repaart
          </p>
        </div>
        <button
          onClick={loadStatus}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 rounded-xl border-l-4 border-blue-500">
            <p className="text-xs text-slate-500 uppercase">Total Franquicias</p>
            <p className="text-2xl font-bold">{status.totalFranchises}</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-green-500">
            <p className="text-xs text-slate-500 uppercase">Importadas de Flyder</p>
            <p className="text-2xl font-bold">{status.importedFromFlyder}</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500">
            <p className="text-xs text-slate-500 uppercase">Mapeos Creados</p>
            <p className="text-2xl font-bold">{status.totalMappings}</p>
          </div>
        </div>
      )}

      {/* Main Action */}
      <div className="glass-card p-8 rounded-xl text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Download className="w-8 h-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Importar Franquicias de Flyder
        </h3>
        
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
          Esta acción creará automáticamente todas las franquicias de Flyder en Repaart, 
          incluyendo usuarios de Firebase Auth, documentos en Firestore y mapeos automáticos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={startImport}
            disabled={importing}
            className={cn(
              'px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3',
              importing
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all'
            )}
          >
            {importing ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Iniciar Importación
              </>
            )}
          </button>
        </div>

        {importing && (
          <p className="mt-4 text-sm text-slate-500">
            Esto puede tardar unos minutos. Por favor, no cierres esta ventana.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Resultados de la Importación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{result.imported.length}</p>
                <p className="text-sm text-green-700 dark:text-green-300">Importadas</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-3xl font-bold text-amber-600">{result.skipped.length}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Omitidas</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{result.errors.length}</p>
                <p className="text-sm text-red-700 dark:text-red-300">Errores</p>
              </div>
            </div>
          </div>

          {/* Imported Franchises */}
          {result.imported.length > 0 && (
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Franquicias Importadas
                </h3>
                <button
                  onClick={copyCredentials}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Copiar credenciales
                </button>
              </div>

              <div className="space-y-3">
                {result.imported.map((franchise) => (
                  <div
                    key={franchise.franchiseId}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {franchise.name}
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Email:</span> {franchise.email}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Password temporal:</span>{' '}
                            <span className={showPasswords ? '' : 'blur-sm'}>
                              {franchise.tempPassword}
                            </span>
                          </p>
                          <p className="text-slate-500 text-xs">
                            ID: {franchise.franchiseId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                          <Check className="w-3 h-3" />
                          Importada
                        </span>
                      </div>
                    </div>                  
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Importante:</strong> Guarda estas credenciales. Las contraseñas temporales 
                  deben ser cambiadas en el primer login de cada franquicia.
                </p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {result.imported.length > 0 && (
            <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Próximos Pasos
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    1
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Verifica que todas las franquicias aparezcan en{' '}
                    <strong>Admin → Usuarios</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    2
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Ve a la pestaña{' '}
                    <strong>Sincronización</strong> para importar los pedidos históricos
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    3
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Comparte las credenciales con cada franquicia para que puedan acceder
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlyderFranchiseImport;
