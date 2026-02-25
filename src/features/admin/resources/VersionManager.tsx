import React, { useState, useEffect } from 'react';
import {
    Save,
    History,
    Trash2,
    RotateCcw,
    GitCompare,
    X,
    Clock,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { ContractVersion, VersionComparison } from '../../../hooks/useContractVersioning';

interface VersionManagerProps {
    versions: ContractVersion[];
    autoSaveData: ContractVersion | null;
    currentContent: string;
    currentVariables: Record<string, string>;
    onCreateVersion: (name: string) => void;
    onRestoreVersion: (version: ContractVersion) => void;
    onDeleteVersion: (versionId: string) => void;
    onCompareVersions: (v1: ContractVersion, v2: ContractVersion) => VersionComparison;
    onRestoreAutoSave: () => void;
    hasAutoSave: boolean;
}

export const VersionManager: React.FC<VersionManagerProps> = ({
    versions,
    autoSaveData,
    currentContent,
    currentVariables,
    onCreateVersion,
    onRestoreVersion,
    onDeleteVersion,
    onCompareVersions,
    onRestoreAutoSave,
    hasAutoSave
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newVersionName, setNewVersionName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [comparingVersions, setComparingVersions] = useState<[ContractVersion, ContractVersion] | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<ContractVersion | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateVersion = () => {
        if (newVersionName.trim()) {
            onCreateVersion(newVersionName.trim());
            setNewVersionName('');
            setShowCreateForm(false);
        }
    };

    const handleCompare = (v1: ContractVersion, v2: ContractVersion) => {
        onCompareVersions(v1, v2);
        setComparingVersions([v1, v2]);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 60) return 'Hace unos segundos';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `Hace ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours} h`;
        const days = Math.floor(hours / 24);
        return `Hace ${days} días`;
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
            >
                <History className="w-3.5 h-3.5" />
                Versiones ({versions.length})
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl">
                            <History className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gestor de Versiones</h3>
                            <p className="text-xs text-slate-500">{versions.length} versiones guardadas</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar - Version List */}
                    <div className="w-80 border-r border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
                        <div className="p-4 space-y-3">
                            {/* Auto-save Section */}
                            {hasAutoSave && autoSaveData && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Auto-guardado</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mb-3">
                                        {formatTimeAgo(autoSaveData.timestamp)}
                                    </p>
                                    <button
                                        onClick={onRestoreAutoSave}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                                    >
                                        Restaurar auto-guardado
                                    </button>
                                </div>
                            )}

                            {/* Create Version Button */}
                            {!showCreateForm ? (
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar versión actual
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={newVersionName}
                                        onChange={(e) => setNewVersionName(e.target.value)}
                                        placeholder="Nombre de la versión..."
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateVersion}
                                            disabled={!newVersionName.trim()}
                                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                setNewVersionName('');
                                            }}
                                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Versions List */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                    Historial de versiones
                                </h4>

                                {versions.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-4">
                                        No hay versiones guardadas
                                    </p>
                                ) : (
                                    versions.map((version) => (
                                        <div
                                            key={version.id}
                                            onClick={() => setSelectedVersion(version)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedVersion?.id === version.id
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                                            {version.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        {formatDate(version.timestamp)}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteVersion(version.id);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Version Details or Comparison */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {comparingVersions ? (
                            <VersionComparisonView
                                versions={comparingVersions}
                                comparison={onCompareVersions(comparingVersions[0], comparingVersions[1])}
                                onClose={() => setComparingVersions(null)}
                            />
                        ) : selectedVersion ? (
                            <VersionDetailView
                                version={selectedVersion}
                                onRestore={() => {
                                    onRestoreVersion(selectedVersion);
                                    setIsOpen(false);
                                }}
                                onCompare={() => handleCompare(selectedVersion, {
                                    id: 'current',
                                    name: 'Versión actual',
                                    content: currentContent,
                                    timestamp: Date.now(),
                                    variables: currentVariables
                                })}
                                onClose={() => setSelectedVersion(null)}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <History className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="text-slate-500">Selecciona una versión para ver detalles</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-componente para ver detalles de una versión
interface VersionDetailViewProps {
    version: ContractVersion;
    onRestore: () => void;
    onCompare: () => void;
    onClose: () => void;
}

const VersionDetailView: React.FC<VersionDetailViewProps> = ({
    version,
    onRestore,
    onCompare,
    onClose
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{version.name}</h4>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Fecha</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {new Date(version.timestamp).toLocaleString('es-ES')}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tamaño</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {version.content.length.toLocaleString()} caracteres
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">Vista previa</h5>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar">
                    <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {version.content.substring(0, 500)}
                        {version.content.length > 500 && '...'}
                    </pre>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onRestore}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar esta versión
                </button>
                <button
                    onClick={onCompare}
                    className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                    <GitCompare className="w-4 h-4" />
                    Comparar con actual
                </button>
            </div>
        </div>
    );
};

// Sub-componente para comparar versiones
interface VersionComparisonViewProps {
    versions: [ContractVersion, ContractVersion];
    comparison: VersionComparison;
    onClose: () => void;
}

const VersionComparisonView: React.FC<VersionComparisonViewProps> = ({
    versions,
    comparison,
    onClose
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">{versions[0].name}</span>
                    <GitCompare className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">{versions[1].name}</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {comparison.added.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                Añadido ({comparison.added.length} líneas)
                            </span>
                        </div>
                        <div className="space-y-1">
                            {comparison.added.map((line, i) => (
                                <div key={i} className="text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded">
                                    + {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {comparison.removed.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Trash2 className="w-4 h-4 text-rose-500" />
                            <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                                Eliminado ({comparison.removed.length} líneas)
                            </span>
                        </div>
                        <div className="space-y-1">
                            {comparison.removed.map((line, i) => (
                                <div key={i} className="text-xs text-rose-600 dark:text-rose-400 font-mono bg-rose-100 dark:bg-rose-900/40 p-2 rounded">
                                    - {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {comparison.modified.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <GitCompare className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                Modificado ({comparison.modified.length} líneas)
                            </span>
                        </div>
                        <div className="space-y-2">
                            {comparison.modified.map((mod, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="text-[10px] text-slate-400">Línea {mod.line}</div>
                                    <div className="text-xs text-rose-600 dark:text-rose-400 font-mono bg-rose-100 dark:bg-rose-900/40 p-2 rounded">
                                        - {mod.old}
                                    </div>
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded">
                                        + {mod.new}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {comparison.added.length === 0 && comparison.removed.length === 0 && comparison.modified.length === 0 && (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <p className="text-slate-600">Las versiones son idénticas</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VersionManager;
