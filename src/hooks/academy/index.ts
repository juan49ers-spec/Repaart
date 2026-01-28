import { useState, useEffect } from 'react';
import { academyService, AcademyModule, AcademyLesson, AcademyProgress } from '../../services/academyService';

export const useAcademyModules = () => {
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                setLoading(true);
                const data = await academyService.getAllModules();
                setModules(data);
                setError(null);
            } catch (err) {
                setError(err as Error);
                console.error('Error fetching modules:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchModules();
    }, []);

    return { modules, loading, error };
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
                setError(null);
            } catch (err) {
                setError(err as Error);
                console.error('Error fetching module:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchModule();
    }, [moduleId]);

    return { module, loading, error };
};

export const useAcademyLessons = (moduleId: string | null) => {
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!moduleId) {
            setLessons([]);
            setLoading(false);
            return;
        }

        const fetchLessons = async () => {
            try {
                setLoading(true);
                const data = await academyService.getLessonsByModule(moduleId);
                setLessons(data);
                setError(null);
            } catch (err) {
                setError(err as Error);
                console.error('Error fetching lessons:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, [moduleId]);

    return { lessons, loading, error };
};

export const useAcademyProgress = (userId: string | null, moduleId: string | null) => {
    const [progress, setProgress] = useState<AcademyProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !moduleId) {
            setProgress(null);
            setLoading(false);
            return;
        }

        const fetchProgress = async () => {
            try {
                setLoading(true);
                const data = await academyService.getUserProgress(userId, moduleId);
                setProgress(data);
            } catch (err) {
                console.error('Error fetching progress:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [userId, moduleId]);

    return { progress, loading };
};

export const useCreateModule = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createModule = async (moduleData: Omit<AcademyModule, 'id'>): Promise<AcademyModule | null> => {
        try {
            setLoading(true);
            setError(null);
            const id = await academyService.createModule(moduleData);
            return { id, ...moduleData };
        } catch (err) {
            setError(err as Error);
            throw err;
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
            return { id, ...lessonData };
        } catch (err) {
            setError(err as Error);
            throw err;
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

export const useMarkLessonComplete = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const markComplete = async (userId: string, moduleId: string, lessonId: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await academyService.markLessonComplete(userId, moduleId, lessonId);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { markComplete, loading, error };
};
