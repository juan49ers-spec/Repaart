import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ResourceUploadModal from '../ResourceUploadModal';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    UploadCloud: (props: Record<string, unknown>) => <div data-testid="upload-icon" {...props} />,
    X: (props: Record<string, unknown>) => <div data-testid="x-icon" {...props} />,
    FileText: (props: Record<string, unknown>) => <div data-testid="file-icon" {...props} />,
    CheckCircle2: (props: Record<string, unknown>) => <div data-testid="check-icon" {...props} />,
    Loader2: (props: Record<string, unknown>) => <div data-testid="loader-icon" {...props} />,
}));

// Mock Firebase - must include all exports used by the firebase.ts config
vi.mock('firebase/firestore', async () => {
    return {
        getFirestore: vi.fn(),
        initializeFirestore: vi.fn(() => ({})),
        persistentLocalCache: vi.fn(() => ({})),
        persistentMultipleTabManager: vi.fn(() => ({})),
        collection: vi.fn(),
        addDoc: vi.fn(() => Promise.resolve({ id: 'doc-123' })),
        serverTimestamp: vi.fn(),
        doc: vi.fn(),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        onSnapshot: vi.fn()
    };
});

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(),
    ref: vi.fn(),
    uploadBytesResumable: vi.fn(() => ({
        on: vi.fn(),
        snapshot: { ref: {} }
    })),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf'))
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn()
}));

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(() => ({})),
    httpsCallable: vi.fn()
}));

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
    getApps: vi.fn(() => []),
    getApp: vi.fn(() => ({}))
}));

vi.mock('../../../lib/firebase', () => ({
    storage: {},
    db: {}
}));

describe('ResourceUploadModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        defaultCategory: 'general'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Modal Visibility', () => {
        it('should render when isOpen is true', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            expect(screen.getByText('Subir Nuevo Recurso')).toBeInTheDocument();
        });

        it('should NOT render when isOpen is false', () => {
            render(<ResourceUploadModal {...defaultProps} isOpen={false} />);
            expect(screen.queryByText('Subir Nuevo Recurso')).not.toBeInTheDocument();
        });
    });

    describe('Initial State', () => {
        it('should show upload drop zone', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            expect(screen.getByText(/Haz clic para subir/)).toBeInTheDocument();
        });

        it('should show file format hint', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            expect(screen.getByText(/PDF, Imágenes, Word, Excel/)).toBeInTheDocument();
        });

        it('should have upload icon', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            const uploadIcons = screen.getAllByTestId('upload-icon');
            expect(uploadIcons.length).toBeGreaterThanOrEqual(1);
        });

        it('should have close button', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            expect(screen.getByTitle('Cerrar')).toBeInTheDocument();
        });

        it('should have cancel button', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });

        it('should have disabled save button initially', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            const saveButton = screen.getByText('Guardar Archivo').closest('button');
            expect(saveButton).toBeDisabled();
        });
    });

    describe('Close Actions', () => {
        it('should call onClose when X button clicked', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            fireEvent.click(screen.getByTitle('Cerrar'));
            expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        });

        it('should call onClose when Cancel clicked', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            fireEvent.click(screen.getByText('Cancelar'));
            expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('File Selection', () => {
        const mockFile = new File(['test content'], 'test-document.pdf', {
            type: 'application/pdf'
        });

        it('should show file info after selection', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;

            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
        });

        it('should auto-fill title from filename', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;

            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            const titleInput = screen.getByLabelText('Nombre Visible') as HTMLInputElement;
            expect(titleInput.value).toBe('Test document');
        });

        it('should show file size', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;

            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            expect(screen.getByText(/MB/)).toBeInTheDocument();
        });

        it('should show remove file button', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;

            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            expect(screen.getByTitle('Eliminar archivo')).toBeInTheDocument();
        });

        it('should remove file when remove button clicked', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;

            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            expect(screen.getByText('test-document.pdf')).toBeInTheDocument();

            await act(async () => {
                fireEvent.click(screen.getByTitle('Eliminar archivo'));
            });

            expect(screen.queryByText('test-document.pdf')).not.toBeInTheDocument();
        });
    });

    describe('Metadata Fields', () => {
        const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

        it('should show title input after file selection', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            expect(screen.getByLabelText('Nombre Visible')).toBeInTheDocument();
        });

        it('should show category selector', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            expect(screen.getByLabelText('Categoría')).toBeInTheDocument();
        });

        it('should show pin checkbox', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            expect(screen.getByText('Destacar al inicio')).toBeInTheDocument();
        });

        it('should have all category options', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            await act(async () => {
                fireEvent.change(input, { target: { files: [mockFile] } });
            });

            const select = screen.getByLabelText('Categoría');
            expect(select).toContainHTML('Marco Legal & Contratos');
            expect(select).toContainHTML('Manuales Operativos');
            expect(select).toContainHTML('Dossiers Comerciales');
            expect(select).toContainHTML('Activos de Marca');
            expect(select).toContainHTML('Documentación General');
        });

        it('should allow changing category', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            await act(async () => {
                fireEvent.change(fileInput, { target: { files: [mockFile] } });
            });

            const select = screen.getByLabelText('Categoría') as HTMLSelectElement;

            await act(async () => {
                fireEvent.change(select, { target: { value: 'contracts' } });
            });

            expect(select.value).toBe('contracts');
        });
    });

    describe('Save Button State', () => {
        const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

        it('should enable save button when file and title are provided', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            await act(async () => {
                fireEvent.change(fileInput, { target: { files: [mockFile] } });
            });

            // Title is auto-filled, so button should be enabled
            const saveButton = screen.getByText('Guardar Archivo').closest('button');
            expect(saveButton).not.toBeDisabled();
        });

        it('should disable save button when title is cleared', async () => {
            render(<ResourceUploadModal {...defaultProps} />);

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            await act(async () => {
                fireEvent.change(fileInput, { target: { files: [mockFile] } });
            });

            const titleInput = screen.getByLabelText('Nombre Visible');
            await act(async () => {
                fireEvent.change(titleInput, { target: { value: '' } });
            });

            const saveButton = screen.getByText('Guardar Archivo').closest('button');
            expect(saveButton).toBeDisabled();
        });
    });

    describe('Layout and Styling', () => {
        it('should have backdrop blur', () => {
            const { container } = render(<ResourceUploadModal {...defaultProps} />);
            const backdrop = container.firstChild as HTMLElement;
            expect(backdrop).toHaveClass('backdrop-blur-sm');
        });

        it('should use dark theme styling', () => {
            const { container } = render(<ResourceUploadModal {...defaultProps} />);
            const modal = container.querySelector('.bg-slate-900');
            expect(modal).toBeInTheDocument();
        });

        it('should have rounded corners', () => {
            const { container } = render(<ResourceUploadModal {...defaultProps} />);
            const modal = container.querySelector('.rounded-2xl');
            expect(modal).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have labeled title input', () => {
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            render(<ResourceUploadModal {...defaultProps} />);

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            fireEvent.change(fileInput, { target: { files: [mockFile] } });

            expect(screen.getByLabelText('Nombre Visible')).toBeInTheDocument();
        });

        it('should have labeled category select', () => {
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            render(<ResourceUploadModal {...defaultProps} />);

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            fireEvent.change(fileInput, { target: { files: [mockFile] } });

            expect(screen.getByLabelText('Categoría')).toBeInTheDocument();
        });

        it('should have title attribute on close button', () => {
            render(<ResourceUploadModal {...defaultProps} />);
            expect(screen.getByTitle('Cerrar')).toBeInTheDocument();
        });
    });
});

describe('Drag and Drop Behavior', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        defaultCategory: 'general'
    };

    it('should accept drag over event', () => {
        const { container } = render(<ResourceUploadModal {...defaultProps} />);
        const dropZone = container.querySelector('.border-dashed');

        expect(dropZone).toBeInTheDocument();

        fireEvent.dragOver(dropZone!);
        // Should not throw
    });

    it('should accept drop event', () => {
        const { container } = render(<ResourceUploadModal {...defaultProps} />);
        const dropZone = container.querySelector('.border-dashed');

        const mockFile = new File(['test'], 'dropped.pdf', { type: 'application/pdf' });
        const mockDataTransfer = {
            files: [mockFile],
            types: ['Files']
        };

        fireEvent.drop(dropZone!, { dataTransfer: mockDataTransfer });
        // Should not throw
    });
});
