import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { ResourceItem as Resource } from '../domain/resource.types';
import { formatBytes, getFileIcon } from '../domain/resource.formatters';

interface AdminResourceListProps {
    filteredResources: Resource[];
    selectedIds: Set<string>;
    toggleSelect: (id: string, e: React.MouseEvent) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setPreviewFile: (file: Resource) => void;
    handleDelete: (file: Resource) => void;
    handleDownload: (file: Resource, e: React.MouseEvent) => void;
}

export const AdminResourceList: React.FC<AdminResourceListProps> = ({
    filteredResources,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    setPreviewFile,
    handleDelete,
    handleDownload
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                        <th className="p-4 pl-4 w-10">
                            <button
                                onClick={selectedIds.size === filteredResources.length ? clearSelection : selectAll}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.size === filteredResources.length && filteredResources.length > 0
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                                    }`}
                            >
                                {selectedIds.size === filteredResources.length && filteredResources.length > 0 && (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        </th>
                        <th className="p-4 pl-2">Documento</th>
                        <th className="p-4">Tamaño</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4 text-right pr-6">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredResources.map(file => (
                        <tr key={file.id} className={`transition-colors group cursor-pointer ${selectedIds.has(file.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`} onClick={() => setPreviewFile(file)}>
                            <td className="p-4 pl-4 w-10">
                                <button
                                    onClick={(e) => toggleSelect(file.id, e)}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.has(file.id)
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                                        }`}
                                >
                                    {selectedIds.has(file.id) && (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            </td>
                            <td className="p-4 pl-2 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="transform scale-75">{getFileIcon(file.type)}</div>
                                <div>
                                    {file.title || file.name}
                                    {file.isMock && <span className="ml-2 text-[9px] bg-slate-100 px-1 rounded text-slate-400">EJEMPLO</span>}
                                </div>
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-xs">{formatBytes(file.size || 0)}</td>
                            <td className="p-4 text-slate-500">{file.createdAt?.toDate?.().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) || '—'}</td>
                            <td className="p-4 text-right pr-6">
                                <div className="flex justify-end gap-2">
                                    <button onClick={(e) => handleDownload(file, e)} title="Descargar" className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    {!file.isMock && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }} title="Eliminar" className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
