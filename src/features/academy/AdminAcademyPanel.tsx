import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, BookOpen, Award, AlertCircle, FileText, ClipboardCheck } from 'lucide-react';
import { useAcademyModules, useCreateModule, useUpdateModule, useDeleteModule, AcademyModule } from '../../hooks/useAcademy';
import { formatDate } from '../../utils/formatDate';
import CreateExampleModuleButton from './CreateExampleModuleButton';
import LessonEditor from './LessonEditor';
import QuizEditor from './QuizEditor';
import AcademyAnalytics from './AcademyAnalytics';

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

    // Tabs: 'modules' | 'analytics'
    const [activeTab, setActiveTab] = useState<'modules' | 'analytics'>('modules');

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
        <div className="min-h-screen bg-slate-50 p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-indigo-600" />
                        Gestor de Academia
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {activeTab === 'modules' ? 'Administra los módulos y lecciones de la academia' : 'Analiza el progreso y resultados de los franquiciados'}
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-xl h-fit border border-slate-200">
                        <button
                            onClick={() => setActiveTab('modules')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'modules' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Módulos
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Analytics
                        </button>
                    </div>

                    {activeTab === 'modules' && (
                        <div className="flex gap-3">
                            <CreateExampleModuleButton onComplete={() => { }} />
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                            >
                                <Plus className="w-5 h-5" />
                                Nuevo Módulo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <AcademyAnalytics />
            ) : (
                <>
                    {/* Create Module Form */}
                    {isCreating && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 animate-fade-in-down">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Crear Nuevo Módulo</h3>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    aria-label="Cerrar formulario"
                                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Título del Módulo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ej: Introducción a Repaart"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Breve descripción del contenido del módulo"
                                        rows={3}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium resize-none bg-slate-50 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Duración Estimada
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="Ej: 45 min"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleCreate}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                                    >
                                        <Save className="w-5 h-5" />
                                        Crear Módulo
                                    </button>
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Banner */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold text-indigo-900 mb-1">ℹ️ Instrucciones</p>
                            <p className="text-indigo-700">
                                Los módulos se desbloquean secuencialmente. Los franquiciados deben completar cada módulo con 80% o más para acceder al siguiente.
                            </p>
                        </div>
                    </div>

                    {/* Modules List */}
                    <div className="space-y-4">
                        {modules.map((module) => {
                            const isEditing = editingModule?.id === module.id;

                            return (
                                <div
                                    key={module.id}
                                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:border-indigo-200 group"
                                >
                                    {isEditing ? (
                                        /* Edit Mode */
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Título del Módulo
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingModule?.title || ''}
                                                    onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50 focus:bg-white"
                                                    title="Título del Módulo"
                                                    placeholder="Ingrese el título"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Descripción
                                                </label>
                                                <textarea
                                                    value={editingModule?.description || ''}
                                                    onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none bg-slate-50 focus:bg-white"
                                                    title="Descripción del Módulo"
                                                    placeholder="Ingrese la descripción"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Duración
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingModule?.duration || ''}
                                                    onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, duration: e.target.value }) : null)}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50 focus:bg-white"
                                                    title="Duración del Módulo"
                                                    placeholder="Ej: 45 min"
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => handleUpdate(module.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition shadow-lg shadow-emerald-600/20"
                                                >
                                                    <Save className="w-5 h-5" />
                                                    Guardar Cambios
                                                </button>
                                                <button
                                                    onClick={() => setEditingModule(null)}
                                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                                        Módulo {module.order}
                                                    </span>
                                                    {module.duration && (
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            {module.duration}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-900 transition-colors">
                                                    {module.title}
                                                </h3>
                                                <p className="text-slate-600 mb-3 leading-relaxed">
                                                    {module.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md">
                                                        {module.lessonCount || 0} lecciones
                                                    </span>
                                                    {module.published ? (
                                                        <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                            <Award className="w-4 h-4" />
                                                            Publicado
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Borrador
                                                        </span>
                                                    )}

                                                </div>
                                                <div className="mt-2 text-xs text-slate-400 font-medium">
                                                    Actualizado: {formatDate(module.updatedAt || module.createdAt)}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedModule(module)}
                                                    aria-label="Gestionar lecciones"
                                                    className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition border border-transparent hover:border-indigo-100"
                                                    title="Gestionar lecciones"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedQuizModule(module)}
                                                    aria-label="Gestionar Quiz"
                                                    className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition border border-transparent hover:border-purple-100"
                                                    title="Gestionar Quiz"
                                                >
                                                    <ClipboardCheck className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingModule(module)}
                                                    aria-label="Editar módulo"
                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition border border-transparent hover:border-blue-100"
                                                    title="Editar módulo"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(module.id, module.title)}
                                                    aria-label="Eliminar módulo"
                                                    className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition border border-transparent hover:border-rose-100"
                                                    title="Eliminar módulo"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {modules.length === 0 && !isCreating && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                No hay módulos creados
                            </h3>
                            <p className="text-slate-500 mb-6">
                                Crea tu primer módulo para empezar a construir la academia
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <CreateExampleModuleButton onComplete={() => { }} />
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
                                >
                                    <Plus className="w-5 h-5" />
                                    Crear Módulo Vacío
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminAcademyPanel;
