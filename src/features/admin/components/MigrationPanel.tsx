import React, { useState } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '../../../components/ui/primitives/Button';
import { Card } from '../../../components/ui/primitives/Card';
import { Database } from 'lucide-react';

export const MigrationPanel: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({ total: 0, migrated: 0, errors: 0 });

    const runMigration = async () => {
        if (!confirm("¿Estás seguro de ejecutar la migración? Esto copiará riders de la colección antigua a 'users'.")) return;

        setIsLoading(true);
        setLogs(prev => ["Inicio de migración...", ...prev]);
        setStats({ total: 0, migrated: 0, errors: 0 });

        try {
            // Read from unified /users/ collection (riders have role='rider')
            const ridersQuery = query(collection(db, 'users'), where('role', '==', 'rider'));
            const ridersSnapshot = await getDocs(ridersQuery);
            const total = ridersSnapshot.size;
            setStats(prev => ({ ...prev, total }));
            setLogs(prev => [`🔍 Encontrados ${total} riders en 'users'`, ...prev]);

            for (const riderDoc of ridersSnapshot.docs) {
                const data = riderDoc.data();
                const uid = riderDoc.id;

                try {
                    // 2. Check if exists in 'users'
                    const userRef = doc(db, 'users', uid);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists() || !userSnap.data().role) {
                        // 3. Migrate / Fix
                        const newUserData = {
                            uid: uid,
                            email: data.email,
                            displayName: data.fullName || data.name || 'Rider Sin Nombre',
                            phoneNumber: data.phone || '',
                            role: 'rider', // FORCE ROLE
                            franchiseId: data.franchiseId || '',
                            status: data.status || 'active',
                            contractHours: data.contractHours || 40,
                            photoURL: data.photoURL || '',
                            migratedAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                            // Keep legacy metrics if needed, but store in top level or specific object
                            metrics: data.metrics || {}
                        };

                        await setDoc(userRef, newUserData, { merge: true });
                        setStats(prev => ({ ...prev, migrated: prev.migrated + 1 }));
                        setLogs(prev => [`✅ Migrado: ${data.email} (${uid})`, ...prev]);
                    } else {
                        setLogs(prev => [`ℹ️ Saltado (Ya existe): ${data.email}`, ...prev]);
                    }
                } catch (err: unknown) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    console.error(`Error migrating ${uid}:`, err);
                    setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
                    setLogs(prev => [`❌ Error con ${data.email}: ${errMsg}`, ...prev]);
                }
            }
            setLogs(prev => ["🏁 Migración completada.", ...prev]);

        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("Migration fatal error:", error);
            setLogs(prev => [`🔥 Error Fatal: ${errorMsg}`, ...prev]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <Database size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white pb-0">Migración de Base de Datos</h3>
                    <p className="text-sm text-slate-500">Unificar riders antiguos a la nueva estructura de usuarios.</p>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 font-mono text-xs h-48 overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                    <span className="text-slate-400 opacity-50">Esperando ejecución...</span>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`
                            ${log.includes('✅') ? 'text-green-600' : ''}
                            ${log.includes('❌') || log.includes('🔥') ? 'text-red-500 font-bold' : ''}
                            ${log.includes('ℹ️') ? 'text-blue-400' : 'text-slate-600 dark:text-slate-300'}
                        `}>
                            {log}
                        </div>
                    ))
                )}
            </div>

            <div className="flex justify-between items-center pt-2">
                <div className="flex gap-4 text-sm font-medium">
                    <span className="text-slate-500">Total: <b className="text-slate-900 dark:text-white">{stats.total}</b></span>
                    <span className="text-green-600">Migrados: <b>{stats.migrated}</b></span>
                    <span className="text-red-500">Errores: <b>{stats.errors}</b></span>
                </div>

                <Button
                    onClick={runMigration}
                    isLoading={isLoading}
                    variant={isLoading ? 'secondary' : 'primary'}
                    className={isLoading ? '' : 'bg-amber-600 hover:bg-amber-700 text-white border-transparent'}
                >
                    {isLoading ? 'Migrando...' : 'Ejecutar Migración'}
                </Button>
            </div>
        </Card>
    );
};
