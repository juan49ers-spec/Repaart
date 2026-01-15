import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, BookOpen, FileText, ClipboardCheck } from 'lucide-react';
import { useAcademyModules, useCreateModule, useUpdateModule, useDeleteModule, AcademyModule } from '../../hooks/useAcademy';
import { formatDate } from '../../utils/formatDate';

import LessonEditor from './LessonEditor';
import QuizEditor from './QuizEditor';
import AcademyAnalytics from './AcademyAnalytics';
import EncyclopediaView from './EncyclopediaView';


interface ModuleFormData {
    title: string;
    description: string;
    duration: string;
    order: number;
    lessonCount?: number;
    createdAt?: string;
}

/**
 * Admin Panel for Academy - CRUD de módulos y lecciones
 * Solo visible para administradores
 */
const AdminAcademyPanel: React.FC = () => {
    const { modules, loading } = useAcademyModules();
    const createModule = useCreateModule();
    const updateModule = useUpdateModule();
    const deleteModule = useDeleteModule();

    // Tabs: 'modules' | 'analytics' | 'encyclopedia'
    const [activeTab, setActiveTab] = useState<'modules' | 'analytics' | 'encyclopedia'>('modules');

    const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null);
    const [selectedQuizModule, setSelectedQuizModule] = useState<AcademyModule | null>(null);
    const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<ModuleFormData>({
        title: '',
        description: '',
        duration: '',
        order: modules.length + 1
    });

    const handleCreate = async () => {
        if (!formData.title.trim()) {
            alert('El título es obligatorio');
            return;
        }

        try {
            await createModule({
                ...formData,
                order: modules.length + 1,
                lessonCount: 0,
                createdAt: new Date().toISOString()
            });

            setFormData({ title: '', description: '', duration: '', order: modules.length + 2 });
            setIsCreating(false);
        } catch (error) {
            console.error('Error creating module:', error);
            alert('Error al crear el módulo');
        }
    };

    const handleUpdate = async (moduleId: string) => {
        if (!editingModule) return;
        try {
            await updateModule(moduleId, editingModule);
            setEditingModule(null);
        } catch (error) {
            console.error('Error updating module:', error);
            alert('Error al actualizar el módulo');
        }
    };

    const handleDelete = async (moduleId: string, moduleTitle: string) => {
        if (!confirm(`¿Seguro que quieres eliminar "${moduleTitle}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await deleteModule(moduleId);
        } catch (error) {
            console.error('Error deleting module:', error);
            alert('Error al eliminar el módulo');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-pulse" />
                    <p className="text-slate-500 font-medium">Cargando panel de administración...</p>
                </div>
            </div>
        );
    }

    // Si hay un módulo seleccionado, mostrar el editor de lecciones (se mantiene fuera del sistema de tabs para máxima visibilidad)
    if (selectedModule) {
        return (
            <LessonEditor
                module={selectedModule}
                onBack={() => setSelectedModule(null)}
            />
        );
    }

    if (selectedQuizModule) {
        return (
            <QuizEditor
                module={selectedQuizModule}
                onBack={() => setSelectedQuizModule(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
            {/* Atmospheric Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
            </div>

            <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white dark:bg-indigo-500/10 rounded-2xl border border-slate-200 dark:border-indigo-500/20 backdrop-blur-xl shadow-lg shadow-indigo-500/5">
                                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h1 className="text-3xl font-normal text-slate-900 dark:text-white tracking-tight">Gestor de Academia</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 max-w-lg font-normal">
                            {activeTab === 'modules'
                                ? 'Diseño y orquestación de la arquitectura educativa.'
                                : activeTab === 'analytics'
                                    ? 'Monitorización estratégica del rendimiento.'
                                    : 'Base de conocimiento y manuales operativos.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Premium Tab Switcher */}
                        <div className="flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-inner">
                            <button
                                onClick={() => setActiveTab('modules')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-normal transition-all duration-300 ${activeTab === 'modules'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Módulos
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-normal transition-all duration-300 ${activeTab === 'analytics'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Analytics
                            </button>
                            <button
                                onClick={() => setActiveTab('encyclopedia')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-normal transition-all duration-300 ${activeTab === 'encyclopedia'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Enciclopedia
                            </button>
                        </div>

                        {activeTab === 'modules' && (
                            <div className="flex gap-3">
                                {/* <CreateExampleModuleButton onComplete={() => { }} /> */}
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="group flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl hover:brightness-110 font-medium shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] border border-white/10"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    Nuevo Módulo
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'analytics' ? (
                    <AcademyAnalytics />
                ) : activeTab === 'encyclopedia' ? (
                    <EncyclopediaView />
                ) : (
                    <>
                        {/* Create Module Form - Glassmorphic overlay */}
                        {isCreating && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] border border-slate-200 dark:border-white/10 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 max-w-2xl w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Nuevo Módulo Estratégico</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Define la identidad y objetivos de la nueva formación.</p>
                                        </div>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                            title="Cerrar modal"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                                Título del Módulo
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="Ej: Introducción a Repaart"
                                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Breve descripción del contenido del módulo"
                                                rows={3}
                                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                                Duración Estimada
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                placeholder="Ej: 45 min"
                                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-6">
                                            <button
                                                onClick={handleCreate}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                                            >
                                                <Save className="w-5 h-5" />
                                                Crear Módulo
                                            </button>
                                            <button
                                                onClick={() => setIsCreating(false)}
                                                className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition border border-slate-200 dark:border-white/5"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modules Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            {modules.length === 0 && !isCreating ? (
                                <div className="text-center py-24 bg-white/60 dark:bg-slate-900/30 rounded-[2.5rem] border border-slate-200 dark:border-white/5 backdrop-blur-sm border-dashed">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                                        No hay módulos creados
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto font-normal">
                                        Crea tu primer módulo para empezar a construir la estructura educativa.
                                    </p>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 font-medium shadow-xl shadow-indigo-600/20 transition active:scale-[0.98]"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Crear Módulo Vacío
                                    </button>
                                </div>
                            ) : (
                                modules.map((module: AcademyModule) => {
                                    const isEditing = editingModule?.id === module.id;

                                    return (
                                        <div
                                            key={module.id}
                                            className="group relative bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all duration-300 p-8 overflow-hidden shadow-sm dark:shadow-none"
                                        >
                                            {/* Glow Effect */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                            {isEditing ? (
                                                <div className="space-y-6 relative z-10 max-w-3xl">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Título</label>
                                                        <div className="space-y-4">
                                                            <input
                                                                type="text"
                                                                value={editingModule?.title || ''}
                                                                onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white outline-none"
                                                                placeholder="Título del módulo"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Descripción</label>
                                                            <textarea
                                                                value={editingModule?.description || ''}
                                                                onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white outline-none resize-none"
                                                                rows={2}
                                                                placeholder="Descripción"
                                                            />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleUpdate(module.id)}
                                                                className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                                            >
                                                                <Save className="w-4 h-4" /> Guardar
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingModule(null)}
                                                                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                                Módulo {module.order}
                                                            </div>
                                                            {module.duration && (
                                                                <span className="text-xs font-medium text-slate-500">{module.duration}</span>
                                                            )}
                                                            {module.published ? (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                                                                    Publicado
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                                                                    Borrador
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h3 className="text-2xl font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {module.title}
                                                        </h3>
                                                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                                                            {module.description}
                                                        </p>

                                                        <div className="pt-2 flex items-center gap-4">
                                                            <div className="text-xs text-slate-500 font-medium">
                                                                <span className="text-slate-800 dark:text-white font-semibold">{module.lessonCount || 0}</span> Lecciones
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                            <div className="text-xs text-slate-500 font-medium">
                                                                Actualizado: {formatDate(module.updatedAt || module.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedModule(module)}
                                                            className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300 font-medium text-sm flex items-center gap-2 group/btn"
                                                            title="Gestionar Lecciones"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span className="hidden md:inline">Lecciones</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedQuizModule(module)}
                                                            className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 dark:hover:text-white transition-all duration-300"
                                                            title="Editar Quiz"
                                                        >
                                                            <ClipboardCheck className="w-4 h-4" />
                                                        </button>
                                                        <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />
                                                        <button
                                                            onClick={() => setEditingModule(module)}
                                                            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                                            title="Configurar Módulo"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(module.id, module.title)}
                                                            className="p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                                                            title="Eliminar Módulo"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminAcademyPanel;
