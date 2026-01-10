import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    where
} from 'firebase/firestore';
import { academyService } from '../services/academyService';

// Import Types from service or define here if not exported

export interface AcademyModule {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    order: number;
    lessonCount?: number;
    published?: boolean;
    createdAt?: any;
    updatedAt?: any;
}

export interface Lesson {
    id: string;
    moduleId: string;
    title: string;
    content: string;
    order: number;
    resources?: { title: string; url: string }[];
}

export interface Question {
    type: 'single-choice' | 'multi-select' | 'true-false';
    question: string;
    options: string[];
    correctAnswer?: number | boolean;
    correctAnswers?: number[];
}

export interface Quiz {
    id: string;
    moduleId: string;
    questions: Question[];
    passingScore?: number;
}

// Ideally we should import from academyService.ts

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
    const [modules, setModules] = useState<any[]>([]); // TODO: Define Module Type
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
            }));
            setModules(modulesData);
            setLoading(false);
        }, () => {
            // console.warn("Error fetching courses:", error);
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
    return useCallback(async (moduleData: any) => {
        return await academyService.saveCourse(moduleData);
    }, []);
};

/**
 * Hook para actualizar un módulo
 */
export const useUpdateModule = () => {
    return useCallback(async (moduleId: string, updates: any) => {
        return await academyService.saveCourse({ id: moduleId, ...updates });
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
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!moduleId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, COLLECTIONS.LESSONS),
            where('moduleId', '==', moduleId),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lessonsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLessons(lessonsData);
            setLoading(false);
        }, () => {
            // console.warn("Error fetching lessons:", error);
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
    return useCallback(async (lessonData: any) => {
        // WARN: I need to update this to use the defined COLLECTIONS.
        return await academyService.saveLesson(lessonData);
    }, []);
};

/**
 * Hook para actualizar una lección
 */
export const useUpdateLesson = () => {
    return useCallback(async (lessonId: string, updates: any) => {
        return await academyService.saveLesson({ id: lessonId, ...updates });
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

/**
 * Hook para obtener el progreso del usuario
 */
export const useAcademyProgress = (userId: string | null) => {
    const [progress, setProgress] = useState<Record<string, any>>({});
    const [totalProgress, setTotalProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, COLLECTIONS.PROGRESS),
            where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const progressData: Record<string, any> = {};
            let completedModules = 0;
            let totalModules = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                progressData[data.moduleId] = {
                    ...data,
                    id: doc.id
                };
                if (data.completed) completedModules++;
                totalModules++;
            });

            setProgress(progressData);
            setTotalProgress(totalModules > 0 ? (completedModules / totalModules) * 100 : 0);
            setLoading(false);
        }, () => {
            // console.warn("Error fetching academy progress:", error);
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
    return useCallback(async (userId: string, moduleId: string, progressData: any) => {
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
    const [quiz, setQuiz] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        if (!moduleId) { setLoading(false); return; }
        const q = query(collection(db, COLLECTIONS.QUIZZES), where('moduleId', '==', moduleId));
        const unsub = onSnapshot(q, snap => {
            if (!snap.empty) setQuiz({ id: snap.docs[0].id, ...snap.docs[0].data() });
            else setQuiz(null);
            setLoading(false);
        });
        return () => unsub();
    }, [moduleId]);
    return { quiz, loading };
};

export const useSaveQuiz = () => {
    return useCallback(async (moduleId: string, quizData: any) => {
        return await academyService.saveQuiz(moduleId, quizData);
    }, []);
};

export const useDeleteQuiz = () => {
    return useCallback(async (quizId: string) => {
        return await academyService.deleteQuiz(quizId);
    }, []);
};

export const useSaveQuizResult = () => {
    return useCallback(async (userId: string, moduleId: string, score: number, answers: any) => {
        return await academyService.saveQuizResult(userId, moduleId, score, answers);
    }, []);
};
