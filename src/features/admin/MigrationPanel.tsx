import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { migrateFranchiseIds, verifyMigration } from '../../scripts/migrateFranchiseIds';

/**
 * Admin panel component to run the franchise ID migration
 * Should only be accessible to root admins
 */
const MigrationPanel: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<any>(null);
    const [isDryRun, setIsDryRun] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleRunMigration = async () => {
        if (!isDryRun && !showConfirm) {
            setShowConfirm(true);
            return;
        }

        setStatus('running');
        setResult(null);
        setShowConfirm(false);

        try {
            console.log(`Starting migration (dry-run: ${isDryRun})`);
            const migrationResult = await migrateFranchiseIds(isDryRun);
            setResult(migrationResult);
            setStatus(migrationResult.success ? 'success' : 'error');
        } catch (error: any) {
            console.error('Migration error:', error);
            setResult({ success: false, errors: [error.message] });
            setStatus('error');
        }
    };

    const handleVerify = async () => {
        setStatus('running');
        try {
            await verifyMigration();
            setStatus('success');
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <Database className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Data Migration Tool</h2>
                        <p className="text-slate-400 text-sm">FranchiseId Custom → UID Migration</p>
                    </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold text-amber-300 mb-1">Critical Operation</p>
                            <p className="text-amber-200/80">
                                This will update all financial records, shifts, vehicles, and riders to use UIDs
                                instead of custom franchise IDs. Always run in DRY-RUN mode first!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4 mb-6">
                    {/* Dry Run Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="font-bold text-white">Dry Run Mode</p>
                            <p className="text-xs text-slate-400">Preview changes without modifying data</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsDryRun(!isDryRun);
                                setShowConfirm(false);
                            }}
                            className={`relative w-14 h-7 rounded-full transition-colors ${isDryRun ? 'bg-emerald-500' : 'bg-slate-600'
                                }`}
                        >
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isDryRun ? '' : 'translate-x-7'
                                }`} />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleRunMigration}
                            disabled={status === 'running'}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${isDryRun
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {status === 'running' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                <>{isDryRun ? 'Preview Changes' : 'Execute Migration'}</>
                            )}
                        </button>

                        <button
                            onClick={handleVerify}
                            disabled={status === 'running'}
                            className="px-6 py-3 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            Verify Status
                        </button>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                {showConfirm && (
                    <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-xl p-6 mb-6">
                        <p className="font-bold text-rose-300 mb-4 text-lg">⚠️ Final Confirmation Required</p>
                        <p className="text-rose-200/80 mb-6">
                            You are about to execute a LIVE migration that will permanently modify data in Firestore.
                            This operation cannot be undone via this tool. Have you:
                        </p>
                        <ul className="text-sm text-rose-200/80 space-y-2 mb-6 ml-4">
                            <li>✓ Run and reviewed the dry-run results?</li>
                            <li>✓ Backed up critical data in Firebase Console?</li>
                            <li>✓ Verified the UID mapping is correct?</li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRunMigration}
                                className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold text-white transition-all"
                            >
                                Yes, Execute Now
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className={`rounded-xl p-6 border-2 ${result.success
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-rose-500/10 border-rose-500/30'
                        }`}>
                        <div className="flex items-center gap-3 mb-4">
                            {result.success ? (
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-rose-400" />
                            )}
                            <h3 className={`text-lg font-bold ${result.success ? 'text-emerald-300' : 'text-rose-300'
                                }`}>
                                {result.success ? 'Migration Completed' : 'Migration Failed'}
                            </h3>
                        </div>

                        {result.mappings && result.mappings.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-bold text-white mb-2">Franchise Mappings:</p>
                                <div className="space-y-2">
                                    {result.mappings.map((m: any, i: number) => (
                                        <div key={i} className="text-xs font-mono bg-black/30 rounded p-2">
                                            <span className="text-amber-400">{m.franchiseId}</span>
                                            {' → '}
                                            <span className="text-emerald-400">{m.uid}</span>
                                            {' '}
                                            <span className="text-slate-400">({m.email})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.updated && (
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-white">Documents Updated:</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-black/30 rounded p-2">
                                        Financial Records: <span className="font-bold text-indigo-400">{result.updated.financial_records}</span>
                                    </div>
                                    <div className="bg-black/30 rounded p-2">
                                        Shifts: <span className="font-bold text-indigo-400">{result.updated.shifts}</span>
                                    </div>
                                    <div className="bg-black/30 rounded p-2">
                                        Motos: <span className="font-bold text-indigo-400">{result.updated.motos}</span>
                                    </div>
                                    <div className="bg-black/30 rounded p-2">
                                        Riders: <span className="font-bold text-indigo-400">{result.updated.riders}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {result.errors && result.errors.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-bold text-rose-300 mb-2">Errors:</p>
                                <div className="space-y-1">
                                    {result.errors.map((err: string, i: number) => (
                                        <div key={i} className="text-xs bg-black/30 rounded p-2 text-rose-200">
                                            {err}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isDryRun && result.success && (
                            <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                                <p className="text-xs text-amber-200">
                                    💡 This was a dry run. No data was modified. Toggle off "Dry Run Mode" to execute.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Console Note */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">
                        <span className="font-bold text-slate-300">Developer Note:</span> This script is also available
                        in browser console. Run <code className="bg-black/50 px-2 py-0.5 rounded">await migrateFranchiseIds()</code> for dry-run
                        or <code className="bg-black/50 px-2 py-0.5 rounded">await migrateFranchiseIds(false)</code> to execute.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MigrationPanel;
