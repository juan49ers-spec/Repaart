import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyModules, useCreateModule, useDeleteModule, useUpdateModule } from '../../../hooks/useAcademy';
import { AcademyModule } from '../../../hooks/useAcademy';
import { Plus, Video } from 'lucide-react';
import { AcademySeeder } from '../AcademySeeder';
import AdminModuleCard from '../AdminModuleCard';


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

    const handleToggleStatus = async (module: AcademyModule) => {
        const newStatus = module.status === 'active' ? 'draft' : 'active';
        try {
            await updateModule(module.id!, { status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
        }
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                    const isEditingModule = isEditing === module.id;

                    if (isEditingModule) {
                        return (
                            <div key={module.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl relative z-10">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Editando Módulo</h3>
                                    <input
                                        type="text"
                                        value={editForm.title || ''}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Título del Módulo"
                                    />
                                    <textarea
                                        value={editForm.description || ''}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 min-h-[80px] outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Descripción..."
                                    />
                                    <div className="flex gap-2 justify-end pt-2">
                                        <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-sm text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition">Cancelar</button>
                                        <button onClick={() => module.id && handleSave(module.id)} className="px-4 py-2 text-sm bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Guardar Cambios</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <AdminModuleCard
                            key={module.id}
                            module={module}
                            onEdit={startEdit}
                            onEditContent={() => navigate(`/admin/academy/module/${module.id}`)}
                            onEditQuiz={() => navigate(`/admin/academy/quiz/${module.id}`)}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                        />
                    );
                })}

                {modules.length === 0 && (
                    <div className="col-span-full text-center py-20 border-2 border-dashed border-slate-300 rounded-2xl">
                        <p className="text-slate-500 font-medium">No hay módulos creados. ¡Crea el primero o usa el Seeder!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
