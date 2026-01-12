import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

const SystemReset: React.FC = () => {
    const [confirmText, setConfirmText] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (confirmText !== 'RESET-SYSTEM-2026') return;
        setIsResetting(true);
        // Simulation of reset
        setTimeout(() => {
            alert('Sistema reiniciado (Simulación).');
            setIsResetting(false);
            setConfirmText('');
        }, 2000);
    };

    return (
        <div className="max-w-2xl mx-auto py-12">
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600">
                    <AlertTriangle className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black text-rose-900 mb-2">Zona de Peligro: Reinicio del Sistema</h2>
                <p className="text-rose-700/80 mb-8 max-w-md mx-auto font-medium">
                    Esta acción eliminará todos los datos temporales, cachés y estados de sesión. No elimina datos persistentes de la base de datos principal, pero forzará el cierre de sesión de todos los usuarios.
                </p>

                <div className="max-w-xs mx-auto space-y-4">
                    <div className="text-left">
                        <label className="text-xs font-bold uppercase tracking-wider text-rose-800 ml-1 mb-1 block">
                            Escribe "RESET-SYSTEM-2026" para confirmar
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="RESET-SYSTEM-2026"
                            className="w-full bg-white border border-rose-200 text-rose-900 font-bold text-center py-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-rose-500/20 placeholder:text-rose-300"
                        />
                    </div>

                    <button
                        onClick={handleReset}
                        disabled={confirmText !== 'RESET-SYSTEM-2026' || isResetting}
                        className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isResetting ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Reiniciando...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-5 h-5" />
                                Ejecutar Reinicio de Emergencia
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemReset;
