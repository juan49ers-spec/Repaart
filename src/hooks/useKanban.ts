import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface KanbanTask {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    createdAt: Timestamp | null;
    // v2.1 Improvements
    description?: string;
    dueDate?: Timestamp | null;
    tags?: string[];
    checklist?: { id: string; text: string; completed: boolean }[];
    comments?: {
        id: string;
        text: string;
        createdAt: Timestamp | null; // Firebase Timestamp
        userId: string;
        userName: string;
    }[];
}

export const useKanban = () => {
    const { isAdmin } = useAuth();
    const queryClient = useQueryClient();
    const COLLECTION = 'project_tasks';

    // 1. Fetch Tasks (READ)
    const { data: tasks = [], isLoading, error } = useQuery({
        queryKey: ['kanban-tasks'],
        queryFn: async () => {
            if (!isAdmin) return []; // Security Check Client-Side
            const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as KanbanTask[];
        },
        enabled: !!isAdmin, // Only fetch if admin
        staleTime: 1000 * 60 * 5, // 5 minutes fresh
    });

    // 2. Add Task (CREATE)
    const addTaskMutation = useMutation({
        mutationFn: async (newTask: Omit<KanbanTask, 'id' | 'createdAt'>) => {
            return await addDoc(collection(db, COLLECTION), {
                ...newTask,
                createdAt: serverTimestamp()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
        }
    });

    // 3. Update Task (UPDATE - Optimistic)
    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<KanbanTask> & { id: string }) => {
            const taskRef = doc(db, COLLECTION, id);
            await updateDoc(taskRef, updates);
        },
        onMutate: async ({ id, ...updates }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['kanban-tasks'] });

            // Snapshot previous value
            const previousTasks = queryClient.getQueryData<KanbanTask[]>(['kanban-tasks']);

            // Optimistically update
            queryClient.setQueryData<KanbanTask[]>(['kanban-tasks'], (old = []) => {
                return old.map(task =>
                    task.id === id ? { ...task, ...updates } : task
                );
            });

            return { previousTasks };
        },
        onError: (err, _newTodo, context) => {
            // Rollback
            queryClient.setQueryData(['kanban-tasks'], context?.previousTasks);
            console.error("Error optimista:", err);
        },
        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
        },
    });

    // 4. Delete Task (DELETE)
    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, COLLECTION, id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
        }
    });

    return {
        tasks,
        isLoading,
        error,
        addTask: addTaskMutation.mutate,
        updateTask: updateTaskMutation.mutate,
        deleteTask: deleteTaskMutation.mutate
    };
};
