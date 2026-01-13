import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';

import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, FieldValue } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

import { Kanban, Plus, Loader2, Search, X } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import FeatureCard from './FeatureCard';
import CreateFeatureModal from './CreateFeatureModal';
import EditFeatureModal from './EditFeatureModal';

interface FeatureRequest {
    id: string;
    title: string;
    description: string;
    status: 'proposed' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    createdBy: string;
    createdByEmail: string;
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
    labels?: string[];
    votes?: number;
    votedBy?: string[];
}

type NewFeatureData = Omit<FeatureRequest, 'id' | 'status' | 'createdBy' | 'createdByEmail' | 'createdAt' | 'updatedAt' | 'votes' | 'votedBy'>;

const COLUMNS = [
    { id: 'proposed', title: '📋 Propuesto', color: 'from-slate-500 to-slate-600' },
    { id: 'in_progress', title: '🔨 En Desarrollo', color: 'from-amber-500 to-orange-600' },
    { id: 'completed', title: '✅ Completado', color: 'from-emerald-500 to-green-600' }
] as const;

import { useToast } from '../../../hooks/useToast';

import confetti from 'canvas-confetti';

const FeatureBoard: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const toastContext = useToast();
    const toast = toastContext?.toast;
    const [features, setFeatures] = useState<FeatureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<FeatureRequest | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        // SECURITY: Only fetch if Admin. Double check client-side.
        if (!isAdmin) {
            const timer = setTimeout(() => setLoading(false), 0);
            return () => clearTimeout(timer);
        }

        const q = query(collection(db, 'feature_requests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const featuresData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FeatureRequest[];
            setFeatures(featuresData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching feature_requests:", err);
            toast?.error("Error de permisos cargando el roadmap.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    const handleCreateFeature = async (featureData: NewFeatureData) => {
        try {
            await addDoc(collection(db, 'feature_requests'), {
                ...featureData,
                status: 'proposed',
                // SIMPLIFICATION: Use auth object directly, no extra DB lookups
                createdBy: user?.displayName || 'Admin',
                createdByEmail: user?.email || 'admin@antigravity.com',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                votes: 0,
                votedBy: []
            });
            toast?.success('Mejora propuesta creada');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating feature:', error);
            toast?.error('Error al crear la mejora');
        }
    };

    const handleUpdateFeature = async (featureId: string, updates: Partial<FeatureRequest>) => {
        try {
            await updateDoc(doc(db, 'feature_requests', featureId), {
                ...updates,
                updatedAt: serverTimestamp()
            });
            toast?.success('Mejora actualizada');
            setEditingFeature(null);
        } catch (error) {
            console.error('Error updating feature:', error);
            toast?.error('Error al actualizar');
        }
    };

    const handleDeleteFeature = async (featureId: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta tarjeta?")) return;
        try {
            await deleteDoc(doc(db, 'feature_requests', featureId));
            toast?.success('Mejora eliminada');
            setEditingFeature(null);
        } catch (error) {
            console.error('Error deleting feature:', error);
            toast?.error('Error al eliminar');
        }
    };

    const handleStatusChange = async (featureId: string, newStatus: 'proposed' | 'in_progress' | 'completed') => {
        try {
            await updateDoc(doc(db, 'feature_requests', featureId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // UX Feedback
            const statusLabel = COLUMNS.find(c => c.id === newStatus)?.title;
            toast?.success(`Movido a ${statusLabel}`);

            if (newStatus === 'completed') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

        } catch (error) {
            console.error('Error updating status:', error);
            toast?.error('Error al actualizar el estado');
        }
    };

    const handleDragStart = (event: DragEndEvent) => {
        setActiveId(event.active.id as string);
        document.body.style.cursor = 'grabbing';
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        document.body.style.cursor = '';

        if (!over) return;

        const featureId = active.id as string;
        const newStatus = over.id as 'proposed' | 'in_progress' | 'completed';

        const feature = features.find(f => f.id === featureId);
        if (feature && feature.status !== newStatus) {
            handleStatusChange(featureId, newStatus);
        }
    };

    const getFeaturesByStatus = (status: 'proposed' | 'in_progress' | 'completed') => {
        return features.filter(feature => {
            const matchesStatus = feature.status === status;
            const matchesSearch = feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feature.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = priorityFilter === 'all' || feature.priority === priorityFilter;

            return matchesStatus && matchesSearch && matchesPriority;
        });
    };

    const activeFeature = activeId ? features.find(f => f.id === activeId) : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="min-h-screen bg-slate-950 p-4 md:p-8">
                {/* Header Simple (Admin Only) */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center">
                            <Kanban className="w-8 h-8 mr-3 text-indigo-400" />
                            Roadmap (Admin)
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Gestión interna de funcionalidades.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Tarea
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4 items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                        />
                        {searchQuery && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                title="Limpiar búsqueda"
                                aria-label="Limpiar búsqueda"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {(['all', 'high', 'medium', 'low'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPriorityFilter(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${priorityFilter === p
                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                    : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500'
                                    }`}
                            >
                                {p === 'all' && 'Todos'}
                                {p === 'high' && 'Alta'}
                                {p === 'medium' && 'Media'}
                                {p === 'low' && 'Baja'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {COLUMNS.map(column => {
                        const columnFeatures = getFeaturesByStatus(column.id);

                        return (
                            <div key={column.id} className="flex flex-col h-full">
                                {/* Column Header */}
                                <div className={`bg-gradient-to-r ${column.color} p-3 rounded-t-xl shadow-lg flex justify-between items-center`}>
                                    <h2 className="text-white font-bold text-sm">
                                        {column.title}
                                    </h2>
                                    <span className="bg-black/20 text-white/90 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                                        {columnFeatures.length}
                                    </span>
                                </div>

                                {/* Column Content */}
                                <div
                                    className="flex-1 bg-slate-900/30 border-x border-b border-slate-800 rounded-b-xl p-3 space-y-3 min-h-[400px]"
                                >
                                    {columnFeatures.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-slate-600 border-2 border-dashed border-slate-800 rounded-lg">
                                            <p className="text-xs">Vacío</p>
                                        </div>
                                    ) : (
                                        columnFeatures.map(feature => (
                                            <div
                                                key={feature.id}
                                                onClick={() => setEditingFeature(feature)}
                                                className="cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                                            >
                                                <FeatureCard
                                                    feature={feature}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Create Modal */}
                <CreateFeatureModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateFeature}
                />

                {/* Edit Modal */}
                <EditFeatureModal
                    isOpen={!!editingFeature}
                    onClose={() => setEditingFeature(null)}
                    feature={editingFeature}
                    onSave={handleUpdateFeature}
                    onDelete={handleDeleteFeature}
                />
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null}>
                {activeFeature ? (
                    <div className="opacity-80 rotate-3 cursor-grabbing w-[300px]">
                        <FeatureCard feature={activeFeature} onStatusChange={() => { }} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext >
    );
};

export default FeatureBoard;
