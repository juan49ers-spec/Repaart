import { useState } from 'react';
import { academyService } from '../../services/academyService';
import { COURSE_MODULES_DATA } from './data/academy/seedData';
import { ENCYCLOPEDIA_DATA } from './data/academy/encyclopediaData';
import { Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const AcademySeeder = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    // Only allow Admin to see this
    if (user?.role !== 'admin') return null;

    const logMessage = (msg: string) => {
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const handleSeed = async () => {
        if (!confirm('¿Estás seguro? Esto borrará/sobrescribirá los cursos existentes y todo el progreso.')) return;

        try {
            setStatus('seeding');
            setLog([]);
            logMessage('Iniciando proceso de sembrado atómico...');
            logMessage('⏳ Borrando datos antiguos y creando nuevos (esto puede tardar unos segundos)...');

            await academyService.seedAcademyContent(COURSE_MODULES_DATA, ENCYCLOPEDIA_DATA);

            setStatus('success');
            logMessage('✨ ¡Sembrado completado con éxito!');
            logMessage('♻️ Por favor, recarga la página para ver los cambios correctamente.');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            logMessage(`❌ Error: ${error.message}`);
        }
    };

    return (
        <div className="mb-4">
            {!status || status === 'idle' ? (
                <div className="flex justify-end">
                    <button
                        onClick={() => setStatus('seeding')} // Just reveal UI
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                        <Database className="w-3 h-3" />
                        <span>Herramientas Admin (Sembrado)</span>
                    </button>
                </div>
            ) : (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold flex items-center gap-2 text-red-800 dark:text-red-200">
                            <Database className="w-3.5 h-3.5" />
                            Zona de Peligro: Sembrado
                        </h3>
                        <button
                            onClick={() => setStatus('idle')}
                            className="text-[10px] font-bold text-red-600 hover:text-red-800"
                        >
                            Cancelar
                        </button>
                    </div>
                    <p className="text-[10px] text-red-600/80 dark:text-red-300/70 mb-3 leading-tight">
                        Sobrescribirá todo el contenido y progreso.
                    </p>

                    <div className="flex gap-3 items-center">
                        <button
                            onClick={handleSeed}
                            disabled={status === 'seeding'} // actually 'seeding' state overrides the string from 'idle'
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold text-white transition
                                ${status === 'seeding' ? 'bg-slate-400 cursor-wait' : 'bg-red-600 hover:bg-red-700 shadow-sm'}
                            `}
                        >
                            {status === 'seeding' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            {status === 'seeding' ? 'Generando...' : 'Ejecutar Reset'}
                        </button>

                        {log.length > 0 && <span className="text-[10px] font-mono text-slate-500">{log[log.length - 1]}</span>}
                    </div>

                    {log.length > 0 && (
                        <div className="mt-3 p-2 bg-slate-950 text-emerald-400 text-[10px] font-mono rounded h-24 overflow-y-auto">
                            {log.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
