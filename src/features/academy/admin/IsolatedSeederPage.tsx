import { useState } from 'react';
import { academyService } from '../../../services/academyService';
import { COURSE_MODULES_DATA } from '../data/academy/seedData';
import { ENCYCLOPEDIA_DATA } from '../data/academy/encyclopediaData';
import { Database, RefreshCw, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom';

/**
 * IsolatedSeederPage - A standalone page for seeding academy content.
 * This page has NO Firestore listeners to prevent the "INTERNAL ASSERTION FAILED" error.
 * Navigate to /admin/seed-academy to use this page.
 */
export const IsolatedSeederPage = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    // Only allow Admin to see this
    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
                <div className="text-center text-red-400">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                    <p>Solo los administradores pueden acceder a esta página.</p>
                </div>
            </div>
        );
    }

    const logMessage = (msg: string) => {
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const handleSeed = async () => {
        if (!confirm('¿Estás seguro? Esto borrará/sobrescribirá los cursos existentes y todo el progreso.')) return;

        try {
            setStatus('seeding');
            setLog([]);
            logMessage('🚀 Iniciando proceso de sembrado AISLADO...');
            logMessage('⏳ Borrando datos antiguos (esto puede tardar unos segundos)...');

            await academyService.seedAcademyContent(COURSE_MODULES_DATA, ENCYCLOPEDIA_DATA);

            setStatus('success');
            logMessage('✨ ¡Sembrado completado con éxito!');
            logMessage('♻️ Ahora puedes navegar a la Academia para ver los cambios.');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            logMessage(`❌ Error: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/admin/academy" className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Database className="w-7 h-7 text-indigo-400" />
                            Sembrador Aislado de Academia
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Esta página no tiene listeners activos para evitar el error &quot;Unexpected state&quot;.
                        </p>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-amber-950/50 border border-amber-700/50 rounded-xl p-4 mb-6">
                    <p className="text-amber-300 text-sm">
                        <strong>⚠️ Importante:</strong> Asegúrate de que no tienes otras pestañas con la Academia abiertas.
                        El proceso puede tardar 20-30 segundos.
                    </p>
                </div>

                {/* Seed Button */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={handleSeed}
                        disabled={status === 'seeding'}
                        className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${status === 'success'
                            ? 'bg-emerald-600 text-white'
                            : status === 'error'
                                ? 'bg-red-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                    >
                        {status === 'seeding' ? (
                            <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : status === 'success' ? (
                            <CheckCircle className="w-6 h-6" />
                        ) : status === 'error' ? (
                            <AlertTriangle className="w-6 h-6" />
                        ) : (
                            <Database className="w-6 h-6" />
                        )}
                        {status === 'seeding' ? 'Sembrando...' : status === 'success' ? '¡Completado!' : status === 'error' ? 'Error' : 'Sembrar Contenido de Academia'}
                    </button>
                </div>

                {/* Log Console */}
                {log.length > 0 && (
                    <div className="bg-slate-950 rounded-xl border border-slate-700 p-4 max-h-64 overflow-y-auto font-mono text-sm">
                        {log.map((entry, i) => (
                            <p key={i} className={`mb-1 ${entry.includes('❌') ? 'text-red-400' :
                                entry.includes('✨') ? 'text-emerald-400' :
                                    entry.includes('⏳') ? 'text-amber-400' :
                                        'text-slate-400'
                                }`}>
                                {entry}
                            </p>
                        ))}
                    </div>
                )}

                {/* Success Navigation */}
                {status === 'success' && (
                    <div className="mt-6 text-center">
                        <Link
                            to="/admin/academy"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors"
                        >
                            Ir a la Academia →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IsolatedSeederPage;
