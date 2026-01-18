// Enciclopedia Seeder - Carga los módulos a Firestore
import React, { useState } from 'react';
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAllModules, getContentStats } from '../features/academy/data/index';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const EncyclopediaSeeder: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const progressRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (progressRef.current) {
            progressRef.current.style.width = `${progress}%`;
        }
    }, [progress]);

    const stats = getContentStats();

    const clearAndSeed = async () => {
        setStatus('loading');
        setMessage('Preparando contenido...');
        setProgress(0);

        try {
            const collectionRef = collection(db, 'academy_encyclopedia');

            // Paso 1: Borrar documentos existentes
            setMessage('Borrando contenido anterior...');
            const existingDocs = await getDocs(collectionRef);

            for (const docSnap of existingDocs.docs) {
                await deleteDoc(doc(db, 'academy_encyclopedia', docSnap.id));
            }
            setProgress(10);

            // Paso 2: Obtener todos los módulos
            const allModules = getAllModules();
            setMessage(`Cargando ${allModules.length} módulos...`);

            // Paso 3: Cargar en batches de 500 (límite de Firestore)
            const batchSize = 500;
            let processed = 0;

            for (let i = 0; i < allModules.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = allModules.slice(i, i + batchSize);

                chunk.forEach((module) => {
                    const docRef = doc(collectionRef, module.id);
                    batch.set(docRef, {
                        title: module.title,
                        category: module.category,
                        content: module.content,
                        action: module.action,
                        example: module.example || null,
                        order: module.order,
                        createdAt: new Date().toISOString()
                    });
                });

                await batch.commit();
                processed += chunk.length;
                setProgress(10 + Math.round((processed / allModules.length) * 90));
                setMessage(`Cargados ${processed} de ${allModules.length} módulos...`);
            }

            setStatus('success');
            setMessage(`✅ ${allModules.length} módulos cargados correctamente en ${stats.totalCategories} categorías`);
            setProgress(100);

        } catch (error) {
            console.error('Error seeding encyclopedia:', error);
            setStatus('error');
            setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-50">
            {/* Status Message */}
            {message && (
                <div className={`mb-3 px-4 py-3 rounded-xl text-sm font-medium shadow-lg max-w-xs ${status === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
                    }`}>
                    <div className="flex items-start gap-2">
                        {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin mt-0.5" />}
                        {status === 'success' && <CheckCircle className="w-4 h-4 mt-0.5" />}
                        {status === 'error' && <AlertCircle className="w-4 h-4 mt-0.5" />}
                        <span>{message}</span>
                    </div>
                    {status === 'loading' && (
                        <div className="mt-2 h-1.5 bg-indigo-200 dark:bg-indigo-800 rounded-full overflow-hidden">
                            <div
                                ref={progressRef}
                                className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 rounded-full"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Main Button */}
            <button
                onClick={clearAndSeed}
                disabled={status === 'loading'}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-lg transition-all ${status === 'loading'
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white hover:shadow-xl hover:scale-105'
                    }`}
            >
                {status === 'loading' ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Cargando...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5" />
                        <span>Cargar {stats.totalModules} Módulos</span>
                    </>
                )}
            </button>

            {/* Stats Tooltip */}
            {status === 'idle' && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-right">
                    {stats.byCategory.map(c => `${c.name}: ${c.count}`).join(' · ')}
                </div>
            )}
        </div>
    );
};

export default EncyclopediaSeeder;
