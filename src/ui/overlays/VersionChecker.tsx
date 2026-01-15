
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
// toast import removed as unused

const CHECK_INTERVAL = 60 * 1000; // Check every minute
const VERSION_URL = '/version.json';

// Get current version from build
import currentVersionData from '../../public/version.json';

export const VersionChecker: React.FC = () => {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [remoteVersion, setRemoteVersion] = useState<string | null>(null);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Add timestamp to bypass cache (Aggressive)
                const res = await fetch(`${VERSION_URL}?t=${Date.now()}&r=${Math.random()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                if (!res.ok) return;

                const data = await res.json();
                const localVersion = currentVersionData.version;

                console.log(`[VersionChecker] Checking: Local=${localVersion} vs Remote=${data.version}`);

                if (data.version !== localVersion) {
                    console.warn(`[VersionChecker] MISMATCH DETECTED! Initiating emergency update.`);
                    setRemoteVersion(data.version);
                    setHasUpdate(true);

                    // FORCE RELOAD IMMEDIATELY
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } catch (err) {
                console.error("[VersionChecker] Failed to check version", err);
            }
        };

        // Initial check
        checkVersion();

        // Interval check
        const interval = setInterval(checkVersion, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    // handleUpdate removed as unused

    if (!hasUpdate) return null;

    // BLOCKING OVERLAY
    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-emerald-500/20 text-center space-y-6 animate-in zoom-in duration-300">
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                    <div className="bg-slate-800 p-4 rounded-full border-2 border-emerald-500 relative z-10">
                        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Actualizando Sistema</h2>
                    <p className="text-slate-400">
                        Detectada versión <span className="font-mono text-emerald-400 font-bold">{remoteVersion}</span>
                        <br />
                        Aplicando cambios críticos...
                    </p>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-progress-indeterminate"></div>
                </div>

                <p className="text-xs text-slate-500 animate-pulse">
                    No cierres la ventana, se recargará automáticamente.
                </p>
            </div>
        </div>
    );
};
