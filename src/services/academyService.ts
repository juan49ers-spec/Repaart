import { db } from '../lib/firebase';
import {
    collection, getDocs, query, where, addDoc, doc, updateDoc, setDoc,
    serverTimestamp, deleteDoc, Timestamp, FieldValue, writeBatch
} from 'firebase/firestore';

const COLLECTIONS = {
    COURSES: 'academy_courses',
    LESSONS: 'academy_lessons',
    QUIZZES: 'academy_quizzes',
    PROGRESS: 'academy_progress',
    RESULTS: 'quiz_results',
    ENCYCLOPEDIA_CATEGORIES: 'academy_encyclopedia_categories',
    ENCYCLOPEDIA_ARTICLES: 'academy_encyclopedia_articles'
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
    lessonCount?: number;
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
    resources?: { title: string; url: string; type: 'pdf' | 'link' }[];
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

export interface EncyclopediaCategory {
    id?: string;
    title: string;
    icon: string;
    description: string;
    order?: number;
}

export interface EncyclopediaArticle {
    id?: string;
    categoryId: string;
    title: string;
    content: string;
    order?: number;
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
                // Clean data for update
                const data = { ...courseData };
                delete data.id;

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

    /**
     * Delete All Courses (Batched)
     */
    deleteAllCourses: async (): Promise<void> => {
        const q = query(collection(db, COLLECTIONS.COURSES));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    },

    // --- LESSONS (New) ---

    saveLesson: async (lessonData: Lesson): Promise<string> => {
        try {
            if (lessonData.id) {
                const docRef = doc(db, COLLECTIONS.LESSONS, lessonData.id);
                const data = { ...lessonData };
                delete data.id;

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

    saveQuizResult: async (userId: string, moduleId: string, score: number, answers: Record<string, unknown>): Promise<void> => {
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
    },

    // --- ENCYCLOPEDIA (New) ---

    getEncyclopediaCategories: async (): Promise<EncyclopediaCategory[]> => {
        try {
            const q = query(collection(db, COLLECTIONS.ENCYCLOPEDIA_CATEGORIES));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EncyclopediaCategory));
        } catch (error) {
            console.error("Error fetching encyclopedia categories:", error);
            throw error;
        }
    },

    getEncyclopediaArticles: async (categoryId: string): Promise<EncyclopediaArticle[]> => {
        try {
            const q = query(collection(db, COLLECTIONS.ENCYCLOPEDIA_ARTICLES), where('categoryId', '==', categoryId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EncyclopediaArticle));
        } catch (error) {
            console.error("Error fetching encyclopedia articles:", error);
            throw error;
        }
    },


    // --- SEEDER (Atomic) ---

    seedAcademyContent: async (modulesData: any[], encyclopediaData?: any[]): Promise<void> => {
        // 1. DELETE SEQUENTIALLY (Safer for Client SDK)
        // Using batch here crashes the client listener due to "Unexpected state".
        // We delete individually to be safer.

        const [coursesSnap, lessonsSnap, quizzesSnap, encCatsSnap, encArtsSnap] = await Promise.all([
            getDocs(collection(db, COLLECTIONS.COURSES)),
            getDocs(collection(db, COLLECTIONS.LESSONS)),
            getDocs(collection(db, COLLECTIONS.QUIZZES)),
            getDocs(collection(db, COLLECTIONS.ENCYCLOPEDIA_CATEGORIES)),
            getDocs(collection(db, COLLECTIONS.ENCYCLOPEDIA_ARTICLES))
        ]);

        // Helper for throttling
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. THROTTLED DELETION ( ~100ms per doc)
        for (const d of coursesSnap.docs) { await deleteDoc(d.ref); await delay(50); }
        for (const d of lessonsSnap.docs) { await deleteDoc(d.ref); await delay(50); }
        for (const d of quizzesSnap.docs) { await deleteDoc(d.ref); await delay(50); }
        for (const d of encCatsSnap.docs) { await deleteDoc(d.ref); await delay(50); }
        for (const d of encArtsSnap.docs) { await deleteDoc(d.ref); await delay(50); }

        // Cooldown between phases
        await delay(2000);

        // 2. THROTTLED CREATION
        // We use setDoc individually with delays instead of a batch.

        // --- ACADEMY COURSES ---
        for (const moduleData of modulesData) {
            // New Course Ref
            const courseRef = doc(collection(db, COLLECTIONS.COURSES));
            const courseId = courseRef.id;

            const coursePayload: any = {
                title: moduleData.title,
                description: moduleData.description,
                category: 'General',
                duration: moduleData.duration,
                order: moduleData.order,
                status: 'active',
                level: 'intermediate',
                lessonCount: moduleData.lessons ? moduleData.lessons.length : 0,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            };
            // Write Course
            await setDoc(courseRef, coursePayload);
            await delay(100);

            // Lessons
            if (moduleData.lessons) {
                for (const lessonData of moduleData.lessons) {
                    const lessonRef = doc(collection(db, COLLECTIONS.LESSONS));

                    const lessonPayload: any = {
                        moduleId: courseId,
                        title: lessonData.title,
                        content: lessonData.content,
                        order: lessonData.order,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    };
                    await setDoc(lessonRef, lessonPayload);
                    await delay(50);
                }

                // Aggregate Questions for Module Quiz
                const allModuleQuestions: any[] = [];
                moduleData.lessons.forEach((l: any) => {
                    if (l.quiz && l.quiz.questions) {
                        l.quiz.questions.forEach((q: any) => {
                            allModuleQuestions.push({
                                id: Math.random().toString(36).substr(2, 9),
                                text: `[${l.title}] ${q.question}`,
                                options: q.options,
                                correctAnswer: q.correctAnswer
                            });
                        });
                    }
                });

                if (allModuleQuestions.length > 0) {
                    const quizRef = doc(collection(db, COLLECTIONS.QUIZZES));
                    const quizPayload: any = {
                        moduleId: courseId,
                        questions: allModuleQuestions,
                        passingScore: 70,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    };
                    await setDoc(quizRef, quizPayload);
                    await delay(100);
                }
            }
        }

        // --- ENCYCLOPEDIA ---
        if (encyclopediaData) {
            let catOrder = 1;
            for (const catData of encyclopediaData) {
                const catRef = doc(collection(db, COLLECTIONS.ENCYCLOPEDIA_CATEGORIES));
                const catId = catRef.id;

                await setDoc(catRef, {
                    title: catData.title,
                    description: catData.description,
                    icon: catData.icon,
                    order: catOrder++
                });
                await delay(100);

                if (catData.articles) {
                    let artOrder = 1;
                    for (const artData of catData.articles) {
                        const artRef = doc(collection(db, COLLECTIONS.ENCYCLOPEDIA_ARTICLES));
                        await setDoc(artRef, {
                            categoryId: catId,
                            title: artData.title,
                            content: artData.content,
                            order: artOrder++,
                            updatedAt: serverTimestamp()
                        });
                        await delay(50);
                    }
                }
            }
        }
    }

};
