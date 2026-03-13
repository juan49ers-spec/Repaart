import { describe, it, expect, vi } from 'vitest';
import { formatBytes, getFileIcon } from './resource.formatters';
import { isValidElement } from 'react';

vi.mock('lucide-react', () => ({
    FileText: () => null,
    Image: () => null,
    Folder: () => null,
    File: () => null,
}));

describe('Resource Formatters', () => {
    describe('formatBytes', () => {
        it('debe formatear undefined/0 como 0 B', () => {
            expect(formatBytes(0)).toBe('0 B');
            expect(formatBytes(undefined)).toBe('0 B');
        });

        it('debe formatear bytes correctamente', () => {
            expect(formatBytes(500)).toBe('500 B');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1536)).toBe('1.5 KB');
            expect(formatBytes(1048576)).toBe('1 MB');
            expect(formatBytes(1073741824)).toBe('1 GB');
        });
    });

    describe('getFileIcon', () => {
        it('debe devolver un elemento React válido', () => {
            const icon = getFileIcon('application/pdf');
            expect(isValidElement(icon)).toBe(true);
        });
    });
});
