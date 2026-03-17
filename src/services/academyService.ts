import { db, storage } from '../lib/firebase';
import {
    collection, getDocs, getDoc, query, where, addDoc, doc, updateDoc,
    serverTimestamp, deleteDoc, Timestamp, FieldValue, orderBy, limit,
    writeBatch, arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ServiceError } from '../utils/ServiceError';

const COLLECTIONS = {
    MODULES: 'academy_modules',
    LESSONS: 'academy_lessons',
    PROGRESS: 'academy_progress',
    QUIZ_RESULTS: 'academy_quiz_results',
    PROFILES: 'academy_profiles'
};

export interface AcademyProfile {
    user_id: string;
    total_xp: number;
    current_level: string;
    awarded_lessons: string[];
    updated_at?: Timestamp | FieldValue;
}

export interface AcademyModule {
    id?: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    order: number;
    status: 'draft' | 'active';
    created_at?: Timestamp | FieldValue;
    updated_at?: Timestamp | FieldValue;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
}

export interface AcademyLesson {
    id?: string;
    module_id: string;
    title: string;
    content: string;
    content_type: 'text' | 'video' | 'quiz';
    video_url?: string;
    quiz?: QuizQuestion[];
    duration: number;
    order: number;
    status: 'draft' | 'published';
    created_at?: Timestamp | FieldValue;
    updated_at?: Timestamp | FieldValue;
}

export interface AcademyProgress {
    id?: string;
    user_id: string;
    module_id: string;
    completed_lessons: string[];
    status: 'not_started' | 'in_progress' | 'completed';
    completed_at?: Timestamp | FieldValue;
    created_at?: Timestamp | FieldValue;
    updated_at?: Timestamp | FieldValue;
}

export interface QuizResult {
    id?: string;
    user_id: string;
    module_id: string;
    lesson_id: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    passed: boolean;
    answers: { question_id: string; selected_index: number; correct: boolean }[];
    completed_at?: Timestamp | FieldValue;
}

export const academyService = {
    getAllModules: async (status?: 'draft' | 'active' | 'all'): Promise<AcademyModule[]> => {
        try {
            let q;
            if (status && status !== 'all') {
                try {
                    q = query(
                        collection(db, COLLECTIONS.MODULES),
                        where('status', '==', status),
                        orderBy('order', 'asc')
                    );
                } catch {
                    console.warn("[academyService] Índice compuesto no encontrado, usando filtro client-side");
                    q = query(
                        collection(db, COLLECTIONS.MODULES),
                        orderBy('order', 'asc')
                    );
                }
            } else {
                q = query(
                    collection(db, COLLECTIONS.MODULES),
                    orderBy('order', 'asc')
                );
            }
            const snapshot = await getDocs(q);
            let modules = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) } as AcademyModule));

            // Filtro client-side si es necesario
            if (status && status !== 'all') {
                modules = modules.filter(m => m.status === status);
            }

            return modules;
        } catch (error) {
            throw new ServiceError('getAllModules', { cause: error });
        }
    },

    getModuleById: async (moduleId: string): Promise<AcademyModule | null> => {
        try {
            const docRef = doc(db, COLLECTIONS.MODULES, moduleId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as AcademyModule;
            }
            return null;
        } catch (error) {
            throw new ServiceError('getModuleById', { cause: error });
        }
    },

    createModule: async (moduleData: Omit<AcademyModule, 'id'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.MODULES), {
                ...moduleData,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            throw new ServiceError('createModule', { cause: error });
        }
    },

    updateModule: async (moduleId: string, moduleData: Partial<AcademyModule>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.MODULES, moduleId);
            await updateDoc(docRef, {
                ...moduleData,
                updated_at: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('updateModule', { cause: error });
        }
    },

    deleteModule: async (moduleId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTIONS.MODULES, moduleId));
        } catch (error) {
            throw new ServiceError('deleteModule', { cause: error });
        }
    },

    updateModulesOrder: async (moduleUpdates: { id: string, order: number }[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            moduleUpdates.forEach(({ id, order }) => {
                const docRef = doc(db, COLLECTIONS.MODULES, id);
                batch.update(docRef, { order, updated_at: serverTimestamp() });
            });
            await batch.commit();
        } catch (error) {
            throw new ServiceError('updateModulesOrder', { cause: error });
        }
    },

    getLessonsByModule: async (moduleId: string, status?: 'draft' | 'published' | 'all'): Promise<AcademyLesson[]> => {
        try {
            let q;
            if (status && status !== 'all') {
                try {
                    q = query(
                        collection(db, COLLECTIONS.LESSONS),
                        where('module_id', '==', moduleId),
                        where('status', '==', status),
                        orderBy('order', 'asc')
                    );
                } catch {
                    console.warn("[academyService] Índice compuesto no encontrado, usando filtro client-side");
                    q = query(
                        collection(db, COLLECTIONS.LESSONS),
                        where('module_id', '==', moduleId),
                        orderBy('order', 'asc')
                    );
                }
            } else {
                q = query(
                    collection(db, COLLECTIONS.LESSONS),
                    where('module_id', '==', moduleId),
                    orderBy('order', 'asc')
                );
            }
            const snapshot = await getDocs(q);
            let lessons = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) } as AcademyLesson));

            if (status && status !== 'all') {
                lessons = lessons.filter(l => l.status === status);
            }

            return lessons;
        } catch (error) {
            throw new ServiceError('getLessonsByModule', { cause: error });
        }
    },

    createLesson: async (lessonData: Omit<AcademyLesson, 'id'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.LESSONS), {
                ...lessonData,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            throw new ServiceError('createLesson', { cause: error });
        }
    },

    updateLesson: async (lessonId: string, lessonData: Partial<AcademyLesson>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.LESSONS, lessonId);
            await updateDoc(docRef, {
                ...lessonData,
                updated_at: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('updateLesson', { cause: error });
        }
    },

    deleteLesson: async (lessonId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTIONS.LESSONS, lessonId));
        } catch (error) {
            throw new ServiceError('deleteLesson', { cause: error });
        }
    },

    updateLessonsOrder: async (lessonUpdates: { id: string, order: number }[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            lessonUpdates.forEach(({ id, order }) => {
                const docRef = doc(db, COLLECTIONS.LESSONS, id);
                batch.update(docRef, { order, updated_at: serverTimestamp() });
            });
            await batch.commit();
        } catch (error) {
            throw new ServiceError('updateLessonsOrder', { cause: error });
        }
    },

    getUserProgress: async (userId: string, moduleId: string): Promise<AcademyProgress | null> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.PROGRESS),
                where('user_id', '==', userId),
                where('module_id', '==', moduleId),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AcademyProgress;
            }
            return null;
        } catch (error) {
            throw new ServiceError('getUserProgress', { cause: error });
        }
    },

    createProgress: async (progressData: Omit<AcademyProgress, 'id'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.PROGRESS), {
                ...progressData,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            throw new ServiceError('createProgress', { cause: error });
        }
    },

    updateProgress: async (progressId: string, progressData: Partial<AcademyProgress>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.PROGRESS, progressId);
            await updateDoc(docRef, {
                ...progressData,
                updated_at: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('updateProgress', { cause: error });
        }
    },

    markLessonComplete: async (userId: string, moduleId: string, lessonId: string): Promise<void> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.PROGRESS),
                where('user_id', '==', userId),
                where('module_id', '==', moduleId),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const progressId = snapshot.docs[0].id;
                const progress = snapshot.docs[0].data() as AcademyProgress;
                const completedLessons = progress.completed_lessons || [];

                if (!completedLessons.includes(lessonId)) {
                    await updateDoc(doc(db, COLLECTIONS.PROGRESS, progressId), {
                        completed_lessons: [...completedLessons, lessonId],
                        status: 'in_progress',
                        updated_at: serverTimestamp()
                    });
                }
            } else {
                await addDoc(collection(db, COLLECTIONS.PROGRESS), {
                    user_id: userId,
                    module_id: moduleId,
                    completed_lessons: [lessonId],
                    status: 'in_progress',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
            }
        } catch (error) {
            throw new ServiceError('markLessonComplete', { cause: error });
        }
    },

    unmarkLessonComplete: async (userId: string, moduleId: string, lessonId: string): Promise<void> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.PROGRESS),
                where('user_id', '==', userId),
                where('module_id', '==', moduleId),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const progressId = snapshot.docs[0].id;
                const progress = snapshot.docs[0].data() as AcademyProgress;
                const completedLessons = progress.completed_lessons || [];

                if (completedLessons.includes(lessonId)) {
                    await updateDoc(doc(db, COLLECTIONS.PROGRESS, progressId), {
                        completed_lessons: completedLessons.filter(id => id !== lessonId),
                        status: 'in_progress',
                        updated_at: serverTimestamp()
                    });
                }
            }
        } catch (error) {
            throw new ServiceError('unmarkLessonComplete', { cause: error });
        }
    },

    saveQuizResult: async (userId: string, moduleId: string, lessonId: string, result: Omit<QuizResult, 'id' | 'user_id' | 'module_id' | 'lesson_id' | 'completed_at'>): Promise<void> => {
        try {
            const docId = `${userId}_${moduleId}_${lessonId}`;
            const docRef = doc(db, COLLECTIONS.QUIZ_RESULTS, docId);
            const existing = await getDoc(docRef);

            const data = {
                user_id: userId,
                module_id: moduleId,
                lesson_id: lessonId,
                ...result,
                completed_at: serverTimestamp()
            };

            if (existing.exists()) {
                // Solo sobrescribir si el nuevo score es mejor
                const prev = existing.data() as QuizResult;
                if (result.score > (prev.score ?? 0)) {
                    await updateDoc(docRef, { ...data });
                }
            } else {
                const { setDoc } = await import('firebase/firestore');
                await setDoc(docRef, data);
            }
        } catch (error) {
            throw new ServiceError('saveQuizResult', { cause: error });
        }
    },

    getQuizResult: async (userId: string, moduleId: string, lessonId: string): Promise<QuizResult | null> => {
        try {
            const docId = `${userId}_${moduleId}_${lessonId}`;
            const docRef = doc(db, COLLECTIONS.QUIZ_RESULTS, docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as QuizResult;
            }
            return null;
        } catch (error) {
            throw new ServiceError('getQuizResult', { cause: error });
        }
    },

    uploadLessonVideo: async (file: File): Promise<string> => {
        try {
            const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const fileRef = ref(storage, `academy/videos/${filename}`);
            const snapshot = await uploadBytes(fileRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            throw new ServiceError('uploadLessonVideo', { cause: error });
        }
    },

    getUserAcademyProfile: async (userId: string): Promise<AcademyProfile | null> => {
        try {
            const docRef = doc(db, COLLECTIONS.PROFILES, userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as AcademyProfile;
            }
            return null;
        } catch (error) {
            throw new ServiceError('getUserAcademyProfile', { cause: error });
        }
    },

    awardXpForLesson: async (userId: string, lessonId: string, amount: number): Promise<{ awarded: boolean, xpGained: number, newTotal: number, levelUp: boolean, newLevel: string }> => {
        try {
            const docRef = doc(db, COLLECTIONS.PROFILES, userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const profile = docSnap.data() as AcademyProfile;
                if (profile.awarded_lessons?.includes(lessonId)) {
                    return { awarded: false, xpGained: 0, newTotal: profile.total_xp, levelUp: false, newLevel: profile.current_level };
                }

                const newTotal = (profile.total_xp || 0) + amount;
                const { calculateLevel } = await import('../lib/academyGamification');
                const newLevel = calculateLevel(newTotal).name;
                const levelUp = newLevel !== profile.current_level;

                await updateDoc(docRef, {
                    total_xp: newTotal,
                    current_level: newLevel,
                    awarded_lessons: arrayUnion(lessonId),
                    updated_at: serverTimestamp()
                });

                return { awarded: true, xpGained: amount, newTotal, levelUp, newLevel };
            } else {
                const { calculateLevel } = await import('../lib/academyGamification');
                const newTotal = amount;
                const newLevel = calculateLevel(newTotal).name;
                const { setDoc } = await import('firebase/firestore');
                await setDoc(docRef, {
                    user_id: userId,
                    total_xp: newTotal,
                    current_level: newLevel,
                    awarded_lessons: [lessonId],
                    updated_at: serverTimestamp()
                });

                return { awarded: true, xpGained: amount, newTotal, levelUp: false, newLevel };
            }
        } catch (error) {
            throw new ServiceError('awardXpForLesson', { cause: error });
        }
    }
};
