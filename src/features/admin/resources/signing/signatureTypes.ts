export interface SignatureField {
    id: string;
    type: 'signature' | 'initials' | 'date' | 'text' | 'checkbox';
    label: string;
    x: number;
    y: number;
    page: number;
    width: number;
    height: number;
    required: boolean;
    value?: string;
    signerEmail?: string;
    signerName?: string;
}

export interface SigningSession {
    id: string;
    documentId: string;
    documentName: string;
    status: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined';
    createdAt: Date;
    expiresAt?: Date;
    signers: Signer[];
    fields: SignatureField[];
    signingUrl?: string;
}

export interface Signer {
    id: string;
    email: string;
    name: string;
    role: 'franchisee' | 'restaurant' | 'witness';
    order: number;
    status: 'pending' | 'viewed' | 'signed' | 'declined';
    signedAt?: Date;
}

// Posiciones predefinidas para campos de firma
export const SIGNATURE_POSITIONS = {
    franchisee: {
        x: 100,
        y: 700,
        label: 'Firma del Franquiciado'
    },
    restaurant: {
        x: 350,
        y: 700,
        label: 'Firma del Restaurante'
    },
    witness: {
        x: 225,
        y: 650,
        label: 'Firma del Testigo'
    }
};

// Plantillas de sesiones de firma
export const SIGNING_TEMPLATES = {
    basic: {
        name: 'Firma Básica',
        description: 'Dos firmas: Franquiciado y Restaurante',
        fields: [
            {
                type: 'signature' as const,
                label: 'Firma del Franquiciado',
                x: 100,
                y: 700,
                page: 1,
                width: 200,
                height: 50,
                required: true,
                role: 'franchisee'
            },
            {
                type: 'date' as const,
                label: 'Fecha',
                x: 100,
                y: 760,
                page: 1,
                width: 150,
                height: 30,
                required: true,
                role: 'franchisee'
            },
            {
                type: 'signature' as const,
                label: 'Firma del Restaurante',
                x: 350,
                y: 700,
                page: 1,
                width: 200,
                height: 50,
                required: true,
                role: 'restaurant'
            },
            {
                type: 'date' as const,
                label: 'Fecha',
                x: 350,
                y: 760,
                page: 1,
                width: 150,
                height: 30,
                required: true,
                role: 'restaurant'
            }
        ]
    },
    withWitness: {
        name: 'Con Testigo',
        description: 'Tres firmas: Franquiciado, Restaurante y Testigo',
        fields: [
            {
                type: 'signature' as const,
                label: 'Firma del Franquiciado',
                x: 50,
                y: 700,
                page: 1,
                width: 180,
                height: 50,
                required: true,
                role: 'franchisee'
            },
            {
                type: 'signature' as const,
                label: 'Firma del Restaurante',
                x: 300,
                y: 700,
                page: 1,
                width: 180,
                height: 50,
                required: true,
                role: 'restaurant'
            },
            {
                type: 'signature' as const,
                label: 'Firma del Testigo',
                x: 175,
                y: 620,
                page: 1,
                width: 180,
                height: 50,
                required: false,
                role: 'witness'
            }
        ]
    },
    initials: {
        name: 'Inicial en cada página',
        description: 'Requiere iniciales en cada página del documento',
        fields: [
            {
                type: 'initials' as const,
                label: 'Iniciales',
                x: 550,
                y: 50,
                page: 0, // Todas las páginas
                width: 60,
                height: 30,
                required: true,
                role: 'franchisee'
            },
            {
                type: 'signature' as const,
                label: 'Firma del Franquiciado',
                x: 100,
                y: 700,
                page: 1,
                width: 200,
                height: 50,
                required: true,
                role: 'franchisee'
            },
            {
                type: 'signature' as const,
                label: 'Firma del Restaurante',
                x: 350,
                y: 700,
                page: 1,
                width: 200,
                height: 50,
                required: true,
                role: 'restaurant'
            }
        ]
    }
};

// Generar URL de firma simulada
export const generateSigningUrl = (sessionId: string): string => {
    return `${window.location.origin}/sign/${sessionId}`;
};

// Crear nueva sesión de firma
export const createSigningSession = (
    documentId: string,
    documentName: string,
    signers: Omit<Signer, 'id' | 'status'>[]
): SigningSession => {
    return {
        id: `sign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        documentName,
        status: 'draft',
        createdAt: new Date(),
        signers: signers.map((signer, index) => ({
            ...signer,
            id: `signer-${Date.now()}-${index}`,
            status: 'pending'
        })),
        fields: []
    };
};

export default {
    SIGNATURE_POSITIONS,
    SIGNING_TEMPLATES,
    generateSigningUrl,
    createSigningSession
};
