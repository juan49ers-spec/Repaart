import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    useAcademyModules,
    useAcademyLessons,
    useCreateModule,
    useUpdateModule,
    useDeleteModule,
    useCreateLesson,
    useUpdateLesson,
    useDeleteLesson,
    useUpdateModulesOrder,
    useUpdateLessonsOrder
} from '../../../hooks/academy';
import { AcademyModule, AcademyLesson } from '../../../services/academyService';
import { BookOpen, Plus, Layout, Users, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

import AcademyHeader from './components/AcademyHeader';
import ModuleCard from './components/ModuleCard';
import LessonCard from './components/LessonCard';
import ModuleEditorModal from './components/ModuleEditorModal';
import LessonEditorModal from './components/LessonEditorModal';

interface SortableModuleProps {
    module: AcademyModule;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

function SortableModule({ module, ...props }: SortableModuleProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: module.id! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <ModuleCard
            module={module}
            setNodeRef={setNodeRef}
            dragAttributes={attributes}
            dragListeners={listeners}
            style={style}
            isDragging={isDragging}
            {...props}
        />
    );
}

interface SortableLessonProps {
    lesson: AcademyLesson;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}

function SortableLesson({ lesson, ...props }: SortableLessonProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lesson.id! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <LessonCard
            lesson={lesson}
            setNodeRef={setNodeRef}
            dragAttributes={attributes}
            dragListeners={listeners}
            style={style}
            isDragging={isDragging}
            {...props}
        />
    );
}

const AcademyAdmin = () => {
    const navigate = useNavigate();

    const { modules, loading: modulesLoading, refetch: refetchModules } = useAcademyModules('all');
    const { createModule } = useCreateModule();
    const { updateModule: updateModuleFunc } = useUpdateModule();
    const { deleteModule: deleteModuleFunc } = useDeleteModule();
    const { createLesson: createLessonFunc } = useCreateLesson();
    const { updateLesson: updateLessonFunc } = useUpdateLesson();
    const { deleteLesson: deleteLessonFunc } = useDeleteLesson();
    const { updateModulesOrder } = useUpdateModulesOrder();
    const { updateLessonsOrder } = useUpdateLessonsOrder();

    const [viewMode, setViewMode] = useState<'overview' | 'modules' | 'lessons'>('overview');
    const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null);
    const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
    const [editingLesson, setEditingLesson] = useState<AcademyLesson | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    // setIsSaving is used by future drag & drop implementation and other async operations

    const { lessons, refetch: refetchLessons } = useAcademyLessons(selectedModule?.id || null, 'all');

    const [localModules, setLocalModules] = useState<AcademyModule[]>([]);
    const [localLessons, setLocalLessons] = useState<AcademyLesson[]>([]);

    useEffect(() => {
        if (modules) {
            setLocalModules([...modules].sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
    }, [modules]);

    useEffect(() => {
        if (!selectedModule || !lessons) {
            setLocalLessons([]);
            return;
        }
        const filtered = lessons.filter(l => l.module_id === selectedModule.id);
        setLocalLessons([...filtered].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }, [lessons, selectedModule]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEndModules = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localModules.findIndex((m) => m.id === active.id);
            const newIndex = localModules.findIndex((m) => m.id === over.id);

            const newModules = arrayMove(localModules, oldIndex, newIndex);
            setLocalModules(newModules);

            const updates = newModules.map((m, idx) => ({ id: m.id!, order: idx }));
            setIsSaving(true);
            try {
                await updateModulesOrder(updates);
                await refetchModules();
            } catch (error) {
                console.error('Error updating module orders', error);
                toast.error('Error al reordenar módulos');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDragEndLessons = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localLessons.findIndex((l) => l.id === active.id);
            const newIndex = localLessons.findIndex((l) => l.id === over.id);

            const newLessons = arrayMove(localLessons, oldIndex, newIndex);
            setLocalLessons(newLessons);

            const updates = newLessons.map((l, idx) => ({ id: l.id!, order: idx }));
            setIsSaving(true);
            try {
                await updateLessonsOrder(updates);
                await refetchLessons();
            } catch (error) {
                console.error('Error updating lesson orders', error);
                toast.error('Error al reordenar lecciones');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const filteredLessons = useMemo(() => {
        if (!selectedModule) return [];
        return lessons.filter(l => l.module_id === selectedModule.id);
    }, [lessons, selectedModule]);

    const moduleStats = useMemo(() => {
        const activeModules = modules.filter(m => m.status === 'active').length;
        const draftModules = modules.filter(m => m.status === 'draft').length;
        const totalLessons = lessons.length;

        return {
            totalModules: modules.length,
            activeModules,
            draftModules,
            totalLessons
        };
    }, [modules, lessons]);

    const handleCreateModule = async () => {
        const newOrder = modules.length + 1;
        const newModule = await createModule({
            title: 'Nuevo Módulo',
            description: 'Descripción del módulo...',
            order: newOrder,
            status: 'draft'
        });

        if (newModule) {
            await refetchModules();
            setEditingModule(newModule);
        }
    };

    const handleUpdateModule = async (moduleData: Partial<AcademyModule>) => {
        if (!editingModule?.id) return;
        setIsSaving(true);
        try {
            const dataToUpdate = { ...moduleData };
            delete dataToUpdate.id;
            await updateModuleFunc(editingModule.id, dataToUpdate);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            setEditingModule(null);
            await refetchModules();
        } catch (error) {
            console.error('[AcademyAdmin] Error al actualizar módulo:', error);
            alert('Error al guardar el módulo');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('¿Eliminar este módulo y todas sus lecciones? Esta acción no se puede deshacer.')) return;
        await deleteModuleFunc(moduleId);
        if (selectedModule?.id === moduleId) {
            setSelectedModule(null);
            setViewMode('modules');
        }
        await refetchModules();
    };

    const handleToggleModuleStatus = async (module: AcademyModule) => {
        if (!module.id) return;
        const newStatus = module.status === 'active' ? 'draft' : 'active';

        await updateModuleFunc(module.id, { status: newStatus });

        if (newStatus === 'active') {
            const moduleLessons = lessons.filter(l => l.module_id === module.id);
            // Publicar lecciones en draft o sin campo status definido
            const draftLessons = moduleLessons.filter(l => l.status === 'draft' || !l.status);

            console.log(`[AcademyAdmin] Publicando ${draftLessons.length} lecciones del módulo ${module.title}`);

            for (const lesson of draftLessons) {
                if (lesson.id) {
                    await updateLessonFunc(lesson.id, { status: 'published' });
                    console.log(`[AcademyAdmin] ✅ Lección publicada: ${lesson.title || lesson.id}`);
                }
            }

            // Mostrar notificación al usuario
            if (draftLessons.length > 0) {
                toast.success(`${draftLessons.length} lecciones publicadas automáticamente`);
            }
        }

        await refetchModules();
        await refetchLessons();
    };

    const handleDuplicateModule = async (module: AcademyModule) => {
        if (!module.id) return;

        const newOrder = modules.length + 1;
        const duplicatedModule = await createModule({
            title: `${module.title} (copia)`,
            description: module.description,
            order: newOrder,
            status: 'draft'
        });

        if (duplicatedModule) {
            const moduleLessons = lessons.filter(l => l.module_id === module.id);

            for (const lesson of moduleLessons) {
                if (selectedModule?.id) {
                    await createLessonFunc({
                        module_id: duplicatedModule.id!,
                        title: lesson.title,
                        content: lesson.content,
                        content_type: lesson.content_type,
                        video_url: lesson.video_url,
                        duration: lesson.duration,
                        order: lesson.order,
                        status: 'draft'
                    });
                }
            }

            await refetchModules();
            await refetchLessons();
        }
    };

    const handleCreateLesson = async () => {
        if (!selectedModule?.id) return;
        const moduleLessons = lessons.filter(l => l.module_id === selectedModule.id);
        const newOrder = moduleLessons.length + 1;

        const newLesson = await createLessonFunc({
            module_id: selectedModule.id,
            title: 'Nueva Lección',
            content: '',
            content_type: 'video',
            duration: 10,
            order: newOrder,
            status: 'draft'
        });

        if (newLesson) {
            await refetchLessons();
            setEditingLesson(newLesson);
        }
    };

    // Autosave: persiste sin cerrar el modal
    const handleAutoSaveLesson = async (lessonData: Partial<AcademyLesson>) => {
        console.log('[DEBUG] handleAutoSaveLesson triggered', { editingLessonId: editingLesson?.id, lessonData });
        if (!editingLesson?.id) {
            console.warn('[DEBUG] handleAutoSaveLesson aborted: no editingLesson.id');
            return;
        }
        try {
            const dataToUpdate = { ...lessonData };
            delete dataToUpdate.id;
            console.log('[DEBUG] Calling updateLessonFunc via AutoSave');
            await updateLessonFunc(editingLesson.id, dataToUpdate);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            console.log('[DEBUG] AutoSave success');
        } catch (error) {
            console.error('[AcademyAdmin] Error en auto-guardado:', error);
        }
    };

    // Guardado manual: persiste Y cierra el modal
    const handleUpdateLesson = async (lessonData: Partial<AcademyLesson>) => {
        console.log('[DEBUG] handleUpdateLesson triggered', { editingLessonId: editingLesson?.id, lessonData });
        if (!editingLesson?.id) {
            console.warn('[DEBUG] handleUpdateLesson aborted: no editingLesson.id');
            return;
        }
        try {
            const dataToUpdate = { ...lessonData };
            delete dataToUpdate.id;
            console.log('[DEBUG] Calling updateLessonFunc via Manual Save');
            await updateLessonFunc(editingLesson.id, dataToUpdate);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            setEditingLesson(null);
            console.log('[DEBUG] Manual Save success, clearing editingLesson and refetching');
            await refetchLessons();
        } catch (error) {
            console.error('[AcademyAdmin] Error al actualizar lección:', error);
            alert('Error al guardar la lección');
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('¿Eliminar esta lección?')) return;
        await deleteLessonFunc(lessonId);
        if (editingLesson?.id === lessonId) {
            setEditingLesson(null);
        }
        await refetchLessons();
    };

    const handleToggleLessonStatus = async (lesson: AcademyLesson) => {
        if (!lesson.id) return;
        const newStatus = lesson.status === 'published' ? 'draft' : 'published';
        await updateLessonFunc(lesson.id, { status: newStatus });
        await refetchLessons();
    };

    const handleLessonDataChange = (data: Partial<AcademyLesson>) => {
        if (editingLesson) {
            setEditingLesson({ ...editingLesson, ...data });
            setHasUnsavedChanges(true);
        }
    };

    const handleCloseLessonEditor = () => {
        if (hasUnsavedChanges && !confirm('Tienes cambios sin guardar. ¿Cerrar de todos modos?')) {
            return;
        }
        setEditingLesson(null);
        setHasUnsavedChanges(false);
    };

    if (modulesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <AcademyHeader
                onBack={() => navigate('/dashboard')}
                onViewStudent={() => navigate('/academy')}
                onCreateModule={handleCreateModule}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Overview Stats */}
                {viewMode === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8"
                    >
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6">
                            Resumen de la Academia
                        </h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center">
                                        <Layout className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                                        Total
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {moduleStats.totalModules}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    Módulos
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.15 }}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                                        Activos
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {moduleStats.activeModules}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    Publicados
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                                        Borradores
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {moduleStats.draftModules}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    Edición
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.25 }}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                                        Total
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {moduleStats.totalLessons}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    Lecciones
                                </p>
                            </motion.div>
                        </div>

                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => setViewMode('modules')}
                                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Layout className="w-5 h-5" />
                                Gestionar Módulos
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Modules Grid */}
                <AnimatePresence mode="wait">
                    {viewMode === 'modules' && (
                        <motion.div
                            key="modules"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                    Módulos
                                </h1>
                                <button
                                    onClick={() => setViewMode('overview')}
                                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-1.5 transition-colors"
                                >
                                    <Layout className="w-4 h-4" />
                                    Volver al resumen
                                </button>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEndModules}
                                modifiers={[restrictToWindowEdges]}
                            >
                                <SortableContext
                                    items={localModules.map((m) => m.id!)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {localModules.map((module) => (
                                            <SortableModule
                                                key={module.id}
                                                module={module}
                                                isSelected={selectedModule?.id === module.id}
                                                onSelect={() => {
                                                    setSelectedModule(module);
                                                    setViewMode('lessons');
                                                }}
                                                onEdit={() => setEditingModule(module)}
                                                onToggleStatus={() => handleToggleModuleStatus(module)}
                                                onDelete={() => module.id && handleDeleteModule(module.id)}
                                                onDuplicate={() => handleDuplicateModule(module)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {isSaving && (
                                <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando cambios...
                                </div>
                            )}

                            {modules.length === 0 && (
                                <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                        No hay módulos creados
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                        Crea tu primer módulo para comenzar
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Lessons List */}
                    {viewMode === 'lessons' && (
                        <motion.div
                            key="lessons"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <BookOpen className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {selectedModule?.title}
                                            </h2>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-widest">
                                                {filteredLessons.length} lecciones
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedModule(null);
                                            setViewMode('modules');
                                        }}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        aria-label="Cerrar vista de lecciones"
                                    >
                                        <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400 rotate-45" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <button
                                        onClick={() => setViewMode('modules')}
                                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-1.5 transition-colors"
                                    >
                                        <Layout className="w-4 h-4" />
                                        Volver a módulos
                                    </button>
                                </div>

                                <button
                                    onClick={handleCreateLesson}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva lección
                                </button>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEndLessons}
                                modifiers={[restrictToWindowEdges]}
                            >
                                <SortableContext
                                    items={localLessons.map((l) => l.id!)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {localLessons.map((lesson) => (
                                            <SortableLesson
                                                key={lesson.id}
                                                lesson={lesson}
                                                onEdit={() => setEditingLesson(lesson)}
                                                onToggleStatus={() => handleToggleLessonStatus(lesson)}
                                                onDelete={() => lesson.id && handleDeleteLesson(lesson.id)}
                                            />
                                        ))}

                                        {localLessons.length === 0 && (
                                            <div className="text-center py-12">
                                                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    Este módulo aún no tiene lecciones
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modals */}
                <ModuleEditorModal
                    isOpen={!!editingModule}
                    module={editingModule}
                    onClose={() => setEditingModule(null)}
                    onChange={(data) => {
                        if (editingModule) {
                            setEditingModule({ ...editingModule, ...data });
                        }
                    }}
                    onSave={handleUpdateModule}
                />

                <LessonEditorModal
                    isOpen={!!editingLesson}
                    lesson={editingLesson}
                    hasUnsavedChanges={hasUnsavedChanges}
                    lastSaved={lastSaved}
                    onClose={handleCloseLessonEditor}
                    onChange={handleLessonDataChange}
                    onSave={handleUpdateLesson}
                    onAutoSave={handleAutoSaveLesson}
                    onDelete={handleDeleteLesson}
                    onToggleStatus={editingLesson ? () => handleToggleLessonStatus(editingLesson) : undefined}
                />
            </div>
        </div>
    );
};

export default AcademyAdmin;
