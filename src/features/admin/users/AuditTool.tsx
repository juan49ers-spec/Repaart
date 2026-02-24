import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import { Loader2, ShieldCheck } from 'lucide-react';

const AuditTool = () => {
    const [email, setEmail] = useState('franquicia3@repaart.es');
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runAudit = async () => {
        setLoading(true);
        setLog([]);
        try {
            const repairUserFn = httpsCallable(functions, 'repairUser');

            addLog(`🚀 Invocando repairUser para: ${email}...`);
            const response = await repairUserFn({ email });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = response.data as any;

            if (data.log) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setLog(prev => [...prev, ...data.log.map((l: any) => `[SERVER] ${l}`)]);
            }

            if (data.success) {
                addLog(`✅ ÉXITO. UID recuperado: ${data.uid}`);
            } else {
                addLog(`❌ ERROR: ${data.error}`);
            }

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            addLog(`❌ CRITICAL ERROR: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testConnectivity = async () => {
        setLoading(true);
        try {
            const repairUserFn = httpsCallable(functions, 'repairUser');
            addLog(`📡 Testing connectivity (Ping)...`);
             
            const response = await repairUserFn({ ping: true });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = response.data as any;

            if (data.success) {
                addLog(`✅ PONG! Server time: ${data.serverTime}`);
                addLog(`   Region: ${data.region}, Auth Context: ${data.authContext}`);
            } else {
                addLog(`❌ Ping Failed: ${JSON.stringify(data)}`);
            }
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const errorCode = error.code || 'unknown';
            const errorDetails = error.details ? JSON.stringify(error.details) : '';

            addLog(`❌ PING ERROR: ${error.message}`);
            addLog(`   Code: ${errorCode}`);
            if (errorDetails) addLog(`   Details: ${errorDetails}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 text-white rounded-xl max-w-2xl mx-auto my-10 shadow-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" />
                Herramienta de Diagnóstico y Reparación
            </h2>

            <div className="flex gap-2 mb-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500"
                    placeholder="Email del usuario fantasma"
                />
                <button
                    onClick={testConnectivity}
                    disabled={loading}
                    className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded font-bold transition-colors disabled:opacity-50"
                    title="Probar conexión con servidor"
                >
                    📡
                </button>
                <button
                    onClick={runAudit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin w-4 h-4" />}
                    {loading ? 'Procesando...' : 'Reparar Usuario'}
                </button>
            </div>

            <div className="bg-black/50 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto border border-white/10">
                {log.length === 0 && <span className="text-slate-500">Esperando ejecución...</span>}
                {log.map((line, i) => (
                    <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">
                        {line}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditTool;
