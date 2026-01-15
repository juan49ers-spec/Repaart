import { useState } from 'react';
import { academyService } from '../../services/academyService';
import { COURSE_MODULES_DATA } from '../../data/academy/seedData';
import { ENCYCLOPEDIA_DATA } from '../../data/academy/encyclopediaData';
import { Database, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AcademySeeder = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    // Only allow Admin to see this
    // if (user?.role !== 'admin') return null;

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
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 my-8">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                <Database className="w-4 h-4" />
                Herramienta de Sembrado (Admin)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                Usa esto para cargar el contenido maestro del curso. Borrará los datos existentes.
            </p>

            <div className="flex gap-4 items-center">
                <button
                    onClick={handleSeed}
                    disabled={status === 'seeding'}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition
                        ${status === 'seeding' ? 'bg-slate-400 cursor-wait' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'}
                    `}
                >
                    {status === 'seeding' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {status === 'seeding' ? 'Generando...' : 'Reinicializar Cursos'}
                </button>

                {status === 'success' && <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Completado</div>}
                {status === 'error' && <div className="flex items-center gap-2 text-red-600 text-xs font-bold"><AlertTriangle className="w-4 h-4" /> Error</div>}
            </div>

            {log.length > 0 && (
                <div className="mt-4 p-2 bg-black text-green-400 font-mono text-xs rounded-lg max-h-40 overflow-y-auto">
                    {log.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            )}
        </div>
    );
};
