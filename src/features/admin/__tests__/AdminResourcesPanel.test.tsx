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
        Download: null, Plus: null, Pin: null, FolderOpen: null, Briefcase: null, BookOpen: null,
        Layout: null, Folder: null, RefreshCw: null, ShieldAlert: null, Wrench: null, Users: null, PlayCircle: null,
        Zap: null, Heart: null, Star: null, Award: null, Info: null, AlertTriangle: null, CheckCircle: null, AlertCircle: null,
        HelpCircle: null, Lightbulb: null, Target: null, Loader2: null, Check: null, ChevronRight: null,
        ChevronLeft: null, X: null, Menu: null, Filter: null, Settings: null, LogOut: null, User: null,
        Bell: null, Calendar: null, Clock: null, MapPin: null, Phone: null, Mail: null, Globe: null,
        ExternalLink: null, Copy: null, Edit: null, Save: null, Sparkles: null, BarChart3: null, FileCheck: null,
        TrendingUp: null, PenTool: null, ShieldCheck: null, Fingerprint: null, Lock: null, Send: null,
        Link2: null, Gauge: null, MapPinned: null, FileType: null, FileType2: null, Droplets: null,
        UploadCloud: null, FileUp: null, Archive: null, ChevronDown: null, ArrowUpDown: null, Home: null,
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
vi.mock('../resources/ContractAnalyticsDashboard', () => ({
    default: () => <div data-testid="analytics-dashboard" />
}));
vi.mock('../resources/SmartContractWizard', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? (
        <div data-testid="smart-contract-wizard">
            <button onClick={onClose}>Close Wizard</button>
        </div>
    ) : null
}));
vi.mock('../resources/FiscalValidationModal', () => ({
    default: ({ isOpen, onClose, onContinue, onEdit }: any) => isOpen ? (
        <div data-testid="fiscal-validation-modal">
            <button onClick={onClose}>Close</button>
            <button onClick={onContinue} data-testid="fiscal-continue">Continue</button>
            <button onClick={onEdit} data-testid="fiscal-edit">Edit</button>
        </div>
    ) : null
}));
vi.mock('../resources/FiscalDataForm', () => ({
    default: ({ isOpen, onClose, onSuccess }: any) => isOpen ? (
        <div data-testid="fiscal-data-form">
            <button onClick={onClose}>Close</button>
            <button onClick={onSuccess} data-testid="fiscal-success">Success</button>
        </div>
    ) : null
}));
vi.mock('../resources/TemplateSelector', () => ({
    default: ({ isOpen, onClose, onSelectTemplate }: any) => isOpen ? (
        <div data-testid="template-selector">
            <button onClick={onClose}>Close</button>
            <button onClick={() => onSelectTemplate({ content: 'test content' })} data-testid="select-template">Select</button>
        </div>
    ) : null
}));
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../../../services/resourceRequestService', () => ({
    resourceRequestService: {
        getPendingRequestsCount: vi.fn(() => 1),
        getPendingRequests: vi.fn(() => Promise.resolve([{ id: 'req-1' }]))
    }
}));

// Mock hooks
vi.mock('../../../hooks/useFranchiseData', () => ({
    useFranchiseData: () => ({
        franchiseData: null,
        validation: { isValid: false, errors: [] },
        isReady: false
    })
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

        await act(async () => {
            fireEvent.click(screen.getByText(/Guías Interactivas/i));
        });
        expect(screen.getByTestId('admin-guides-panel')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByText(/Solicitudes/i));
        });
        expect(screen.getByTestId('requests-inbox')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByText(/Servicios Premium/i));
        });
        expect(screen.getByTestId('service-manager')).toBeInTheDocument();

        // Volver a Bóveda
        await act(async () => {
            fireEvent.click(screen.getByText(/Bóveda/i));
        });
        expect(screen.getByText(/Bóveda Digital/i)).toBeInTheDocument();
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
        await act(async () => {
            fireEvent.click(manualsButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Manual de Rider')).toBeInTheDocument();
            expect(screen.queryByText('Contrato Tipo A')).not.toBeInTheDocument();
        });
    });

    it('should open upload modal', async () => {
        render(<AdminResourcesPanel />);
        await act(async () => {
            fireEvent.click(screen.getByText(/Subir Nuevo Recurso/i));
        });
        expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
    });

    it('should handle deletion confirmation', async () => {
        render(<AdminResourcesPanel />);

        await waitFor(() => expect(adminSnapshotCallback).toBeTruthy());
        triggerSnapshot();

        await waitFor(() => expect(screen.getAllByTestId('trash-icon')[0]).toBeInTheDocument());

        const trashButton = screen.getAllByTestId('trash-icon')[0];
        await act(async () => {
            fireEvent.click(trashButton);
        });

        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();

        const { deleteDoc } = await import('firebase/firestore');
        await act(async () => {
            fireEvent.click(screen.getByText(/Confirm/i));
        });

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
        await act(async () => {
            fireEvent.click(pinButton);
        });

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalled();
        });
    });

    it('should handle token refresh', async () => {
        const toast = (await import('react-hot-toast')).default;
        render(<AdminResourcesPanel />);

        fireEvent.click(screen.getByText(/Actualizar Token/i));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/Token actualizado/i));
        });
    });

    it('should show analytics dashboard', async () => {
        render(<AdminResourcesPanel />);

        await waitFor(() => expect(adminSnapshotCallback).toBeTruthy());
        act(() => triggerSnapshot());

        // Open analytics section
        const analyticsBtn = await screen.findByText(/Analytics/i);
        act(() => {
            fireEvent.click(analyticsBtn);
        });

        const dashboard = await screen.findByTestId('analytics-dashboard');
        expect(dashboard).toBeInTheDocument();
    });

    it('should open smart contract wizard and follow overlay sequence', async () => {
        render(<AdminResourcesPanel />);

        await waitFor(() => expect(adminSnapshotCallback).toBeTruthy());
        act(() => triggerSnapshot());

        // We find the wizard button (in empty state or sidebar)
        const wizardButton = await screen.findAllByText(/Generar/i);
        await act(async () => {
            fireEvent.click(wizardButton[0]);
        });

        // 1. Opens FiscalValidationModal
        expect(screen.getByTestId('fiscal-validation-modal')).toBeInTheDocument();
        
        // 2. Click continue -> opens TemplateSelector
        await act(async () => {
            fireEvent.click(screen.getByTestId('fiscal-continue'));
        });
        expect(screen.queryByTestId('fiscal-validation-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('template-selector')).toBeInTheDocument();

        // 3. Select template -> opens Wizard
        await act(async () => {
            fireEvent.click(screen.getByTestId('select-template'));
        });
        expect(screen.queryByTestId('template-selector')).not.toBeInTheDocument();
        expect(screen.getByTestId('smart-contract-wizard')).toBeInTheDocument();
        
        // 4. Close wizard
        await act(async () => {
            fireEvent.click(screen.getByText('Close Wizard'));
        });
        expect(screen.queryByTestId('smart-contract-wizard')).not.toBeInTheDocument();
    });
});