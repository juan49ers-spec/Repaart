import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import { Beaker, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export const CreateTestFranchiseButton: React.FC = () => {
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!window.confirm(
      '¿Crear franquicia de test?\n\n' +
      'Esto creará una franquicia especial para los pedidos de "Flyder Test Business" (ID: 12) con 2,150 pedidos.'
    )) {
      return;
    }

    setCreating(true);
    setError(null);
    setResult(null);

    try {
      const createFn = httpsCallable(functions, 'createTestFranchise');
      const response = await createFn({});
      const data = response.data as any;
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error creando franquicia');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Beaker className="w-6 h-6 text-purple-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Franquicia de Test
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Crea una franquicia especial para los 2,150 pedidos de &quot;Flyder Test Business&quot; (ID: 12).
            Estos son pedidos de prueba que faltan por sincronizar.
          </p>

          {!result && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className={cn(
                'px-6 py-3 rounded-lg font-medium flex items-center gap-2',
                creating
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
              )}
            >
              {creating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Beaker className="w-5 h-5" />
                  Crear Franquicia de Test
                </>
              )}
            </button>
          )}

          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  {result.action === 'created' ? '¡Franquicia creada!' : '¡Franquicia ya existe!'}
                </span>
              </div>
              <p className="text-sm text-green-600">
                {result.action === 'created'
                  ? `Franquicia "Flyder Test Business" creada con ID: ${result.franchiseId}`
                  : `La franquicia ya existe con ID: ${result.franchiseId}`
                }
              </p>
              <button
                onClick={() => setResult(null)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Crear de nuevo
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

export default CreateTestFranchiseButton;
