import React, { useState } from 'react';
import { useAdminAnnouncements } from '../../hooks/useAdminAnnouncements';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Plus, Trash2, Megaphone, AlertTriangle, Info, X, Users, Eye } from 'lucide-react';
import { Card } from '../../components/ui/primitives/Card';
import Button from '../../components/ui/inputs/Button';

// Interface for Franchise from Firestore
interface FranchiseUser {
    id: string;
    franchiseId?: string;
    email: string;
    role: string;
    [key: string]: any;
}

// Interface for New Post State
interface NewPostState {
    title: string;
    content: string;
    priority: 'normal' | 'high' | 'critical';
    type: 'news' | 'alert' | 'poll';
    targetAudience: 'all' | 'specific';
    targetFranchises: string[];
}

const AnnouncementSystem = () => {
    // Assuming useAdminAnnouncements is properly typed, if not we infer types
    const { announcements, loading, createAnnouncement, deleteAnnouncement } = useAdminAnnouncements();
    const [isCreating, setIsCreating] = useState(false);

    const [newPost, setNewPost] = useState<NewPostState>({
        title: '',
        content: '',
        priority: 'normal',
        type: 'news',
        targetAudience: 'all', // 'all' or 'specific'
        targetFranchises: []
    });

    // Franchise logic
    const [franchises, setFranchises] = useState<FranchiseUser[]>([]);

    // Load Franchise List on mount
    React.useEffect(() => {
        const loadFranchises = async () => {
            try {
                // Use users collection with role='franchise' and status='active' filter
                const q = query(
                    collection(db, "users"),
                    where('role', '==', 'franchise'),
                    where('status', '==', 'active')
                );
                const snap = await getDocs(q);
                const list = snap.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        ...data
                    } as FranchiseUser;
                });
                setFranchises(list);
            } catch (e) {
                console.error("Error loading franchises", e);
            }
        };
        loadFranchises();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.title || !newPost.content) return;

        await createAnnouncement(
            newPost.title,
            newPost.content,
            newPost.type,
            newPost.priority,
            newPost.targetAudience,
            newPost.targetFranchises
        );

        setNewPost({
            title: '',
            content: '',
            priority: 'normal',
            type: 'news',
            targetAudience: 'all',
            targetFranchises: []
        });
        setIsCreating(false);
    };

    const toggleFranchiseSelection = (franchiseId: string) => {
        setNewPost(prev => {
            const current = prev.targetFranchises;
            const newSelection = current.includes(franchiseId)
                ? current.filter(id => id !== franchiseId)
                : [...current, franchiseId];
            return { ...prev, targetFranchises: newSelection };
        });
    };

    if (loading) return <div className="p-4 text-center">Cargando sistema de anuncios...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Megaphone className="w-6 h-6 mr-3 text-blue-600" />
                    Centro de Comunicación HQ
                </h2>
                <Button onClick={() => setIsCreating(!isCreating)} icon={isCreating ? X : Plus} variant={isCreating ? 'secondary' : 'primary'}>
                    {isCreating ? 'Cancelar' : 'Nuevo Anuncio'}
                </Button>
            </div>

            {/* CREATION FORM */}
            {isCreating && (
                <Card className="animate-fade-in-down border-blue-200 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={newPost.title}
                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Cambio de Tarifas 2024"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Prioridad</label>
                                    <select
                                        value={newPost.priority}
                                        onChange={e => setNewPost({ ...newPost, priority: e.target.value as any })}
                                        className="w-full rounded-lg border-slate-300"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="high">Alta</option>
                                        <option value="critical">Crítica 🚨</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                                    <select
                                        value={newPost.type}
                                        onChange={e => setNewPost({ ...newPost, type: e.target.value as any })}
                                        className="w-full rounded-lg border-slate-300"
                                    >
                                        <option value="news">Noticia</option>
                                        <option value="alert">Alerta</option>
                                        <option value="poll">Encuesta</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Audience Selector */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Audiencia</label>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="audience"
                                        value="all"
                                        checked={newPost.targetAudience === 'all'}
                                        onChange={() => setNewPost({ ...newPost, targetAudience: 'all' })}
                                    />
                                    <span className="text-sm">Toda la Red ({franchises.length})</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="audience"
                                        value="specific"
                                        checked={newPost.targetAudience === 'specific'}
                                        onChange={() => setNewPost({ ...newPost, targetAudience: 'specific' })}
                                    />
                                    <span className="text-sm">Seleccionar Franquicias</span>
                                </label>
                            </div>

                            {newPost.targetAudience === 'specific' && (
                                <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 p-2 bg-white rounded border border-slate-200">
                                    {franchises.map(f => {
                                        const fid = f.franchiseId || f.id;
                                        return (
                                            <label key={f.id} className="flex items-center gap-2 text-xs p-1 hover:bg-slate-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newPost.targetFranchises.includes(fid)}
                                                    onChange={() => toggleFranchiseSelection(fid)}
                                                />
                                                <span className="truncate" title={fid || f.email}>
                                                    {(fid || f.email).toUpperCase()}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Contenido</label>
                            <textarea
                                value={newPost.content}
                                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                className="w-full rounded-lg border-slate-300 h-32 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Escribe el contenido del comunicado..."
                                required
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" variant="primary">Publicar Comunicado</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* LIST */}
            <div className="grid gap-4">
                {announcements.map(item => (
                    <Card key={item.id} className="relative group hover:shadow-md transition-shadow">
                        <button
                            onClick={() => deleteAnnouncement(item.id)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                            title="Eliminar anuncio"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        <div className="flex items-start">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-4
                                ${item.priority === 'critical' ? 'bg-rose-100 text-rose-600' :
                                    item.priority === 'high' ? 'bg-amber-100 text-amber-600' :
                                        'bg-blue-100 text-blue-600'}
                             `}>
                                {item.priority === 'critical' ? <AlertTriangle className="w-6 h-6" /> :
                                    item.type === 'alert' ? <AlertTriangle className="w-6 h-6" /> :
                                        <Info className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                                    {item.priority === 'critical' && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase">Crítico</span>}

                                    {/* Audience Badge */}
                                    {item.targetAudience === 'specific' ? (
                                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            Segmentado ({item.targetFranchises?.length || 0})
                                        </span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">Global</span>
                                    )}

                                    <span className="text-xs text-slate-400 ml-auto">
                                        {item.createdAt instanceof Date ? item.createdAt.toLocaleDateString() :
                                            // Handle Firestore Timestamp
                                            (item.createdAt as any)?.toDate?.().toLocaleDateString() || 'Reciente'
                                        }
                                    </span>
                                </div>
                                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed mb-3">{item.content}</p>

                                {/* Read Stats */}
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded w-fit">
                                    <Eye className="w-3 h-3" />
                                    <span>Visto por {item.reads?.length || 0} usuarios</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
                {announcements.length === 0 && (
                    <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay comunicados publicados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementSystem;
