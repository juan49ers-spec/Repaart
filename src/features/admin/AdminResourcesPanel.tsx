import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { db, storage } from '../../lib/firebase';
import { deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import {
    Grid,
    List as ListIcon,
    Search,
    Trash2,
    Download,
    Plus,
    Sparkles,
    UploadCloud,
    FileUp,
    Archive,
    ChevronRight,
    ArrowUpDown,
    Home
} from 'lucide-react';
import DocPreviewModal from '../../components/ui/overlays/DocPreviewModal';
import ConfirmationModal from '../../components/ui/feedback/ConfirmationModal';
import ResourceUploadModal from './resources/ResourceUploadModal';
import { useAuth } from '../../context/AuthContext';
import { AdminResourceGrid } from './resources/components/AdminResourceGrid';
import { AdminResourceList } from './resources/components/AdminResourceList';
import SmartContractWizard from './resources/SmartContractWizard';
import FiscalValidationModal from './resources/FiscalValidationModal';
import FiscalDataForm from './resources/FiscalDataForm';
import TemplateSelector from './resources/TemplateSelector';
import { useFranchiseData } from '../../hooks/useFranchiseData';
import { ContractTemplate } from './resources/templates/templateLibrary';
import AdminGuidesPanel from './knowledge/AdminGuidesPanel';
import RequestsInbox from './resources/RequestsInbox';
import ServiceManager from './services/ServiceManager';

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
    [key: string]: unknown;
}

import { FOLDERS } from './resources/domain/resource.constants';
import { AdminResourceSidebar } from './resources/components/AdminResourceSidebar';
import { AdminResourceMobileNav } from './resources/components/AdminResourceMobileNav';
import { AdminResourceHeader, AdminResourceTab } from './resources/components/AdminResourceHeader';
import { useAdminResources } from './resources/hooks/useAdminResources';
import { calculateStorageStats, calculateFolderCounts, filterAndSortResources } from './resources/domain/resource.selectors';
import { SortMode } from './resources/domain/resource.types';

interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: (() => void) | null;
}



// 📄 Mock Data removed for production
const MOCK_RESOURCES: Resource[] = [];

const AdminResourcesPanel = () => {
    const { forceTokenRefresh, user } = useAuth();

    // 🏢 Datos fiscales del franquiciado
    const { franchiseData, validation, isReady } = useFranchiseData(user?.uid);

    // Tab State (Global Navigation)
    const [activeTab, setActiveTab] = useState<AdminResourceTab>('vault');
    const [activeCategory, setActiveCategory] = useState<string>('contracts');

    // Data State
    const { dbResources, loading, pendingRequestsCount } = useAdminResources();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

    // Modals & Overlays State
    type OverlayType = 'none' | 'upload' | 'wizard' | 'fiscalValidation' | 'fiscalDataForm' | 'templateSelector';
    const [activeOverlay, setActiveOverlay] = useState<OverlayType>('none');
    
    // Data tied to modals
    const [previewFile, setPreviewFile] = useState<Resource | null>(null);
    const [templateContent, setTemplateContent] = useState('');
    
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
    });

    // 🎯 Dropzone State
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [droppedFile, setDroppedFile] = useState<File | null>(null);

    // 📊 Sidebar & Sort State
    const [sortMode, setSortMode] = useState<SortMode>('newest');

    // ☑️ Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelectedIds(new Set(filteredResources.map(r => r.id)));
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleBulkDelete = () => {
        const toDelete = filteredResources.filter(r => selectedIds.has(r.id) && !r.isMock);
        if (toDelete.length === 0) return;
        setConfirmDialog({
            isOpen: true,
            title: `Eliminar ${toDelete.length} recurso(s)`,
            message: `¿Estás seguro de eliminar ${toDelete.length} archivo(s)? Esta acción no se puede deshacer.`,
            isDestructive: true,
            confirmText: 'Eliminar todos',
            onConfirm: async () => {
                const deletePromises = toDelete.map(async (file) => {
                    if (file.storagePath) {
                        const storageRef = ref(storage, file.storagePath);
                        await deleteObject(storageRef);
                    }
                    await deleteDoc(doc(db, 'resources', file.id));
                });

                const results = await Promise.allSettled(deletePromises);
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed === 0) {
                    toast.success(`${successful} recursos eliminados correctamente.`);
                } else if (successful === 0) {
                    toast.error(`Error al eliminar los ${failed} recursos seleccionados.`);
                } else {
                    toast.error(`Se eliminaron ${successful} recursos, pero fallaron ${failed}.`);
                }

                clearSelection();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleBulkDownload = () => {
        filteredResources
            .filter(r => selectedIds.has(r.id) && r.url)
            .forEach(r => window.open(r.url, '_blank', 'noopener,noreferrer'));
    };

    const handleOpenWizard = async () => {
        // Primero verificar datos fiscales
        if (!isReady) {
            setActiveOverlay('fiscalValidation');
            return;
        }

        // Abrir selector de plantillas
        setActiveOverlay('templateSelector');
    };

    const handleSelectTemplate = (template: ContractTemplate) => {
        setTemplateContent(template.content);
        setActiveOverlay('wizard');
    };

    const handleForceTokenRefresh = async () => {
        await forceTokenRefresh();
        toast.success('Token actualizado. Intenta subir el documento nuevamente.');
    };

    // Fetch Data (Handle by useAdminResources now)

    // Merge Mock & Real
    const allResources = [...MOCK_RESOURCES, ...dbResources] as Resource[];

    // Computed storage stats
    const storageStats = calculateStorageStats(allResources);

    // Per-folder resource counts
    const folderCounts = calculateFolderCounts(allResources);

    // Download handler
    const handleDownload = (file: Resource, e: React.MouseEvent) => {
        e.stopPropagation();
        if (file.url) {
            window.open(file.url, '_blank', 'noopener,noreferrer');
        }
    };

    // Filter Logic
    const filteredResources = filterAndSortResources(allResources, activeCategory, searchTerm, sortMode);


    // Actions
    const handleDelete = (file: Resource) => {
        if (file.isMock) {
            toast.error("No puedes eliminar archivos de ejemplo (Mock)", { id: 'mock-delete' });
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
                    toast.success('Recurso eliminado correctamente.');
                } catch (error) {
                    console.error("Error deleting resource: ", error);
                    toast.error("Error al eliminar el recurso.");
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


    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">

            {/* HEADER with Global Navigation */}
            <AdminResourceHeader 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                pendingRequestsCount={pendingRequestsCount}
                onForceTokenRefresh={handleForceTokenRefresh}
            />

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {activeTab === 'vault' ? (
                    <>
                        <AdminResourceMobileNav 
                            folders={FOLDERS}
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                        />

                        <AdminResourceSidebar 
                            folders={FOLDERS}
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            folderCounts={folderCounts}
                            storageStats={storageStats}
                            onUploadClick={() => setActiveOverlay('upload')}
                            onOpenWizard={handleOpenWizard}
                        />

                        {/* 📄 MAIN GRID */}
                        <main
                            className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden"
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDraggingOver(false); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDraggingOver(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    setDroppedFile(e.dataTransfer.files[0]);
                                    setActiveOverlay('upload');
                                }
                            }}
                        >
                            {/* Drag Overlay */}
                            {isDraggingOver && (
                                <div className="absolute inset-0 z-50 bg-indigo-600/10 dark:bg-indigo-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl shadow-indigo-500/20 border-2 border-dashed border-indigo-400 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                                            <FileUp className="w-8 h-8 text-indigo-500 animate-bounce" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white">Soltar archivo aquí</p>
                                        <p className="text-sm text-slate-500">Se guardará en <span className="font-semibold text-indigo-600">{FOLDERS.find(f => f.id === activeCategory)?.label}</span></p>
                                    </div>
                                </div>
                            )}

                            {/* Sub-Header / Breadcrumb + Search + Sort */}
                            <div className="h-auto p-4 md:px-8 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-10 space-y-3">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2 text-xs">
                                    <button onClick={() => setActiveCategory('contracts')} className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                        <Home className="w-3 h-3" />
                                        Conocimiento
                                    </button>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <span className="text-slate-400">Bóveda</span>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <span className="font-bold text-slate-700 dark:text-white">
                                        {FOLDERS.find(f => f.id === activeCategory)?.label}
                                    </span>
                                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1">
                                        {filteredResources.length}
                                    </span>
                                </div>

                                {/* Search + Sort + View Toggle */}
                                <div className="flex items-center gap-3 w-full">
                                    <div className="relative group flex-1 md:max-w-sm transition-all focus-within:md:max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar..."
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* Sort Selector */}
                                    <div className="relative">
                                        <select
                                            value={sortMode}
                                            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                                            aria-label="Ordenar recursos"
                                            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs pl-8 pr-6 py-2 text-slate-600 dark:text-slate-400 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                                        >
                                            <option value="newest">Más recientes</option>
                                            <option value="oldest">Más antiguos</option>
                                            <option value="name_asc">Nombre A-Z</option>
                                            <option value="name_desc">Nombre Z-A</option>
                                            <option value="size_desc">Mayor tamaño</option>
                                            <option value="size_asc">Menor tamaño</option>
                                        </select>
                                        <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>

                                    {/* View Toggle */}
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

                            {/* Bulk Action Bar */}
                            {selectedIds.size > 0 && (
                                <div className="mx-8 mt-4 mb-0 p-3 bg-indigo-600 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2 fade-in duration-200 shadow-lg shadow-indigo-500/30">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-white/20 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                                            {selectedIds.size}
                                        </span>
                                        <span className="text-white/90 text-sm font-medium">seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
                                        <button onClick={selectAll} className="text-white/70 text-xs hover:text-white transition-colors underline underline-offset-2">
                                            Seleccionar todos ({filteredResources.length})
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleBulkDownload}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Descargar
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-3 py-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Eliminar
                                        </button>
                                        <button
                                            onClick={clearSelection}
                                            className="p-1.5 text-white/50 hover:text-white transition-colors ml-1"
                                            title="Deseleccionar"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {loading ? (
                                    <div className="grid grid-cols-4 gap-6 animate-pulse">
                                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
                                    </div>
                                ) : filteredResources.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                                        {/* Premium Empty State */}
                                        <div className="relative mb-6">
                                            <div className="w-28 h-28 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-900/20 dark:to-slate-800/50 rounded-3xl flex items-center justify-center shadow-inner">
                                                <Archive className="w-12 h-12 text-indigo-300 dark:text-indigo-600" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                                <Plus className="w-4 h-4 text-indigo-500" />
                                            </div>
                                        </div>

                                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
                                            {FOLDERS.find(f => f.id === activeCategory)?.label || 'Carpeta'} vacía
                                        </h4>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mb-8 leading-relaxed">
                                            Arrastra archivos aquí o usa los botones para empezar a organizar tus documentos.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => setActiveOverlay('upload')}
                                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 group"
                                            >
                                                <UploadCloud className="w-4 h-4 group-hover:animate-bounce" />
                                                Subir archivo
                                            </button>
                                            <button
                                                onClick={handleOpenWizard}
                                                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:-translate-y-0.5 group"
                                            >
                                                <Sparkles className="w-4 h-4 text-indigo-500 group-hover:animate-pulse" />
                                                Generar contrato
                                            </button>
                                        </div>

                                        <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-6 flex items-center gap-1.5">
                                            <UploadCloud className="w-3 h-3" />
                                            PDF, Imágenes, Word, Excel — máx. 25 MB
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {viewMode === 'grid' ? (
                                            <AdminResourceGrid 
                                                filteredResources={filteredResources}
                                                selectedIds={selectedIds}
                                                toggleSelect={toggleSelect}
                                                setPreviewFile={setPreviewFile}
                                                togglePin={togglePin}
                                                handleDelete={handleDelete}
                                            />
                                        ) : (
                                            <AdminResourceList 
                                                filteredResources={filteredResources}
                                                selectedIds={selectedIds}
                                                toggleSelect={toggleSelect}
                                                selectAll={selectAll}
                                                clearSelection={clearSelection}
                                                setPreviewFile={setPreviewFile}
                                                handleDelete={handleDelete}
                                                handleDownload={handleDownload}
                                            />
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
                ) : (
                    <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                        <ServiceManager />
                    </div>
                )}
            </div>

            {/* MODALS */}
            <ResourceUploadModal
                isOpen={activeOverlay === 'upload'}
                onClose={() => { setActiveOverlay('none'); setDroppedFile(null); }}
                onSuccess={() => { setDroppedFile(null); setActiveOverlay('none'); }}
                defaultCategory={activeCategory}
                initialFile={droppedFile}
            />

            <DocPreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile ? { ...previewFile, name: previewFile.title || previewFile.name || '', url: previewFile.url || '' } : null}
            />

            {/* 🧠 Smart Contract Wizard */}
            <SmartContractWizard
                isOpen={activeOverlay === 'wizard'}
                onClose={() => setActiveOverlay('none')}
                templateName="PLANTILLA CONTRATO RESTAURANTES.md"
                templateContent={templateContent}
                franchiseData={franchiseData}
            />

            {/* 💼 Fiscal Validation Modal */}
            <FiscalValidationModal
                isOpen={activeOverlay === 'fiscalValidation'}
                onClose={() => setActiveOverlay('none')}
                onContinue={() => setActiveOverlay('templateSelector')}
                onEdit={() => setActiveOverlay('fiscalDataForm')}
                validation={validation}
                franchiseData={franchiseData}
            />

            {/* 📝 Fiscal Data Form */}
            <FiscalDataForm
                isOpen={activeOverlay === 'fiscalDataForm'}
                onClose={() => setActiveOverlay('none')}
                onSuccess={() => {
                    // Refrescar el estado en vez de recargar la página entera
                    setActiveOverlay('none');
                    // Opcional: Se podría notificar a `useAdminResources` u otro hook para forzar refetch
                    toast.success('Datos fiscales guardados correctamente.');
                }}
            />

            {/* 📄 Template Selector */}
            <TemplateSelector
                isOpen={activeOverlay === 'templateSelector'}
                onClose={() => setActiveOverlay('none')}
                onSelectTemplate={handleSelectTemplate}
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
