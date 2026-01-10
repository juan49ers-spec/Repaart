import React, { useState, useEffect, useMemo } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, deleteDoc, doc, query, orderBy, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import {
    FileText,
    Image as ImageIcon,
    File,
    Grid,
    List as ListIcon,
    Search,
    Loader2,
    Trash2,
    Eye,
    Download,
    Plus,
    Pin,
    FolderOpen
} from 'lucide-react';
import DocPreviewModal from '../../ui/overlays/DocPreviewModal';
import ConfirmationModal from '../../ui/feedback/ConfirmationModal';
import ResourceUploadModal from './resources/ResourceUploadModal';
import AdminGuidesPanel from './knowledge/AdminGuidesPanel';

interface Resource {
    id: string;
    title?: string;
    name?: string;
    category?: string;
    type?: string;
    size?: number;
    url?: string;
    storagePath?: string;
    createdAt?: Timestamp;
    isPinned?: boolean;
    [key: string]: any;
}

interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: (() => void) | null;
}

interface CategoryConfig {
    label: string;
    color: string;
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

const CATEGORIES: Record<string, CategoryConfig> = {
    'general': { label: 'General', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
    'manuals': { label: 'Manuales', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    'marketing': { label: 'Marketing', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    'legal': { label: 'Legal', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    'hr': { label: 'RR.HH.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

const AdminResourcesPanel = () => {
    // Tab State
    const [activeTab, setActiveTab] = useState<'files' | 'guides'>('files');

    // Data State
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Modals State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<Resource | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
    });

    // Fetch resources
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

    // Filter and sort resources
    const filteredResources = useMemo(() => {
        let filtered = resources;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(resource => resource.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(resource =>
                (resource.title && resource.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (resource.name && resource.name.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        // Sort: Pinned first, then by creation date
        return filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
    }, [resources, selectedCategory, searchTerm]);

    // Handle file deletion
    const handleDelete = (file: Resource) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Recurso',
            message: `¿Estás seguro de que quieres eliminar "${file.title || file.name}"? Esta acción es irreversible.`,
            confirmText: 'Eliminar',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    // Delete from storage
                    if (file.storagePath) {
                        const fileRef = ref(storage, file.storagePath);
                        await deleteObject(fileRef);
                    }
                    // Delete from Firestore
                    await deleteDoc(doc(db, 'resources', file.id));
                    console.log("Resource deleted successfully!");
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Error deleting resource: ", error);
                    alert("Error al eliminar el recurso.");
                }
            },
        });
    };

    // Handle pin toggle
    const togglePin = async (file: Resource, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent opening preview modal
        try {
            const fileRef = doc(db, 'resources', file.id);
            await updateDoc(fileRef, {
                isPinned: !file.isPinned
            });
        } catch (error) {
            console.error("Error toggling pin: ", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 min-h-screen font-sans transition-colors duration-300">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md sticky top-0 z-20">
                <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        Centro de Conocimiento
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 uppercase tracking-wider">Admin</span>
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión integral de documentación y guías.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'files'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
                                }`}
                        >
                            Archivos
                        </button>
                        <button
                            onClick={() => setActiveTab('guides')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'guides'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
                                }`}
                        >
                            Guías Interactivas
                        </button>
                    </div>

                    {activeTab === 'files' && (
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                            {/* View Toggles */}
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                    <ListIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                    <Grid className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Recurso
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            {activeTab === 'guides' ? (
                <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                    <AdminGuidesPanel />
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-6">
                    {/* FILTERS */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {['all', 'manuals', 'marketing', 'legal', 'hr', 'general'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCategory === cat
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : 'bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-600 hover:text-indigo-600 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {cat === 'all' ? 'Todos' : CATEGORIES[cat]?.label || cat}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* LIST VIEW */}
                            {viewMode === 'list' && (
                                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                                <th className="p-4 pl-6 w-8" />
                                                <th className="p-4">Nombre</th>
                                                <th className="p-4">Categoría</th>
                                                <th className="p-4">Tamaño</th>
                                                <th className="p-4">Fecha</th>
                                                <th className="p-4 text-right pr-6">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                            {filteredResources.map((file) => {
                                                const catStyle = CATEGORIES[file.category || 'general'] || CATEGORIES['general'];
                                                return (
                                                    <tr key={file.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="p-4 pl-6">
                                                            <button
                                                                onClick={(e) => togglePin(file, e)}
                                                                className={`p-1.5 rounded-md transition-all ${file.isPinned ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-slate-400'}`}
                                                            >
                                                                <Pin size={14} className={file.isPinned ? "fill-current" : ""} />
                                                            </button>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
                                                                    {getFileIcon(file.type)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                                                                        {file.title || file.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${catStyle.color}`}>
                                                                {catStyle.label}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-500 font-mono">
                                                            {formatBytes(file.size)}
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-500">
                                                            {file.createdAt ? file.createdAt.toDate().toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => setPreviewFile(file)}
                                                                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <a
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                                >
                                                                    <Download size={16} />
                                                                </a>
                                                                <button
                                                                    onClick={() => handleDelete(file)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredResources.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                        No se encontraron recursos.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* GRID VIEW */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {filteredResources.map((file) => {
                                        const catStyle = CATEGORIES[file.category || 'general'] || CATEGORIES['general'];
                                        return (
                                            <div key={file.id} className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-black/20 hover:-translate-y-1 transition-all relative">

                                                {/* Pin Badge */}
                                                {file.isPinned && (
                                                    <div className="absolute top-3 right-3 text-amber-400">
                                                        <Pin size={14} className="fill-current" />
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/30 shadow-inner group-hover:scale-110 transition-transform">
                                                        {getFileIcon(file.type)}
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate mb-1.5" title={file.title}>
                                                        {file.title || file.name}
                                                    </h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${catStyle.color}`}>
                                                        {catStyle.label}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                                    <span className="text-[10px] text-slate-500 font-mono">{formatBytes(file.size)}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setPreviewFile(file)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                                                            <Eye size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(file)} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* MODALS */}
            <ResourceUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => {/* Toast success could go here */ }}
            />

            <DocPreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile ? {
                    name: previewFile.title || previewFile.name || '',
                    url: previewFile.url || '',
                    type: previewFile.type
                } : null}
            />

            <ConfirmationModal
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm!}
                title={confirmDialog.title}
                message={confirmDialog.message}
                isDestructive={confirmDialog.isDestructive}
                confirmText={confirmDialog.confirmText}
            />
        </div>
    );
};

export default AdminResourcesPanel;
