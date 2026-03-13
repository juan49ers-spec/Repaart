import { describe, it, expect, vi } from 'vitest';
import { adaptToResourceItem } from './resource.adapters';
import { Timestamp } from 'firebase/firestore';

vi.mock('lucide-react', () => ({
    ShieldCheck: () => null,
    BookOpen: () => null,
    Briefcase: () => null,
    Layout: () => null,
    Folder: () => null,
}));

describe('Resource Adapters', () => {
    describe('adaptToResourceItem', () => {
        it('should adapt valid data correctly', () => {
            const data = {
                name: 'Valid Document',
                category: 'contracts',
                size: 1024,
                type: 'application/pdf',
                url: 'https://example.com/doc.pdf',
                storagePath: 'resources/contracts/doc.pdf',
                uploadedBy: 'Admin User',
                franchiseId: '12345',
                status: 'active',
                isPinned: true,
                createdAt: Timestamp.fromDate(new Date('2024-01-01'))
            };

            const result = adaptToResourceItem('res1', data);

            expect(result.id).toBe('res1');
            expect(result.name).toBe('Valid Document');
            expect(result.title).toBe('Valid Document');
            expect(result.category).toBe('contracts');
            expect(result.size).toBe(1024);
            expect(result.type).toBe('application/pdf');
            expect(result.url).toBe('https://example.com/doc.pdf');
            expect(result.storagePath).toBe('resources/contracts/doc.pdf');
            expect(result.uploadedBy).toBe('Admin User');
            expect(result.franchiseId).toBe('12345');
            expect(result.status).toBe('active');
            expect(result.isPinned).toBe(true);
            expect(result.createdAt).toBeInstanceOf(Timestamp);
            expect(result.createdAt?.toDate().toISOString()).toBe(new Date('2024-01-01').toISOString());
            expect(result.isMock).toBe(false);
        });

        it('should handle missing data gracefully with defaults', () => {
            const result = adaptToResourceItem('res2', {});

            expect(result.id).toBe('res2');
            expect(result.name).toBe('Documento sin nombre'); // default name
            expect(result.category).toBe('general'); // unknown category falls back to general
            expect(result.size).toBe(0);
            expect(result.type).toBe('application/octet-stream');
            expect(result.url).toBe('');
            expect(result.storagePath).toBe('');
            expect(result.uploadedBy).toBe('Admin');
            expect(result.franchiseId).toBeUndefined();
            expect(result.status).toBe('active');
            expect(result.isPinned).toBe(false);
            expect(result.isMock).toBe(false);
            expect(result.createdAt).toBeInstanceOf(Timestamp);
        });

        it('should resolve title vs name correctly', () => {
            const data1 = { title: 'T1' };
            const result1 = adaptToResourceItem('r1', data1);
            expect(result1.name).toBe('T1');
            expect(result1.title).toBe('T1');

            const data2 = { name: 'N1' };
            const result2 = adaptToResourceItem('r2', data2);
            expect(result2.name).toBe('N1');
            expect(result2.title).toBe('N1');

            const data3 = { title: 'T1', name: 'N1' }; // Title takes precedence
            const result3 = adaptToResourceItem('r3', data3);
            expect(result3.name).toBe('T1');
            expect(result3.title).toBe('T1');
        });

        it('should fallback to general for invalid categories', () => {
            const data = { category: 'non-existent-category' };
            const result = adaptToResourceItem('res3', data);

            expect(result.category).toBe('general');
        });

        it('should ensure status is one of the strictly typed values', () => {
            const result1 = adaptToResourceItem('1', { status: 'invalid_status' });
            expect(result1.status).toBe('active'); // fallback

            const result2 = adaptToResourceItem('2', { status: 'archived' });
            expect(result2.status).toBe('archived'); // valid stays valid
        });
    });
});
