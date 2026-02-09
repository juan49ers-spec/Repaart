import { useState, useEffect, useCallback } from 'react';
import { academyService, AcademyModule, AcademyLesson, AcademyProgress } from '../services/academyService';

export const useAcademyModules = (status?: 'draft' | 'active' | 'all') => {
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchModules = useCallback(async () => {
        try {
            setLoading(true);
            const data = await academyService.getAllModules(status);
            setModules(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchModules();
    }, [status, fetchModules]);

    return { modules, loading, error, refetch: fetchModules };
};

export const useAcademyModule = (moduleId: string | null) => {
    const [module, setModule] = useState<AcademyModule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!moduleId) {
            setModule(null);
            setLoading(false);
            return;
        }

        const fetchModule = async () => {
            try {
                setLoading(true);
                const data = await academyService.getModuleById(moduleId);
                setModule(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchModule();
    }, [moduleId]);

    return { module, loading, error };
};

export const useAcademyLessons = (moduleId: string | null, status?: 'draft' | 'published' | 'all') => {
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchLessons = useCallback(async () => {
        if (!moduleId) {
            setLessons([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await academyService.getLessonsByModule(moduleId, status);
            setLessons(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [moduleId, status]);

    useEffect(() => {
        fetchLessons();
    }, [moduleId, status, fetchLessons]);

    return { lessons, loading, error, refetch: fetchLessons };
};

export const useAcademyAllLessons = (modules: AcademyModule[], status?: 'draft' | 'published' | 'all') => {
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAllLessons = useCallback(async () => {
        if (modules.length === 0) {
            setLessons([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const allLessonsPromises = modules.map(async (module) => {
                if (!module.id) return [];
                try {
                    const data = await academyService.getLessonsByModule(module.id, status);
                    return data;
                } catch (err) {
                    console.error(`Error fetching lessons for module ${module.id}:`, err);
                    return [];
                }
            });

            const allLessonsArrays = await Promise.all(allLessonsPromises);
            const allLessons = allLessonsArrays.flat();
            setLessons(allLessons);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [modules, status]);

    useEffect(() => {
        fetchAllLessons();
    }, [fetchAllLessons]);

    return { lessons, loading, error, refetch: fetchAllLessons };
};

export const useAcademyProgress = (userId: string | null, moduleId: string | null) => {
    const [progress, setProgress] = useState<AcademyProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProgress = useCallback(async (userIdParam?: string, moduleIdParam?: string) => {
        const targetUserId = userIdParam || userId;
        const targetModuleId = moduleIdParam || moduleId;

        if (!targetUserId || !targetModuleId) {
            setProgress(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await academyService.getUserProgress(targetUserId, targetModuleId);
            setProgress(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [userId, moduleId]);

    useEffect(() => {
        fetchProgress();
    }, [userId, moduleId, fetchProgress]);

    return { progress, loading, error, refetch: fetchProgress };
};

export const useMarkLessonComplete = (onProgressUpdate?: (userId: string, moduleId: string) => Promise<void>) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const markComplete = async (userId: string, moduleId: string, lessonId: string) => {
        try {
            setLoading(true);
            setError(null);
            await academyService.markLessonComplete(userId, moduleId, lessonId);
            // Recargar el progreso después de marcar la lección como completada
            if (onProgressUpdate) {
                await onProgressUpdate(userId, moduleId);
            }
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { markComplete, loading, error };
};

export const useUnmarkLessonComplete = (onProgressUpdate?: (userId: string, moduleId: string) => Promise<void>) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const unmarkComplete = async (userId: string, moduleId: string, lessonId: string) => {
        try {
            setLoading(true);
            setError(null);
            await academyService.unmarkLessonComplete(userId, moduleId, lessonId);
            // Recargar el progreso después de desmarcar la lección
            if (onProgressUpdate) {
                await onProgressUpdate(userId, moduleId);
            }
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { unmarkComplete, loading, error };
};

export const useCreateModule = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createModule = async (moduleData: Omit<AcademyModule, 'id'>): Promise<AcademyModule | null> => {
        try {
            setLoading(true);
            setError(null);
            const id = await academyService.createModule(moduleData);
            const module = await academyService.getModuleById(id);
            return module;
        } catch (err) {
            console.error('[useCreateModule] Error:', err);
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { createModule, loading, error };
};

export const useUpdateModule = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const updateModule = async (moduleId: string, moduleData: Partial<AcademyModule>): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await academyService.updateModule(moduleId, moduleData);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { updateModule, loading, error };
};

export const useDeleteModule = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteModule = async (moduleId: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await academyService.deleteModule(moduleId);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { deleteModule, loading, error };
};

export const useCreateLesson = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createLesson = async (lessonData: Omit<AcademyLesson, 'id'>): Promise<AcademyLesson | null> => {
        try {
            setLoading(true);
            setError(null);
            const id = await academyService.createLesson(lessonData);
            const lesson = { id, ...lessonData };
            return lesson;
        } catch (err) {
            console.error('[useCreateLesson] Error:', err);
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { createLesson, loading, error };
};

export const useUpdateLesson = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const updateLesson = async (lessonId: string, lessonData: Partial<AcademyLesson>): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await academyService.updateLesson(lessonId, lessonData);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { updateLesson, loading, error };
};

export const useDeleteLesson = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteLesson = async (lessonId: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await academyService.deleteLesson(lessonId);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { deleteLesson, loading, error };
};
