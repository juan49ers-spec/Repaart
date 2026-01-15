import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyModules, useCreateModule, useDeleteModule, useUpdateModule } from '../../../hooks/useAcademy';
import { AcademyModule } from '../../../hooks/useAcademy';
import { Plus, Edit2, Trash2, GripVertical, Video, FileText, MoreVertical, HelpCircle } from 'lucide-react';
import { AcademySeeder } from '../AcademySeeder';

export const AcademyAdminView = () => {
    const navigate = useNavigate();
    const { modules, loading } = useAcademyModules();
    const createModule = useCreateModule();
    const updateModule = useUpdateModule();
    const deleteModule = useDeleteModule();

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<AcademyModule>>({});
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            const newOrder = modules.length > 0 ? Math.max(...modules.map(m => m.order || 0)) + 1 : 1;
            await createModule({
                id: '',
                title: 'Nuevo Módulo',
                description: 'Descripción del módulo...',
                order: newOrder,
                duration: '0 min',
                lessonCount: 0,
                category: 'general',
                status: 'draft'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`¿Eliminar módulo "${title}"? Se borrarán todas sus lecciones y exámenes.`)) {
            await deleteModule(id);
        }
    };

    const handleSave = async (id: string) => {
        await updateModule(id, editForm);
        setIsEditing(null);
        setEditForm({});
    };

    const startEdit = (module: AcademyModule) => {
        if (!module.id) return;
        setIsEditing(module.id);
        setEditForm({ title: module.title, description: module.description, duration: module.duration });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando Studio...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 space-y-8 animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Video className="w-8 h-8 text-indigo-500" />
                        Academy Studio
                    </h1>
                    <p className="text-slate-500 mt-1">Gestor de Contenidos y Experiencia de Aprendizaje</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/academy?mode=student')}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm border border-slate-200 dark:border-slate-700 transition"
                    >
                        Ver como Estudiante
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-500/30"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Módulo
                    </button>
                </div>
            </header>

            {/* SEEDER: Keep it handy for massive resets */}
            <AcademySeeder />

            <div className="grid gap-4">
                {modules.map((module) => (
                    <div
                        key={module.id}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm hover:shadow-md transition group"
                    >
                        {/* Drag Handle (Visual only for now) */}
                        <div className="hidden md:flex text-slate-300 cursor-move">
                            <GripVertical className="w-6 h-6" />
                        </div>

                        <div className="flex-1 w-full">
                            {isEditing === module.id ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full text-xl font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2"
                                        placeholder="Título del Módulo"
                                    />
                                    <textarea
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 min-h-[80px]"
                                        placeholder="Descripción..."
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setIsEditing(null)} className="px-3 py-1 text-sm text-slate-500">Cancelar</button>
                                        <button onClick={() => module.id && handleSave(module.id)} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg">Guardar</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                            Módulo {module.order}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{module.title}</h3>
                                    </div>
                                    <p className="text-slate-500 text-sm line-clamp-2">{module.description}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-400">
                                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {module.lessonCount || 0} Lecciones</span>
                                        <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {module.duration}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                            {isEditing !== module.id && module.id && (
                                <>
                                    <button
                                        onClick={() => navigate(`/admin/academy/module/${module.id}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 transition"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Lecciones
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/academy/quiz/${module.id}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-100 transition"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        Examen
                                    </button>
                                    <button
                                        onClick={() => startEdit(module)}
                                        className="p-2 text-slate-400 hover:text-indigo-500 transition rounded-lg hover:bg-slate-100"
                                        title="Editar Detalles"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(module.id!, module.title)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                                        title="Eliminar Módulo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {modules.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-2xl">
                        <p className="text-slate-500 font-medium">No hay módulos creados. ¡Crea el primero o usa el Seeder!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
