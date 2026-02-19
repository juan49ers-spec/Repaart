import { db, storage } from '../lib/firebase';
import {
    collection, getDocs, getDoc, query, where, addDoc, doc, updateDoc,
    serverTimestamp, deleteDoc, Timestamp, FieldValue, orderBy, limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ServiceError } from '../utils/ServiceError';

const COLLECTIONS = {
    MODULES: 'academy_modules',
    LESSONS: 'academy_lessons',
    PROGRESS: 'academy_progress'
};

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

export interface AcademyLesson {
    id?: string;
    module_id: string;
    title: string;
    content: string;
    content_type: 'text' | 'video';
    video_url?: string;
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
                } catch (indexError) {
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
            let modules = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AcademyModule));

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
                } catch (indexError) {
                    console.warn("[academyService] Índice compuesto no encontrado, usando filtro client-side", indexError);
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
            let lessons = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AcademyLesson));

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

    uploadLessonVideo: async (file: File): Promise<string> => {
        try {
            const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const fileRef = ref(storage, `academy/videos/${filename}`);
            const snapshot = await uploadBytes(fileRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            throw new ServiceError('uploadLessonVideo', { cause: error });
        }
    }
};
