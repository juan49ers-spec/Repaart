import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    where
} from 'firebase/firestore';
import { academyService, AcademyCourse, Lesson, Quiz, UserProgress, QuizQuestion } from '../services/academyService';

// Re-export or Alias for UI consistency if needed
export type AcademyModule = AcademyCourse & { lessonCount?: number };
export type { Lesson, Quiz, QuizQuestion as Question };


// COLLECTION NAMES CONSTANTS (Aligned with Master Schema)
const COLLECTIONS = {
    COURSES: 'academy_courses',
    LESSONS: 'academy_lessons',
    QUIZZES: 'academy_quizzes',
    PROGRESS: 'academy_progress',
    RESULTS: 'quiz_results'
};

/**
 * Hook para obtener todos los cursos (modules renamed to courses in UI context)
 */
export const useAcademyModules = () => {
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const q = query(
            collection(db, COLLECTIONS.COURSES),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const modulesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AcademyModule));
            setModules(modulesData);
            setLoading(false);
        }, () => {
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { modules, loading };
};

/**
 * Hook para crear un nuevo módulo (Curso)
 */
export const useCreateModule = () => {
    return useCallback(async (moduleData: AcademyModule) => {
        return await academyService.saveCourse(moduleData as unknown as AcademyCourse);
    }, []);
};

/**
 * Hook para actualizar un módulo
 */
export const useUpdateModule = () => {
    return useCallback(async (moduleId: string, updates: Partial<AcademyModule>) => {
        return await academyService.saveCourse({ id: moduleId, ...updates } as unknown as AcademyCourse);
    }, []);
};

/**
 * Hook para eliminar un módulo
 */
export const useDeleteModule = () => {
    return useCallback(async (moduleId: string) => {
        return await academyService.deleteCourse(moduleId);
    }, []);
};

/**
 * Hook para obtener las lecciones de un módulo
 */
export const useModuleLessons = (moduleId: string | null) => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState<boolean>(!!moduleId);

    // Sync loading state during render
    const [prevModuleId, setPrevModuleId] = useState(moduleId);
    if (moduleId !== prevModuleId) {
        setPrevModuleId(moduleId);
        setLoading(!!moduleId);
    }

    useEffect(() => {
        if (!moduleId) return;

        const q = query(
            collection(db, COLLECTIONS.LESSONS),
            where('moduleId', '==', moduleId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lessonsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Lesson));

            // Client-side sort to avoid composite index requirement
            lessonsData.sort((a, b) => a.order - b.order);

            setLessons(lessonsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching module lessons:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [moduleId]);

    return { lessons, loading };
};

/**
 * Hook para crear una nueva lección
 */
export const useCreateLesson = () => {
    return useCallback(async (lessonData: Omit<Lesson, 'id'> & { id?: string }) => {
        return await academyService.saveLesson(lessonData as unknown as any);
    }, []);
};

/**
 * Hook para actualizar una lección
 */
export const useUpdateLesson = () => {
    return useCallback(async (lessonId: string, updates: Partial<Lesson>) => {
        return await academyService.saveLesson({ id: lessonId, ...updates } as unknown as any);
    }, []);
};

/**
 * Hook para eliminar una lección
 */
export const useDeleteLesson = () => {
    return useCallback(async (lessonId: string) => {
        return await academyService.deleteLesson(lessonId);
    }, []);
};

export interface ExtendedUserProgress extends UserProgress {
    progress: number;
    score?: number;
    completed: boolean;
}

/**
 * Hook para obtener el progreso del usuario
 */
export const useAcademyProgress = (userId: string | null) => {
    const [progress, setProgress] = useState<Record<string, ExtendedUserProgress>>({});
    const [totalProgress, setTotalProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    // Sync loading during render
    if (!userId && loading) {
        setLoading(false);
    }

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(db, COLLECTIONS.PROGRESS),
            where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const progressData: Record<string, ExtendedUserProgress> = {};
            let completedModules = 0;
            let totalModules = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data() as UserProgress;
                if (data.moduleId) {
                    // Calculate basic progress if lesson count not available directly, 
                    // we might need to update this logic later or fetch modules. 
                    // For now, let's map what we have.
                    // The UI expects 'progress' as a number (0-100).
                    // We can default to 100 if completed, else 0 or partial if we knew totals.
                    // Let's assume data has a 'progress' field or we calculate it? 
                    // The service schema doesn't have 'progress' number.
                    // We will map fields to satisfy UI.

                    progressData[data.moduleId] = {
                        ...data,
                        id: doc.id,
                        score: data.quizScore,
                        completed: data.status === 'completed',
                        progress: data.status === 'completed' ? 100 : ((data.completedLessons?.length || 0) * 10) // Mocking 10% per lesson if count unknown
                    } as ExtendedUserProgress;
                    if (data.status === 'completed') completedModules++;
                    totalModules++;
                }
            });

            setProgress(progressData);
            setTotalProgress(totalModules > 0 ? (completedModules / totalModules) * 100 : 0);
            setLoading(false);
        }, (error) => {
            console.warn("Error fetching academy progress:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { progress, totalProgress, loading };
};

/**
 * Hook para actualizar progreso
 */
export const useUpdateProgress = () => {
    return useCallback(async (userId: string, moduleId: string, progressData: Partial<UserProgress>) => {
        return await academyService.updateProgress(userId, moduleId, progressData);
    }, []);
};

/**
 * Hook para marcar lección completa
 */
export const useMarkLessonComplete = () => {
    return useCallback(async (userId: string, moduleId: string, lessonId: string) => {
        return await academyService.markLessonComplete(userId, moduleId, lessonId);
    }, []);
};

// ... Quizzes hooks
export const useModuleQuiz = (moduleId: string | null) => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState<boolean>(!!moduleId);
    const [prevModuleId, setPrevModuleId] = useState(moduleId);

    if (moduleId !== prevModuleId) {
        setPrevModuleId(moduleId);
        setLoading(!!moduleId);
        setQuiz(null);
    }

    useEffect(() => {
        if (!moduleId) return;

        const q = query(collection(db, COLLECTIONS.QUIZZES), where('moduleId', '==', moduleId));
        const unsub = onSnapshot(q, snap => {
            if (!snap.empty) setQuiz({ id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as Quiz);
            else setQuiz(null);
            setLoading(false);
        }, (error) => {
            console.warn("Error fetching quiz:", error);
            setLoading(false);
        });
        return () => unsub();
    }, [moduleId]);

    return { quiz, loading };
};

export const useSaveQuiz = () => {
    return useCallback(async (moduleId: string, quizData: Partial<Quiz>) => {
        return await academyService.saveQuiz(moduleId, quizData as any);
    }, []);
};

export const useSaveQuizResult = () => {
    return useCallback(async (userId: string, moduleId: string, score: number, answers: Record<string, unknown>) => {
        return await academyService.saveQuizResult(userId, moduleId, score, answers);
    }, []);
};

export const useDeleteQuiz = () => {
    return useCallback(async (quizId: string) => {
        return await academyService.deleteQuiz(quizId);
    }, []);
};
