import React, { useState } from 'react';
import { Plus, X, BookOpen, Save } from 'lucide-react';
import { useAcademyModules, useCreateModule, useUpdateModule, useDeleteModule, AcademyModule } from '../../hooks/useAcademy';
import { serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

import LessonEditor from './admin/LessonEditor';
import { QuizEditor } from './admin/QuizEditor';
import AcademyAnalytics from './AcademyAnalytics';
import EncyclopediaView from './EncyclopediaView';
import AdminModuleCard from './AdminModuleCard';


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
            toast.error('El título es obligatorio');
            return;
        }

        try {
            await createModule({
                ...formData,
                order: modules.length + 1,
                lessonCount: 0,
                created_at: serverTimestamp(),
                category: 'general',
                status: 'draft'
            });

            setFormData({ title: '', description: '', duration: '', order: modules.length + 2 });
            setIsCreating(false);
            toast.success('Módulo creado correctamente');
        } catch (error) {
            console.error('Error creating module:', error);
            toast.error('Error al crear el módulo');
        }
    };

    const handleUpdate = async (moduleId: string) => {
        if (!editingModule) return;
        try {
            await updateModule(moduleId, editingModule);
            setEditingModule(null);
            toast.success('Módulo actualizado');
        } catch (error) {
            console.error('Error updating module:', error);
            toast.error('Error al actualizar el módulo');
        }
    };

    const handleDelete = async (moduleId: string, moduleTitle: string) => {
        if (!confirm(`¿Seguro que quieres eliminar "${moduleTitle}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await deleteModule(moduleId);
            toast.success('Módulo eliminado');
        } catch (error) {
            console.error('Error deleting module:', error);
            toast.error('Error al eliminar el módulo');
        }
    };

    const handleToggleStatus = async (module: AcademyModule) => {
        const newStatus = module.status === 'active' ? 'draft' : 'active';
        try {
            await updateModule(module.id!, { status: newStatus });
            toast.success(`Módulo ${newStatus === 'active' ? 'publicado' : 'ocultado'}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error al cambiar el estado');
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

    // If a module is selected, show the lesson editor
    if (selectedModule) {
        return (
            <LessonEditor
                moduleId={selectedModule.id!}
                onBack={() => setSelectedModule(null)}
            />
        );
    }

    if (selectedQuizModule) {
        return (
            <QuizEditor
                moduleId={selectedQuizModule.id}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {modules.length === 0 && !isCreating ? (
                                <div className="col-span-full text-center py-24 bg-white/60 dark:bg-slate-900/30 rounded-[2.5rem] border border-slate-200 dark:border-white/5 backdrop-blur-sm border-dashed">
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

                                    if (isEditing) {
                                        return (
                                            <div key={module.id} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl z-20">
                                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Editando Módulo</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Título</label>
                                                        <input
                                                            type="text"
                                                            value={editingModule?.title || ''}
                                                            onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                                                        <textarea
                                                            value={editingModule?.description || ''}
                                                            onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium resize-none"
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <button
                                                            onClick={() => module.id && handleUpdate(module.id)}
                                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingModule(null)}
                                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <AdminModuleCard
                                            key={module.id}
                                            module={module}
                                            onEdit={setEditingModule}
                                            onEditContent={setSelectedModule}
                                            onEditQuiz={setSelectedQuizModule}
                                            onDelete={handleDelete}
                                            onToggleStatus={handleToggleStatus}
                                        />
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
