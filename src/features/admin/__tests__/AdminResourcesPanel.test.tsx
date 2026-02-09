import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AdminResourcesPanel from '../AdminResourcesPanel';

// Mock Auth Context
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        forceTokenRefresh: vi.fn(() => Promise.resolve())
    })
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
    const icons = {
        FileText: null, Image: null, File: null, Grid: null, List: null, Search: null, Trash2: null, Eye: null,
        Download: null, Plus: null, Pin: null, FolderOpen: null, Shield: null, Briefcase: null, BookOpen: null,
        Layout: null, Folder: null, RefreshCw: null, ShieldAlert: null, Wrench: null, Users: null, PlayCircle: null,
        Zap: null, Heart: null, Star: null, Award: null, Info: null, AlertTriangle: null, CheckCircle: null,
        HelpCircle: null, Lightbulb: null, Target: null, Loader2: null, Check: null, ChevronRight: null,
        ChevronLeft: null, X: null, Menu: null, Filter: null, Settings: null, LogOut: null, User: null,
        Bell: null, Calendar: null, Clock: null, MapPin: null, Phone: null, Mail: null, Globe: null,
        ExternalLink: null, Copy: null, Edit: null, Save: null,
    };
    const mockIcons: any = {
        Image: (props: any) => <div data-testid="image-icon" {...props} />,
        List: (props: any) => <div data-testid="list-icon" {...props} />,
        Trash2: (props: any) => <div data-testid="trash-icon" {...props} />, // Map Trash2 to trash-icon for test
    };
    Object.keys(icons).forEach(key => {
        if (!mockIcons[key]) {
            mockIcons[key] = (props: any) => <div data-testid={`${key.toLowerCase()}-icon`} {...props} />;
        }
    });
    return mockIcons;
});

// Mock child components
vi.mock('../../../components/ui/overlays/DocPreviewModal', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="doc-preview-modal"><button onClick={onClose}>Close</button></div> : null
}));
vi.mock('../../../components/ui/feedback/ConfirmationModal', () => ({
    default: ({ isOpen, onClose, onConfirm }: any) => isOpen ? (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm}>Confirm</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    ) : null
}));
vi.mock('../resources/ResourceUploadModal', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="upload-modal"><button onClick={onClose}>Close</button></div> : null
}));
vi.mock('../knowledge/AdminGuidesPanel', () => ({
    default: () => <div data-testid="admin-guides-panel" />
}));
vi.mock('../../common/UserManual/UserManual', () => ({
    default: () => <div data-testid="user-manual" />
}));
vi.mock('../resources/RequestsInbox', () => ({
    default: () => <div data-testid="requests-inbox" />
}));
vi.mock('../services/ServiceManager', () => ({
    default: () => <div data-testid="service-manager" />
}));
vi.mock('../../../services/resourceRequestService', () => ({
    resourceRequestService: {
        getPendingRequestsCount: vi.fn(() => 1),
        getPendingRequests: vi.fn(() => Promise.resolve([{ id: 'req-1' }]))
    }
}));

// Mock Firebase
vi.mock('../../../lib/firebase', () => ({
    db: { collection: vi.fn(), doc: vi.fn() },
    storage: {},
    auth: {}
}));

let adminSnapshotCallback: any = null; // Use unique name

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
    onSnapshot: vi.fn((_q, callback) => {
        adminSnapshotCallback = callback;
        return vi.fn(); // Unsubscribe
    }),
    deleteDoc: vi.fn(() => Promise.resolve()),
    doc: vi.fn(),
    updateDoc: vi.fn(() => Promise.resolve()),
    Timestamp: {
        now: () => ({ toMillis: () => Date.now() })
    },
    serverTimestamp: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
    ref: vi.fn(),
    deleteObject: vi.fn(() => Promise.resolve())
}));

const mockResources = [
    {
        id: 'res-1',
        title: 'Contrato Tipo A',
        name: 'contrato_a.pdf',
        category: 'contracts',
        type: 'application/pdf',
        size: 500000,
        isPinned: true,
        createdAt: { toMillis: () => Date.now() }
    },
    {
        id: 'res-2',
        title: 'Manual de Rider',
        name: 'rider_manual.pdf',
        category: 'manuals',
        type: 'application/pdf',
        size: 1500000,
        isPinned: false,
        createdAt: { toMillis: () => Date.now() - 1000 }
    }
];

describe('AdminResourcesPanel Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        adminSnapshotCallback = null;
    });

    const triggerSnapshot = () => {
        act(() => {
            if (adminSnapshotCallback) {
                adminSnapshotCallback({
                    docs: mockResources.map((r: any) => ({
                        id: r.id,
                        data: () => {
                            const { id: _id, ...data } = r;
                            return data;
                        }
                    }))
                });
            }
        });
    };

    it('should render loading state initially', () => {
        render(<AdminResourcesPanel />);
        expect(screen.getByRole('main').querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render vault by default and fetch resources', async () => {
        render(<AdminResourcesPanel />);

        await waitFor(() => expect(adminSnapshotCallback).toBeTruthy());
        triggerSnapshot();

        await waitFor(() => {
            expect(screen.getByText(/Bóveda Digital/i)).toBeInTheDocument();
            expect(screen.getByText('Contrato Tipo A')).toBeInTheDocument();
        });
    });

    it('should switch tabs', async () => {
        render(<AdminResourcesPanel />);

        fireEvent.click(screen.getByText(/Guías Interactivas/i));
        expect(screen.getByTestId('admin-guides-panel')).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Solicitudes/i));
        expect(screen.getByTestId('requests-inbox')).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Manual de Uso/i));
        expect(screen.getByTestId('user-manual')).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Servicios Premium/i));
        expect(screen.getByTestId('service-manager')).toBeInTheDocument();
    });

    it('should filter resources by category in vault', async () => {
        render(<AdminResourcesPanel />);

        await waitFor(() => expect(adminSnapshotCallback).toBeTruthy());
        triggerSnapshot();

        await waitFor(() => expect(screen.getByText('Contrato Tipo A')).toBeInTheDocument());

        // Default category for admin is 'contracts'
        expect(screen.getByText('Contrato Tipo A')).toBeInTheDocument();
        expect(screen.queryByText('Manual de Rider')).not.toBeInTheDocument();

        // Switch category
        const manualsButton = screen.getAllByText(/Manuales Operativos/i)[0];
        fireEvent.click(manualsButton);

        await waitFor(() => {
            expect(screen.getByText('Manual de Rider')).toBeInTheDocument();
            expect(screen.queryByText('Contrato Tipo A')).not.toBeInTheDocument();
        });
    });

    it('should open upload modal', () => {
        render(<AdminResourcesPanel />);
        fireEvent.click(screen.getByText(/Subir Nuevo Recurso/i));
        expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
    });

    it('should handle deletion confirmation', async () => {
        render(<AdminResourcesPanel />);

        await waitFor(() => expect(adminSnapshotCallback).toBeTruthy());
        triggerSnapshot();

        await waitFor(() => expect(screen.getAllByTestId('trash-icon')[0]).toBeInTheDocument());

        const trashButton = screen.getAllByTestId('trash-icon')[0];
        fireEvent.click(trashButton);

        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();

        const { deleteDoc } = await import('firebase/firestore');
        fireEvent.click(screen.getByText(/Confirm/i));

        await waitFor(() => {
            expect(deleteDoc).toHaveBeenCalled();
        });
    });

    it('should handle toggling pin', async () => {
        render(<AdminResourcesPanel />);

        await waitFor(() => expect(adminSnapshotCallback).toBeTruthy());
        triggerSnapshot();

        await waitFor(() => expect(screen.getAllByTestId('pin-icon')[0]).toBeInTheDocument());

        const { updateDoc } = await import('firebase/firestore');
        const pinButton = screen.getAllByTestId('pin-icon')[0];
        fireEvent.click(pinButton);

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalled();
        });
    });

    it('should handle token refresh', () => {
        render(<AdminResourcesPanel />);

        // Mock window.alert
        window.alert = vi.fn();

        fireEvent.click(screen.getByText(/Actualizar Token/i));
        // The token refresh is called (mocked in AuthContext)
    });
});
