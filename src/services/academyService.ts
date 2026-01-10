import { db } from '../lib/firebase';
import {
    collection, getDocs, query, where, addDoc, doc, updateDoc,
    serverTimestamp, deleteDoc, Timestamp, FieldValue
} from 'firebase/firestore';

const COLLECTIONS = {
    COURSES: 'academy_courses',
    LESSONS: 'academy_lessons',
    QUIZZES: 'academy_quizzes',
    PROGRESS: 'academy_progress',
    RESULTS: 'quiz_results'
};

// --- TYPES ---

export interface AcademyCourse {
    id?: string;
    title: string;
    description: string;
    icon?: string;
    category: string;
    duration?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    status: 'active' | 'draft' | 'archived';
    order?: number;
    created_at?: Timestamp | FieldValue;
    updated_at?: Timestamp | FieldValue;
}

export interface Lesson {
    id?: string;
    moduleId: string; // Links to Course.id
    title: string;
    content: string; // HTML/Markdown
    videoUrl?: string;
    order: number;
    createdAt?: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
}

export interface QuizQuestion {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number; // Index
}

export interface Quiz {
    id?: string;
    moduleId: string;
    questions: QuizQuestion[];
    passingScore: number;
    createdAt?: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
}

export interface UserProgress {
    id?: string;
    userId: string;
    moduleId: string;
    completedLessons?: string[]; // Lesson IDs
    quizScore?: number;
    status: 'not_started' | 'in_progress' | 'completed';
    lastAccessed?: Timestamp | FieldValue;
    createdAt?: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
}

// --- SERVICE ---

export const academyService = {
    // --- COURSES (Admin Managed) ---

    /**
     * Fetch all available courses (Admin/Public)
     */
    getAllCourses: async (): Promise<AcademyCourse[]> => {
        try {
            const q = query(collection(db, COLLECTIONS.COURSES), where('status', '==', 'active'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademyCourse));
        } catch (error) {
            console.error("Error fetching courses:", error);
            throw error;
        }
    },

    /**
     * Create/Update Course (Admin Only)
     */
    saveCourse: async (courseData: AcademyCourse): Promise<string> => {
        try {
            if (courseData.id) {
                const docRef = doc(db, COLLECTIONS.COURSES, courseData.id);
                // Remove id from spread to clean up data
                const { id, ...data } = courseData;
                await updateDoc(docRef, {
                    ...data,
                    updated_at: serverTimestamp()
                });
                return courseData.id;
            } else {
                const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), {
                    ...courseData,
                    status: 'active',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                return docRef.id;
            }
        } catch (error) {
            console.error("Error saving course:", error);
            throw error;
        }
    },

    /**
     * Delete Course (Admin Only)
     */
    deleteCourse: async (courseId: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTIONS.COURSES, courseId));
    },

    // --- LESSONS (New) ---

    saveLesson: async (lessonData: Lesson): Promise<string> => {
        try {
            if (lessonData.id) {
                const docRef = doc(db, COLLECTIONS.LESSONS, lessonData.id);
                const { id, ...data } = lessonData;
                await updateDoc(docRef, {
                    ...data,
                    updatedAt: serverTimestamp()
                });
                return lessonData.id;
            } else {
                const docRef = await addDoc(collection(db, COLLECTIONS.LESSONS), {
                    ...lessonData,
                    createdAt: serverTimestamp()
                });
                return docRef.id;
            }
        } catch (error) {
            console.error("Error saving lesson:", error);
            throw error;
        }
    },

    deleteLesson: async (lessonId: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTIONS.LESSONS, lessonId));
    },

    // --- QUIZZES ---

    saveQuiz: async (moduleId: string, quizData: Partial<Quiz>): Promise<string> => {
        try {
            // Check if quiz exists for module
            const q = query(collection(db, COLLECTIONS.QUIZZES), where('moduleId', '==', moduleId));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const id = snap.docs[0].id;
                await updateDoc(doc(db, COLLECTIONS.QUIZZES, id), { ...quizData, updatedAt: serverTimestamp() });
                return id;
            } else {
                const ref = await addDoc(collection(db, COLLECTIONS.QUIZZES), {
                    moduleId,
                    ...quizData,
                    createdAt: serverTimestamp()
                });
                return ref.id;
            }
        } catch (error) {
            console.error("Error saving quiz:", error);
            throw error;
        }
    },

    deleteQuiz: async (quizId: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTIONS.QUIZZES, quizId));
    },

    saveQuizResult: async (userId: string, moduleId: string, score: number, answers: any): Promise<void> => {
        try {
            await addDoc(collection(db, COLLECTIONS.RESULTS), {
                userId, moduleId, score, answers, completedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error saving result:", error);
            throw error;
        }
    },

    // --- PROGRESS (User/Franchise Scope) ---

    /**
     * Fetch user's progress for all courses
     * @param {string} userId - The user ID to fetch progress for
     */
    getUserProgress: async (userId: string): Promise<Record<string, UserProgress>> => {
        try {
            const q = query(collection(db, COLLECTIONS.PROGRESS), where('userId', '==', userId));
            const snapshot = await getDocs(q);
            // Return map: { courseId: { progress... } }
            const progressMap: Record<string, UserProgress> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Omit<UserProgress, 'id'>;
                // moduleId maps to courseId in this context
                if (data.moduleId) {
                    progressMap[data.moduleId] = { id: doc.id, ...data };
                }
            });
            return progressMap;
        } catch (error) {
            console.error("Error fetching progress:", error);
            throw error;
        }
    },

    /**
     * Update progress for a specific course
     */
    updateProgress: async (userId: string, moduleId: string, progressData: Partial<UserProgress>): Promise<void> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.PROGRESS),
                where('userId', '==', userId),
                where('moduleId', '==', moduleId)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await updateDoc(doc(db, COLLECTIONS.PROGRESS, docId), {
                    ...progressData,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, COLLECTIONS.PROGRESS), {
                    userId,
                    moduleId,
                    ...progressData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error updating progress:", error);
            throw error;
        }
    },

    /**
     * Mark a specific lesson as completed for a user
     */
    markLessonComplete: async (userId: string, moduleId: string, lessonId: string): Promise<void> => {
        try {
            const q = query(
                collection(db, COLLECTIONS.PROGRESS),
                where('userId', '==', userId),
                where('moduleId', '==', moduleId)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                const data = snapshot.docs[0].data() as UserProgress;
                const completedLessons = data.completedLessons || [];

                if (!completedLessons.includes(lessonId)) {
                    await updateDoc(doc(db, COLLECTIONS.PROGRESS, docId), {
                        completedLessons: [...completedLessons, lessonId],
                        updatedAt: serverTimestamp()
                    });
                }
            } else {
                // Create new progress record
                await addDoc(collection(db, COLLECTIONS.PROGRESS), {
                    userId,
                    moduleId,
                    completedLessons: [lessonId],
                    status: 'in_progress',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error marking lesson complete:", error);
            throw error;
        }
    }
};
