import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import {
    FileText,
    Image as ImageIcon,
    File,
    Grid,
    List as ListIcon,
    Search,
    Eye,
    Download,
    Folder,
    FolderOpen,
    Shield,
    Briefcase,
    BookOpen,
    Layout
} from 'lucide-react';
import DocPreviewModal from '../../ui/overlays/DocPreviewModal';

interface Resource {
    id: string;
    title?: string;
    name?: string;
    category?: string;
    type?: string;
    size?: number;
    url?: string;
    createdAt?: Timestamp;
    isMock?: boolean;
}

// 🗂️ Default Folder Structure
const FOLDERS = [
    { id: 'contracts', label: 'Marco Legal & Contratos', icon: Shield, color: 'text-indigo-500' },
    { id: 'manuals', label: 'Manuales Operativos', icon: BookOpen, color: 'text-emerald-500' },
    { id: 'commercial', label: 'Dossiers Comerciales', icon: Briefcase, color: 'text-amber-500' },
    { id: 'marketing', label: 'Activos de Marca', icon: Layout, color: 'text-rose-500' },
    { id: 'general', label: 'Documentación General', icon: Folder, color: 'text-slate-500' },
];

// 📄 Mock Data removed for production
const MOCK_RESOURCES: Resource[] = [];


import DocumentRequestModal from './components/DocumentRequestModal';

const ResourcesPanel: React.FC = () => {
    // State
    const [dbResources, setDbResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [activeCategory, setActiveCategory] = useState<string>('contracts');
    const [previewFile, setPreviewFile] = useState<Resource | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // Fetch Real Resources
    useEffect(() => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Resource[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
            setDbResources(fetched);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching resources:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Merge Mock & Real
    const allResources = useMemo(() => {
        return [...MOCK_RESOURCES, ...dbResources];
    }, [dbResources]);

    // Filter Logic
    const filteredResources = useMemo(() => {
        let filtered = allResources;

        // 1. Filter by Category
        if (activeCategory) {
            filtered = filtered.filter(r => (r.category || 'general') === activeCategory);
        }

        // 2. Filter by Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                (r.title || r.name || '').toLowerCase().includes(lower)
            );
        }
        return filtered;
    }, [allResources, activeCategory, searchTerm]);

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (type?: string) => {
        if (type?.includes('pdf')) return <FileText className="w-10 h-10 text-rose-500" />;
        if (type?.includes('image')) return <ImageIcon className="w-10 h-10 text-indigo-500" />;
        if (type?.includes('zip')) return <Folder className="w-10 h-10 text-amber-500" />;
        if (type?.includes('sheet') || type?.includes('excel')) return <FileText className="w-10 h-10 text-emerald-500" />;
        if (type?.includes('presentation')) return <FileText className="w-10 h-10 text-orange-500" />;
        return <File className="w-10 h-10 text-slate-400" />;
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">

            {/* 📂 SIDEBAR (Folders) */}
            <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col pt-6 pb-4">
                <div className="px-6 mb-8">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Recursos
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium pl-8">Bóveda Digital Operativa</p>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {FOLDERS.map(folder => {
                        const isActive = activeCategory === folder.id;
                        return (
                            <button
                                key={folder.id}
                                onClick={() => setActiveCategory(folder.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <folder.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    {folder.label}
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    {/* Storage Info (Read Only) */}
                    <div className="bg-slate-50 dark:bg-slate-800/10 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">Documentación Segura</h4>
                                <p className="text-[10px] text-slate-400">Encriptado E2E</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Shield className="w-20 h-20" />
                        </div>
                        <h4 className="font-bold text-sm relative z-10">¿Necesitas ayuda?</h4>
                        <p className="text-[10px] text-slate-300 mt-1 relative z-10 leading-relaxed mb-3">
                            Si no encuentras un documento específico, contacta con Central.
                        </p>
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-colors backdrop-blur-sm"
                        >
                            Solicitar Documento
                        </button>
                    </div>
                </div>
            </aside>

            {/* 📄 MAIN CONTENT (Grid) */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/50 relative">

                {/* Header / Search */}
                <div className="h-20 px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {FOLDERS.find(f => f.id === activeCategory)?.label}
                        </h3>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                            {filteredResources.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group w-64 transition-all focus-within:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar en carpeta..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button onClick={() => setViewMode('grid')} title="Vista Cuadrícula" className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                <Grid className="w-4 h-4" />
                            </button>
                            <button onClick={() => setViewMode('list')} title="Vista Lista" className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="grid grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
                        </div>
                    ) : filteredResources.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-80 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group relative">
                                <div className="absolute inset-0 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-full animate-spin-slow pointer-events-none" />
                                <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform" />
                            </div>
                            <h4 className="text-lg font-black text-slate-700 dark:text-slate-200">Carpeta Vacía</h4>
                            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-[200px] mt-2 mb-6 leading-relaxed">
                                No se han publicado documentos en esta sección.
                            </p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredResources.map((file) => (
                                        <div
                                            key={file.id}
                                            onClick={() => setPreviewFile(file)}
                                            className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
                                        >
                                            {file.isMock && (
                                                <div className="absolute top-3 right-3">
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">MOCK</span>
                                                </div>
                                            )}

                                            {/* Gradient Flash on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                            <div className="w-20 h-20 mb-4 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {getFileIcon(file.type)}
                                            </div>

                                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight mb-2 line-clamp-2 px-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {file.title || file.name}
                                            </h4>

                                            <span className="text-[10px] font-mono text-slate-400 mb-4">{formatBytes(file.size)}</span>

                                            <div className="mt-auto pt-4 w-full border-t border-slate-50 dark:border-slate-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Visualizar</span>
                                                <Eye className="w-4 h-4 text-indigo-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase font-bold text-slate-500 tracking-wider">
                                            <tr>
                                                <th className="p-4 pl-6">Documento</th>
                                                <th className="p-4">Tamaño</th>
                                                <th className="p-4">Fecha</th>
                                                <th className="p-4 text-right pr-6">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                            {filteredResources.map(file => (
                                                <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => setPreviewFile(file)}>
                                                    <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                                        <div className="transform scale-75">{getFileIcon(file.type)}</div>
                                                        {file.title || file.name}
                                                    </td>
                                                    <td className="p-4 text-slate-500 font-mono text-xs">{formatBytes(file.size)}</td>
                                                    <td className="p-4 text-slate-500">{new Date().toLocaleDateString()}</td>
                                                    <td className="p-4 text-right pr-6">
                                                        <button title="Descargar" className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Modal */}
            <DocPreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile ? { ...previewFile, name: previewFile.title || previewFile.name || '', url: previewFile.url || '' } : null}
            />

            <DocumentRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                folders={FOLDERS}
            />
        </div>
    );
};

export default ResourcesPanel;
