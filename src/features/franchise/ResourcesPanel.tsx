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
    PlayCircle
} from 'lucide-react';
import { GUIDE_THEMES, GUIDE_ICONS } from '../../lib/constants';
import DocPreviewModal from '../../ui/overlays/DocPreviewModal';
import UserManual from '../common/UserManual/UserManual';

interface Resource {
    id: string;
    title?: string;
    name?: string;
    category?: string;
    type?: string;
    size?: number;
    url?: string;
    createdAt?: Timestamp;
    [key: string]: any;
}

interface GuideData {
    id: string;
    title: string;
    description: string;
    category: string;
    theme: keyof typeof GUIDE_THEMES;
    icon: keyof typeof GUIDE_ICONS;
    isCritical: boolean;
    url?: string;
    createdAt?: Timestamp;
}

// --- HELPERS ---
const formatBytes = (bytes: number | undefined, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileIcon = (type?: string) => {
    if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    if (type?.includes('image')) return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    if (type?.includes('sheet') || type?.includes('csv') || type?.includes('excel')) return <FileText className="w-5 h-5 text-emerald-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
};

const isNew = (date?: Timestamp) => {
    if (!date) return false;
    const now = new Date();
    const created = date.toDate();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

const ResourcesPanel: React.FC = () => {
    // State
    const [resources, setResources] = useState<Resource[]>([]);
    const [guides, setGuides] = useState<GuideData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [previewFile, setPreviewFile] = useState<Resource | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]); // Array of IDs
    const [activeTab, setActiveTab] = useState<'library' | 'manual'>('library');

    // Fetch Guides
    useEffect(() => {
        const q = query(collection(db, "guides"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setGuides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuideData)));
        }, (error) => {
            console.warn("Error fetching guides:", error);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Resources (Files)
    useEffect(() => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedResources: Resource[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Resource[];
            setResources(fetchedResources);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching resources: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Logic
    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleFileClick = (file: Resource) => {
        setPreviewFile(file);
    };

    const filteredResources = useMemo(() => {
        if (!searchTerm) return resources;
        const lower = searchTerm.toLowerCase();
        return resources.filter(r =>
            (r.title && r.title.toLowerCase().includes(lower)) ||
            (r.name && r.name.toLowerCase().includes(lower))
        );
    }, [resources, searchTerm]);


    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-200 transition-colors duration-300 relative overflow-hidden">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-8 pb-4 relative z-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Recursos</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Biblioteca digital y procedimientos operativos.</p>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'library'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
                                }`}
                        >
                            Biblioteca
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manual'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
                                }`}
                        >
                            Manual de Uso
                        </button>
                    </div>

                    {activeTab === 'library' && (
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-white/60 dark:border-slate-800 flex shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                title="Vista de lista"
                                aria-label="Cambiar a vista de lista"
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <ListIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                title="Vista de cuadrícula"
                                aria-label="Cambiar a vista de cuadrícula"
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-auto px-8 py-8 space-y-12 relative z-10">

                {activeTab === 'manual' ? (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <UserManual role="franchise" />
                    </div>
                ) : (
                    <>
                        {/* --- MANUALS SECTION (DYNAMIC) --- */}
                        {guides.length > 0 && (
                            <section className="animate-in slide-in-from-bottom-4 duration-700 fade-in">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:from-transparent dark:via-slate-700 dark:to-transparent" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 px-2">Guías Interactivas</span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:from-transparent dark:via-slate-700 dark:to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {guides.map((guide) => {
                                        const theme = GUIDE_THEMES[guide.theme] || GUIDE_THEMES.indigo;
                                        const Icon = GUIDE_ICONS[guide.icon] || FileText;

                                        return (
                                            <div
                                                key={guide.id}
                                                onClick={() => {
                                                    if (guide.url) window.open(guide.url, '_blank');
                                                }}
                                                className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                                            >
                                                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                                    <Icon className={`w-24 h-24 ${theme.text}`} />
                                                </div>

                                                {guide.isCritical && (
                                                    <div className="absolute top-4 right-4 animate-pulse">
                                                        <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">CRÍTICO</span>
                                                    </div>
                                                )}

                                                <div className={`w-14 h-14 rounded-2xl ${theme.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                                                    <Icon className={`w-7 h-7 ${theme.text}`} />
                                                </div>
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 pr-8 leading-tight">{guide.title}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">{guide.description}</p>

                                                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <span className={`text-[10px] uppercase font-black tracking-widest ${theme.text}`}>Ver Guía</span>
                                                    <PlayCircle className={`w-4 h-4 ${theme.text}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Biblioteca</h3>
                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                                        {filteredResources.length} Archivos
                                    </span>
                                </div>

                                {/* Search */}
                                <div className="relative group w-72 transition-all focus-within:w-96">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar documentos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl leading-5 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 shadow-sm transition-all duration-300 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="aspect-[4/3] bg-white/40 dark:bg-slate-800/30 rounded-3xl" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* --- VIEW: LIST --- */}
                                    {viewMode === 'list' && (
                                        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                                                        <th className="p-5 pl-8">Nombre del Archivo</th>
                                                        <th className="p-5">Tipo</th>
                                                        <th className="p-5">Tamaño</th>
                                                        <th className="p-5 text-right pr-8">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-5 dark:divide-slate-800/50">
                                                    {filteredResources.length > 0 ? (
                                                        filteredResources.map((file) => (
                                                            <tr
                                                                key={file.id}
                                                                onClick={() => handleFileClick(file)}
                                                                className="group hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                                            >
                                                                <td className="p-4 pl-8">
                                                                    <div className="flex items-center gap-4">
                                                                        <button onClick={(e) => toggleFavorite(e, file.id)} className={`text-lg transition-colors ${favorites.includes(file.id) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}>
                                                                            ★
                                                                        </button>
                                                                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                                                                            {getFileIcon(file.type)}
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                                    {file.title || file.name}
                                                                                </span>
                                                                                {isNew(file.createdAt) && (
                                                                                    <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">NUEVO</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                        {file.category || 'GENERAL'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-xs font-mono text-slate-400 font-medium">{formatBytes(file.size)}</td>
                                                                <td className="p-4 text-right pr-8">
                                                                    <button
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                                        title="Vista Previa"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="p-16 text-center text-slate-400 font-medium">
                                                                No se encontraron documentos que coincidan con tu búsqueda.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* --- VIEW: GRID --- */}
                                    {viewMode === 'grid' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {filteredResources.map((file) => (
                                                <div
                                                    key={file.id}
                                                    onClick={() => handleFileClick(file)}
                                                    className="group relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-slate-800 rounded-3xl p-5 hover:border-indigo-400/30 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                                >
                                                    <div className="absolute top-4 left-4 z-20">
                                                        {isNew(file.createdAt) && (
                                                            <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">NUEVO</span>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={(e) => toggleFavorite(e, file.id)}
                                                        className={`absolute top-4 right-4 p-2 transition-colors z-20 ${favorites.includes(file.id) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                                                    >
                                                        ★
                                                    </button>

                                                    <div className="flex flex-col items-center text-center pt-4 pb-2">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-white/60 dark:border-slate-700 shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                                            <div className="transform scale-125">
                                                                {getFileIcon(file.type)}
                                                            </div>
                                                        </div>

                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors px-2">
                                                            {file.title || file.name}
                                                        </h4>

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400">
                                                                {file.category || 'DOC'}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-400">{formatBytes(file.size)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Hover Glow Effect */}
                                                    <div className="absolute inset-0 rounded-3xl border-2 border-indigo-500/0 group-hover:border-indigo-500/10 transition-colors pointer-events-none" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* PREVIEW MODAL */}
                <DocPreviewModal
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    file={previewFile ? {
                        name: previewFile.title || previewFile.name || '',
                        url: previewFile.url || '',
                        type: previewFile.type
                    } : null}
                />
            </div>
        </div>
    );
};

export default ResourcesPanel;
