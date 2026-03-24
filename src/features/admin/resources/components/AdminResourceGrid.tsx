import React from 'react';
import { Pin, Trash2, Eye } from 'lucide-react';
import { ResourceItem as Resource } from '../domain/resource.types';
import { formatBytes, getFileIcon } from '../domain/resource.formatters';

interface AdminResourceGridProps {
    filteredResources: Resource[];
    selectedIds: Set<string>;
    toggleSelect: (id: string, e: React.MouseEvent) => void;
    setPreviewFile: (file: Resource) => void;
    togglePin: (file: Resource, e: React.MouseEvent) => void;
    handleDelete: (file: Resource) => void;
}

export const AdminResourceGrid: React.FC<AdminResourceGridProps> = ({
    filteredResources,
    selectedIds,
    toggleSelect,
    setPreviewFile,
    togglePin,
    handleDelete
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map((file) => (
                <div
                    key={file.id}
                    onClick={() => setPreviewFile(file)}
                    className={`group bg-white dark:bg-slate-900 border rounded-[2rem] p-5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center relative overflow-hidden ${selectedIds.has(file.id)
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                        }`}
                >
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-20">
                        <button
                            onClick={(e) => toggleSelect(file.id, e)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.has(file.id)
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100 hover:border-indigo-400'
                                }`}
                        >
                            {selectedIds.has(file.id) && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {file.isMock && (
                        <div className="absolute top-3 left-3 z-10">
                            <span className="bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">EJEMPLO</span>
                        </div>
                    )}

                    {/* Gradient Flash on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {/* Admin Controls */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => togglePin(file, e)}
                            title={file.isPinned ? "Desfijar" : "Fijar"}
                            className={`p-1.5 rounded-lg backdrop-blur-sm ${file.isPinned ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <Pin size={14} className={file.isPinned ? 'fill-current' : ''} />
                        </button>
                        {!file.isMock && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                title="Eliminar recurso"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 backdrop-blur-sm"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    <div className="w-20 h-20 mb-4 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 mt-2">
                        <div className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        {getFileIcon(file.type)}
                    </div>

                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight mb-2 line-clamp-2 px-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {file.title || file.name}
                    </h4>

                    <span className="text-[10px] font-mono text-slate-400 mb-4">{formatBytes(file.size || 0)}</span>

                    <div className="mt-auto pt-4 w-full border-t border-slate-50 dark:border-slate-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Visualizar</span>
                        <Eye className="w-4 h-4 text-indigo-500" />
                    </div>
                </div>
            ))}
        </div>
    );
};
