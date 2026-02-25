import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DigitalSignatureService, { 
    SignatureMetadata, 
    SignatureType,
    AuditEvent 
} from '../services/digitalSignatureService';

interface UseDigitalSignatureReturn {
    isLoading: boolean;
    error: string | null;
    signatureData: SignatureMetadata | null;
    auditTrail: AuditEvent[];
    signDocument: (
        content: string,
        documentId: string,
        documentName: string,
        type?: SignatureType
    ) => Promise<SignatureMetadata | null>;
    verifySignature: (
        signatureId: string,
        currentContent?: string
    ) => Promise<boolean>;
    getDocumentSignatures: (documentId: string) => Promise<SignatureMetadata[]>;
    getAuditTrail: (signatureId: string) => Promise<void>;
    downloadCertificate: (signatureId: string) => Promise<string | null>;
    revokeSignature: (signatureId: string, reason: string) => Promise<void>;
    clearError: () => void;
}

export const useDigitalSignature = (): UseDigitalSignatureReturn => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [signatureData, setSignatureData] = useState<SignatureMetadata | null>(null);
    const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);

    const getService = useCallback((): DigitalSignatureService | null => {
        if (!user?.uid) {
            setError('Usuario no autenticado');
            return null;
        }
        return new DigitalSignatureService(user.uid);
    }, [user?.uid]);

    const signDocument = useCallback(async (
        content: string,
        documentId: string,
        documentName: string,
        type: SignatureType = 'simple'
    ): Promise<SignatureMetadata | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const service = getService();
            if (!service) return null;

            const result = await service.signDocument(
                content,
                documentId,
                documentName,
                type
            );

            setSignatureData(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al firmar documento';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [getService]);

    const verifySignature = useCallback(async (
        signatureId: string,
        currentContent?: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const service = getService();
            if (!service) return false;

            const isValid = await service.verifySignature(signatureId, currentContent);
            return isValid;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al verificar firma';
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [getService]);

    const getDocumentSignatures = useCallback(async (
        documentId: string
    ): Promise<SignatureMetadata[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const service = getService();
            if (!service) return [];

            const signatures = await service.getDocumentSignatures(documentId);
            return signatures;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al obtener firmas';
            setError(errorMessage);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [getService]);

    const getAuditTrail = useCallback(async (signatureId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const service = getService();
            if (!service) return;

            const trail = await service.getAuditTrail(signatureId);
            setAuditTrail(trail);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al obtener trail de auditoría';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [getService]);

    const downloadCertificate = useCallback(async (
        signatureId: string
    ): Promise<string | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const service = getService();
            if (!service) return null;

            const url = await service.downloadSignatureCertificate(signatureId);
            return url;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al descargar certificado';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [getService]);

    const revokeSignature = useCallback(async (
        signatureId: string,
        reason: string
    ): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const service = getService();
            if (!service) return;

            await service.revokeSignature(signatureId, reason);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al revocar firma';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [getService]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isLoading,
        error,
        signatureData,
        auditTrail,
        signDocument,
        verifySignature,
        getDocumentSignatures,
        getAuditTrail,
        downloadCertificate,
        revokeSignature,
        clearError
    };
};

export default useDigitalSignature;
