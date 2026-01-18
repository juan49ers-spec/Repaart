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
    Trash2,
    Eye,
    Download,
    Plus,
    Pin,
    FolderOpen,
    Shield,
    Briefcase,
    BookOpen,
    Layout,
    Folder
} from 'lucide-react';
import DocPreviewModal from '../../components/ui/overlays/DocPreviewModal';
import ConfirmationModal from '../../components/ui/feedback/ConfirmationModal';
import ResourceUploadModal from './resources/ResourceUploadModal';
import AdminGuidesPanel from './knowledge/AdminGuidesPanel';
import UserManual from '../common/UserManual/UserManual';
import RequestsInbox from './resources/RequestsInbox';
import ServiceManager from './services/ServiceManager';
import { resourceRequestService } from '../../services/resourceRequestService';

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
    isMock?: boolean;
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

// 🗂️ Unified Folder Structure (Same as Franchise)
const FOLDERS = [
    { id: 'contracts', label: 'Marco Legal & Contratos', icon: Shield, color: 'text-indigo-500' },
    { id: 'manuals', label: 'Manuales Operativos', icon: BookOpen, color: 'text-emerald-500' },
    { id: 'commercial', label: 'Dossiers Comerciales', icon: Briefcase, color: 'text-amber-500' },
    { id: 'marketing', label: 'Activos de Marca', icon: Layout, color: 'text-rose-500' },
    { id: 'general', label: 'Documentación General', icon: Folder, color: 'text-slate-500' },
];

// 📄 Mock Data removed for production
const MOCK_RESOURCES: Resource[] = [];

const AdminResourcesPanel = () => {
    // Tab State (Global Navigation)
    const [activeTab, setActiveTab] = useState<'vault' | 'guides' | 'manual' | 'requests' | 'services'>('vault');
    const [activeCategory, setActiveCategory] = useState<string>('contracts');

    // Data State
    const [dbResources, setDbResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

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
            const fetched: Resource[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
            setDbResources(fetched);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching resources: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Pending Requests Count
    useEffect(() => {
        const fetchPending = async () => {
            const reqs = await resourceRequestService.getPendingRequests();
            setPendingRequestsCount(reqs.length);
        };
        fetchPending();
    }, []);

    // Merge Mock & Real
    const allResources = useMemo(() => {
        return [...MOCK_RESOURCES, ...dbResources];
    }, [dbResources]);

    // Filter Logic
    const filteredResources = useMemo(() => {
        let filtered = allResources;

        // 1. Category Filter
        if (activeCategory) {
            filtered = filtered.filter(r => (r.category || 'general') === activeCategory);
        }

        // 2. Search Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(resource =>
                (resource.title || resource.name || '').toLowerCase().includes(lower)
            );
        }

        // 3. Sort (Pinned first)
        return filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0; // Keep original order (createdAt)
        });
    }, [allResources, activeCategory, searchTerm]);


    // Actions
    const handleDelete = (file: Resource) => {
        if (file.isMock) {
            alert("No puedes eliminar archivos de ejemplo (Mock)");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Recurso',
            message: `¿Estás seguro de que quieres eliminar "${file.title || file.name}"? Esta acción es irreversible.`,
            confirmText: 'Eliminar',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    if (file.storagePath) {
                        const fileRef = ref(storage, file.storagePath);
                        await deleteObject(fileRef);
                    }
                    await deleteDoc(doc(db, 'resources', file.id));
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Error deleting resource: ", error);
                    alert("Error al eliminar el recurso.");
                }
            },
        });
    };

    const togglePin = async (file: Resource, event: React.MouseEvent) => {
        event.stopPropagation();
        if (file.isMock) return; // Mocks are fixed
        try {
            const fileRef = doc(db, 'resources', file.id);
            await updateDoc(fileRef, { isPinned: !file.isPinned });
        } catch (error) {
            console.error("Error toggling pin: ", error);
        }
    };

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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">

            {/* HEADER with Global Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 md:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Conocimiento
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold border border-indigo-500/20 uppercase tracking-widest">Admin</span>
                    </h2>
                    <p className="hidden md:block text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Gestión integral de documentación y guías.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap">
                    <button
                        onClick={() => setActiveTab('vault')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vault' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Bóveda Digital
                    </button>
                    <button
                        onClick={() => setActiveTab('guides')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'guides' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Guías Interactivas
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Manual de Uso
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Solicitudes
                        {pendingRequestsCount > 0 && (
                            <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] h-5 min-w-[20px] px-1 rounded-full border-2 border-slate-100 dark:border-slate-800">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Servicios Premium
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {activeTab === 'vault' ? (
                    <>
                        {/* 📱 MOBILE CATEGORY SELECTOR (Vault) */}
                        <div className="md:hidden shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap p-4 no-scrollbar flex gap-2">
                            {FOLDERS.map(folder => {
                                const isActive = activeCategory === folder.id;
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => setActiveCategory(folder.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <folder.icon size={14} />
                                        {folder.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 📂 SIDEBAR (Folders) - Desktop Only */}
                        <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex-col pt-6 pb-4">
                            <div className="px-6 mb-2">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Estructura de Archivos</h3>
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

                            <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 space-y-4">
                                {/* Storage Widget */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Almacenamiento</span>
                                        <span className="text-[10px] font-bold text-indigo-500">2.4 GB / 10 GB</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[24%] rounded-full" />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    Subir Nuevo Recurso
                                </button>
                            </div>
                        </aside>

                        {/* 📄 MAIN GRID */}
                        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden">
                            {/* Sub-Header / Search */}
                            <div className="h-auto md:h-16 p-4 md:px-8 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {FOLDERS.find(f => f.id === activeCategory)?.label}
                                    </h3>
                                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-0.5 rounded-md">
                                        {filteredResources.length}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative group flex-1 md:w-64 transition-all focus-within:md:w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar..."
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                                        <button onClick={() => setViewMode('grid')} title="Vista Cuadrícula" className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                            <Grid className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setViewMode('list')} title="Vista Lista" className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                            <ListIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
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
                                            No hay documentos en esta sección.
                                        </p>
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Subir primer archivo
                                        </button>
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
                                                            <th className="p-4 text-right pr-6">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                                        {filteredResources.map(file => (
                                                            <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => setPreviewFile(file)}>
                                                                <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                                                    <div className="transform scale-75">{getFileIcon(file.type)}</div>
                                                                    <div>
                                                                        {file.title || file.name}
                                                                        {file.isMock && <span className="ml-2 text-[9px] bg-slate-100 px-1 rounded text-slate-400">EJEMPLO</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-slate-500 font-mono text-xs">{formatBytes(file.size)}</td>
                                                                <td className="p-4 text-slate-500">{new Date().toLocaleDateString()}</td>
                                                                <td className="p-4 text-right pr-6">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={(e) => { e.stopPropagation(); /* Download logic */ }} title="Descargar" className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100">
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
                                        )}
                                    </>
                                )}
                            </div>
                        </main>
                    </>
                ) : activeTab === 'guides' ? (
                    <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                        <AdminGuidesPanel />
                    </div>
                ) : activeTab === 'requests' ? (
                    <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                        <RequestsInbox />
                    </div>
                ) : activeTab === 'services' ? (
                    <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                        <ServiceManager />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden p-6 bg-slate-50 dark:bg-slate-950">
                        <UserManual role="admin" />
                    </div>
                )}
            </div>

            {/* MODALS */}
            <ResourceUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => { /* Reload trigger? */ }}
            />

            <DocPreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile ? { ...previewFile, name: previewFile.title || previewFile.name || '', url: previewFile.url || '' } : null}
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
