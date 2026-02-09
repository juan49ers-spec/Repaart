import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ResourcesPanel from '../ResourcesPanel';

// Mock AuthContext
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { uid: 'test-user-id', role: 'franchise' },
        forceTokenRefresh: vi.fn(),
    })
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
    const icons = {
        FileText: null, Image: null, File: null, Grid: null, List: null, Search: null, Eye: null, Download: null,
        Folder: null, FolderOpen: null, Shield: null, Briefcase: null, BookOpen: null, Layout: null, Loader2: null,
        ShieldAlert: null, Wrench: null, Users: null, PlayCircle: null, Zap: null, Heart: null, Star: null,
        Award: null, Info: null, AlertTriangle: null, CheckCircle: null, HelpCircle: null, Lightbulb: null,
        Target: null, Plus: null, Trash2: null, Pin: null, RefreshCw: null, Check: null, X: null,
    };
    const mockIcons: any = {
        Image: (props: any) => <div data-testid="image-icon" {...props} />,
        List: (props: any) => <div data-testid="list-icon" {...props} />,
        Trash2: (props: any) => <div data-testid="trash-icon" {...props} />,
    };
    Object.keys(icons).forEach(key => {
        if (!mockIcons[key]) {
            mockIcons[key] = (props: any) => <div data-testid={`${key.toLowerCase()}-icon`} {...props} />;
        }
    });
    return mockIcons;
});

const mockResources = [
    {
        id: 'res-1',
        title: 'Manual de Usuario',
        name: 'manual.pdf',
        category: 'manuals',
        type: 'application/pdf',
        size: 1024 * 1024,
        url: 'https://example.com/manual.pdf',
        createdAt: { toMillis: () => Date.now() }
    },
    {
        id: 'res-2',
        title: 'Contrato Franquicia',
        name: 'contrato.pdf',
        category: 'contracts',
        type: 'application/pdf',
        size: 2 * 1024 * 1024,
        url: 'https://example.com/contrato.pdf',
        createdAt: { toMillis: () => Date.now() - 10000 }
    }
];

const mockGuides = [
    {
        id: 'guide-1',
        title: 'Guía de Inicio Rápido',
        description: 'Aprende a usar la plataforma en 5 minutos',
        category: 'manuals',
        theme: 'indigo',
        icon: 'BookOpen',
        isGuide: true,
        type: 'guide',
        createdAt: { toMillis: () => Date.now() - 5000 }
    }
];

// Mock Firebase
vi.mock('../../../lib/firebase', () => ({
    db: {},
    storage: {},
    auth: {}
}));

let franchiseOnSnapshotCallback: any = null;
let franchiseOnGuidesSnapshotCallback: any = null;

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    initializeFirestore: vi.fn(() => ({})),
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
    collection: vi.fn((_db, name) => ({ _name: name })),
    query: vi.fn((coll) => coll),
    orderBy: vi.fn((coll) => coll),
    onSnapshot: vi.fn((q, callback) => {
        if (q && q._name === 'guides') {
            franchiseOnGuidesSnapshotCallback = callback;
        } else {
            franchiseOnSnapshotCallback = callback;
        }
        return vi.fn(); // Unsubscribe
    }),
    Timestamp: {
        now: () => ({ toMillis: () => Date.now() })
    },
    doc: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
    ref: vi.fn(),
    uploadBytesResumable: vi.fn(() => ({
        on: vi.fn((_state, _progress, _error, complete) => {
            complete();
        }),
        snapshot: { ref: {} }
    })),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
    deleteObject: vi.fn(() => Promise.resolve()),
}));

// Mock window.URL
window.URL.createObjectURL = vi.fn(() => 'blob:url');
window.URL.revokeObjectURL = vi.fn();

// Mock components
vi.mock('../../../components/ui/overlays/DocPreviewModal', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="doc-preview-modal"><button onClick={onClose}>Close</button></div> : null
}));
vi.mock('../components/GuideViewerModal', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="guide-viewer-modal"><button onClick={onClose}>Close</button></div> : null
}));
vi.mock('../components/DocumentRequestModal', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="doc-request-modal"><button onClick={onClose}>Close</button></div> : null
}));
vi.mock('../../common/UserManual/UserManual', () => ({
    default: () => <div data-testid="user-manual" />
}));

describe('ResourcesPanel Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        franchiseOnSnapshotCallback = null;
        franchiseOnGuidesSnapshotCallback = null;
        global.fetch = vi.fn(() =>
            Promise.resolve({
                blob: () => Promise.resolve(new Blob(['test'], { type: 'application/pdf' }))
            })
        ) as any;
    });

    const triggerSnapshots = () => {
        act(() => {
            if (franchiseOnSnapshotCallback) {
                franchiseOnSnapshotCallback({
                    docs: mockResources.map((r: any) => ({
                        id: r.id,
                        data: () => {
                            const { id: _id, ...data } = r;
                            return data;
                        }
                    }))
                });
            }
            if (franchiseOnGuidesSnapshotCallback) {
                franchiseOnGuidesSnapshotCallback({
                    docs: mockGuides.map((g: any) => ({
                        id: g.id,
                        data: () => {
                            const { id: _id, ...data } = g;
                            return data;
                        }
                    }))
                });
            }
        });
    };

    it('should render loading state initially', () => {
        render(<ResourcesPanel />);
        expect(screen.getByRole('main').querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render resources and guides after loading', async () => {
        render(<ResourcesPanel />);

        await waitFor(() => expect(franchiseOnSnapshotCallback).toBeTruthy());
        await waitFor(() => expect(franchiseOnGuidesSnapshotCallback).toBeTruthy());

        triggerSnapshots();

        await waitFor(() => {
            expect(screen.getByText(/Manual de Usuario/i)).toBeInTheDocument();
            expect(screen.getByText(/Guía de Inicio Rápido/i)).toBeInTheDocument();
        });
    });

    it('should filter by folder/category', async () => {
        render(<ResourcesPanel />);

        await waitFor(() => expect(franchiseOnSnapshotCallback).toBeTruthy());
        triggerSnapshots();

        await waitFor(() => expect(screen.getByText(/Manual de Usuario/i)).toBeInTheDocument());
        expect(screen.getByText(/Guía de Inicio Rápido/i)).toBeInTheDocument();
        expect(screen.queryByText(/Contrato Franquicia/i)).not.toBeInTheDocument();

        // Switch to Contracts
        const contractsButton = screen.getAllByText(/Marco Legal & Contratos/i)[0];
        fireEvent.click(contractsButton);

        await waitFor(() => {
            expect(screen.getByText(/Contrato Franquicia/i)).toBeInTheDocument();
            expect(screen.queryByText(/Manual de Usuario/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Guía de Inicio Rápido/i)).not.toBeInTheDocument();
        });
    });

    it('should search resources', async () => {
        render(<ResourcesPanel />);

        await waitFor(() => expect(franchiseOnSnapshotCallback).toBeTruthy());
        triggerSnapshots();

        const searchInput = screen.getByPlaceholderText(/Buscar\.\.\./i);
        fireEvent.change(searchInput, { target: { value: 'Guía' } });

        await waitFor(() => {
            expect(screen.getByText(/Guía de Inicio Rápido/i)).toBeInTheDocument();
            expect(screen.queryByText(/Manual de Usuario/i)).not.toBeInTheDocument();
        });
    });

    it('should toggle between grid and list view', async () => {
        render(<ResourcesPanel />);

        await waitFor(() => expect(franchiseOnSnapshotCallback).toBeTruthy());
        triggerSnapshots();

        // Toggle to List View
        const listButton = screen.getByTitle(/Vista Lista/i);
        fireEvent.click(listButton);

        await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
        expect(screen.getByText(/^Documento$/i)).toBeInTheDocument();

        // Toggle back to Grid View
        const gridButton = screen.getByTitle(/Vista Cuadrícula/i);
        fireEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.queryByRole('table')).not.toBeInTheDocument();
            expect(screen.getByText(/Manual de Usuario/i)).toBeInTheDocument();
        });
    });

    it('should open preview modal when clicking a resource', async () => {
        render(<ResourcesPanel />);

        await waitFor(() => expect(franchiseOnSnapshotCallback).toBeTruthy());
        triggerSnapshots();

        fireEvent.click(screen.getByText(/Manual de Usuario/i));
        expect(screen.getByTestId('doc-preview-modal')).toBeInTheDocument();
    });

    it('should open guide viewer when clicking a guide', async () => {
        render(<ResourcesPanel />);

        await waitFor(() => expect(franchiseOnGuidesSnapshotCallback).toBeTruthy());
        triggerSnapshots();

        fireEvent.click(screen.getByText(/Guía de Inicio Rápido/i));
        expect(screen.getByTestId('guide-viewer-modal')).toBeInTheDocument();
    });

    it('should open request modal', () => {
        render(<ResourcesPanel />);
        fireEvent.click(screen.getByText(/Solicitar Documento/i));
        expect(screen.getByTestId('doc-request-modal')).toBeInTheDocument();
    });

    it('should handle file download', async () => {
        render(<ResourcesPanel />);

        await waitFor(() => expect(franchiseOnSnapshotCallback).toBeTruthy());
        triggerSnapshots();

        const downloadButton = screen.getAllByText(/Descargar/i)[0];
        fireEvent.click(downloadButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('https://example.com/manual.pdf');
        });
    });
});
