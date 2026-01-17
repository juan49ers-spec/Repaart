import { describe, it, expect, vi, beforeEach } from 'vitest';
import { academyService, SeederModule } from './academyService';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        collection: vi.fn(() => ({ type: 'collection' })),
        query: vi.fn(),
        getDocs: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        setDoc: vi.fn(),
        doc: vi.fn(() => ({ id: 'mock-doc-id' })),
        serverTimestamp: () => 'MOCK_TIMESTAMP',
    };
});

import { getDocs, deleteDoc, setDoc, doc, collection } from 'firebase/firestore';

describe('AcademyService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('seedAcademyContent', () => {
        it('should clear existing content and seed new modules', async () => {
            // Mock existing content to delete
            const mockDocs = [
                { ref: 'ref1', id: 'id1' },
                { ref: 'ref2', id: 'id2' }
            ];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const modulesData: SeederModule[] = [
                {
                    title: 'Test Module',
                    description: 'Desc',
                    duration: '10m',
                    order: 1,
                    lessons: [
                        {
                            title: 'Lesson 1',
                            content: 'Content',
                            order: 1,
                            quiz: {
                                questions: [
                                    { question: 'Q1', options: ['A', 'B'], correctAnswer: 0 }
                                ]
                            }
                        }
                    ]
                }
            ];

            await academyService.seedAcademyContent(modulesData);

            // Verification
            // 1. Should fetch existing collections (5 calls)
            expect(getDocs).toHaveBeenCalledTimes(5);

            // 2. Should delete existing docs (5 collections * 2 docs each = 10 calls)
            expect(deleteDoc).toHaveBeenCalledTimes(10);

            // 3. Should create new content
            // Course creation
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    title: 'Test Module',
                    lessonCount: 1
                })
            );

            // Lesson creation
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    title: 'Lesson 1',
                    moduleId: 'mock-doc-id'
                })
            );

            // Quiz creation
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    passingScore: 70,
                    questions: expect.arrayContaining([
                        expect.objectContaining({ text: '[Lesson 1] Q1' })
                    ])
                })
            );
        });
    });
});
