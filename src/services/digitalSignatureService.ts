import { db, storage } from '../lib/firebase';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection,
    addDoc,
    serverTimestamp,
    Timestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

// Tipos de firma soportados
export type SignatureType = 'simple' | 'advanced' | 'qualified';

export interface SignerInfo {
    email: string;
    name: string;
    role: string;
    signed: boolean;
    signedAt?: Timestamp;
    signatureId?: string;
}

export interface SignatureMetadata {
    id: string;
    documentId: string;
    documentName: string;
    signedBy: string;
    signerEmail: string;
    signedAt: Timestamp;
    signatureType: SignatureType;
    ipAddress?: string;
    userAgent?: string;
    hash: string;
    certificateId?: string;
    verified: boolean;
    revoked?: boolean;
    revokedAt?: Timestamp;
    revocationReason?: string;
    lastVerifiedAt?: Timestamp;
}

export interface SignatureRequest {
    id?: string;
    documentId: string;
    documentName: string;
    requesterId: string;
    requesterEmail: string;
    signers: SignerInfo[];
    status: 'pending' | 'signed' | 'expired' | 'cancelled';
    createdAt?: Timestamp;
    expiresAt?: Timestamp;
    completedAt?: Timestamp;
}

export interface SignatureAuditTrail {
    signatureId: string;
    events: AuditEvent[];
}

export interface AuditEvent {
    timestamp: Timestamp;
    action: string;
    actor: string;
    details?: string;
    ipAddress?: string;
}

const SIGNATURES_COLLECTION = 'digital_signatures';
const SIGNATURE_REQUESTS_COLLECTION = 'signature_requests';
const AUDIT_TRAILS_COLLECTION = 'signature_audit_trails';

export class DigitalSignatureService {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Generar hash SHA-256 del documento usando Web Crypto API
     */
    async generateDocumentHash(content: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Crear solicitud de firma
     */
    async createSignatureRequest(
        documentId: string,
        documentName: string,
        signers: Omit<SignerInfo, 'signed'>[]
    ): Promise<string> {
        const requestData: SignatureRequest = {
            documentId,
            documentName,
            requesterId: this.userId,
            requesterEmail: '', // Se obtiene del contexto de auth
            signers: signers.map(s => ({ ...s, signed: false })),
            status: 'pending',
            createdAt: serverTimestamp() as Timestamp,
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 días
        };

        const docRef = await addDoc(collection(db, SIGNATURE_REQUESTS_COLLECTION), requestData);
        
        // Crear evento de auditoría
        await this.createAuditTrail(
            `request_${docRef.id}`, 
            'REQUEST_CREATED', 
            `Solicitud de firma creada para ${documentName}`
        );
        
        return docRef.id;
    }

    /**
     * Firmar documento
     */
    async signDocument(
        documentContent: string,
        documentId: string,
        documentName: string,
        signatureType: SignatureType = 'simple',
        certificateId?: string
    ): Promise<SignatureMetadata> {
        // Generar hash del documento
        const documentHash = await this.generateDocumentHash(documentContent);

        // Crear metadatos de firma
        const signatureId = `${this.userId}_${Date.now()}`;
        const signatureData: SignatureMetadata = {
            id: signatureId,
            documentId,
            documentName,
            signedBy: this.userId,
            signerEmail: '', // Se obtiene del contexto
            signedAt: serverTimestamp() as Timestamp,
            signatureType,
            ipAddress: await this.getIPAddress(),
            userAgent: navigator.userAgent,
            hash: documentHash,
            certificateId,
            verified: true
        };

        // Guardar firma en Firestore
        await setDoc(doc(db, SIGNATURES_COLLECTION, signatureId), signatureData);

        // Crear trail de auditoría
        await this.createAuditTrail(signatureId, 'DOCUMENT_SIGNED', 'Documento firmado exitosamente');

        // Actualizar solicitud de firma si existe
        await this.updateSignatureRequest(documentId, this.userId, signatureId);

        return signatureData;
    }

    /**
     * Verificar firma
     */
    async verifySignature(signatureId: string, currentContent?: string): Promise<boolean> {
        const signatureRef = doc(db, SIGNATURES_COLLECTION, signatureId);
        const signatureSnap = await getDoc(signatureRef);

        if (!signatureSnap.exists()) {
            return false;
        }

        const signatureData = signatureSnap.data() as SignatureMetadata;

        // Si se proporciona contenido actual, verificar integridad
        if (currentContent) {
            const currentHash = await this.generateDocumentHash(currentContent);
            const isIntegrityValid = currentHash === signatureData.hash;

            // Actualizar estado de verificación
            await updateDoc(signatureRef, {
                verified: isIntegrityValid,
                lastVerifiedAt: serverTimestamp()
            });

            await this.createAuditTrail(
                signatureId, 
                isIntegrityValid ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_FAILED',
                `Verificación de integridad: ${isIntegrityValid ? 'VÁLIDA' : 'INVÁLIDA'}`
            );

            return isIntegrityValid;
        }

        return signatureData.verified;
    }

    /**
     * Obtener firmas de un documento
     */
    async getDocumentSignatures(documentId: string): Promise<SignatureMetadata[]> {
        const q = query(
            collection(db, SIGNATURES_COLLECTION),
            where('documentId', '==', documentId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SignatureMetadata));
    }

    /**
     * Obtener trail de auditoría
     */
    async getAuditTrail(signatureId: string): Promise<AuditEvent[]> {
        const trailRef = doc(db, AUDIT_TRAILS_COLLECTION, signatureId);
        const trailSnap = await getDoc(trailRef);

        if (!trailSnap.exists()) {
            return [];
        }

        const trailData = trailSnap.data() as SignatureAuditTrail;
        return trailData.events || [];
    }

    /**
     * Revocar firma
     */
    async revokeSignature(signatureId: string, reason: string): Promise<void> {
        const signatureRef = doc(db, SIGNATURES_COLLECTION, signatureId);
        
        await updateDoc(signatureRef, {
            revoked: true,
            revokedAt: serverTimestamp(),
            revocationReason: reason,
            verified: false
        });

        await this.createAuditTrail(signatureId, 'SIGNATURE_REVOKED', `Firma revocada: ${reason}`);
    }

    /**
     * Descargar certificado de firma
     */
    async downloadSignatureCertificate(signatureId: string): Promise<string> {
        const signatureRef = doc(db, SIGNATURES_COLLECTION, signatureId);
        const signatureSnap = await getDoc(signatureRef);

        if (!signatureSnap.exists()) {
            throw new Error('Firma no encontrada');
        }

        const signatureData = signatureSnap.data() as SignatureMetadata;
        const auditTrail = await this.getAuditTrail(signatureId);

        // Generar certificado en formato markdown
        const certificate = this.generateCertificate(signatureData, auditTrail);

        // Subir a Storage
        const certPath = `signatures/certificates/${signatureId}_certificate.md`;
        const storageRef = ref(storage, certPath);
        await uploadString(storageRef, certificate);

        return await getDownloadURL(storageRef);
    }

    /**
     * Generar certificado de firma en formato markdown
     */
    private generateCertificate(
        signatureData: SignatureMetadata, 
        auditTrail: AuditEvent[]
    ): string {
        const certificateDate = signatureData.signedAt.toDate().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `# CERTIFICADO DE FIRMA DIGITAL

## Información del Documento

- **ID del Documento:** ${signatureData.documentId}
- **Nombre:** ${signatureData.documentName}
- **Hash SHA-256:** \`${signatureData.hash}\`

## Información del Firmante

- **ID:** ${signatureData.signedBy}
- **Email:** ${signatureData.signerEmail}
- **Fecha y Hora:** ${certificateDate}

## Detalles Técnicos

- **Tipo de Firma:** ${signatureData.signatureType.toUpperCase()}
- **ID de Certificado:** ${signatureData.certificateId || 'N/A'}
- **Dirección IP:** ${signatureData.ipAddress || 'N/A'}
- **User Agent:** ${signatureData.userAgent || 'N/A'}
- **Estado:** ${signatureData.verified ? '✅ VERIFICADA' : '❌ NO VERIFICADA'}

## Trail de Auditoría

| Fecha | Acción | Actor | Detalles |
|-------|--------|-------|----------|
${auditTrail.map(event => 
    `| ${event.timestamp.toDate().toLocaleString('es-ES')} | ${event.action} | ${event.actor} | ${event.details || '-'} |`
).join('\n')}

---

*Este certificado ha sido generado automáticamente por el sistema de firma digital de RePaart.*
*La integridad del documento puede ser verificada comparando el hash SHA-256.*

**ID de Firma:** ${signatureData.id}
`;
    }

    /**
     * Crear evento en trail de auditoría
     */
    private async createAuditTrail(
        signatureId: string, 
        action: string, 
        details?: string
    ): Promise<void> {
        const trailRef = doc(db, AUDIT_TRAILS_COLLECTION, signatureId);
        const trailSnap = await getDoc(trailRef);

        const event: AuditEvent = {
            timestamp: serverTimestamp() as Timestamp,
            action,
            actor: this.userId,
            details,
            ipAddress: await this.getIPAddress()
        };

        if (trailSnap.exists()) {
            const trailData = trailSnap.data() as SignatureAuditTrail;
            await updateDoc(trailRef, {
                events: [...trailData.events, event]
            });
        } else {
            await setDoc(trailRef, {
                signatureId,
                events: [event]
            });
        }
    }

    /**
     * Actualizar solicitud de firma cuando se firma
     */
    private async updateSignatureRequest(
        documentId: string, 
        signerId: string,
        signatureId: string
    ): Promise<void> {
        const q = query(
            collection(db, SIGNATURE_REQUESTS_COLLECTION),
            where('documentId', '==', documentId)
        );

        const snapshot = await getDocs(q);
        
        snapshot.forEach(async (docSnap) => {
            const requestData = docSnap.data() as SignatureRequest;
            const updatedSigners = requestData.signers.map(signer => {
                if (signer.email === signerId) {
                    return {
                        ...signer,
                        signed: true,
                        signedAt: serverTimestamp(),
                        signatureId
                    };
                }
                return signer;
            });

            const allSigned = updatedSigners.every(s => s.signed);

            await updateDoc(doc(db, SIGNATURE_REQUESTS_COLLECTION, docSnap.id), {
                signers: updatedSigners,
                status: allSigned ? 'signed' : 'pending',
                completedAt: allSigned ? serverTimestamp() : null
            });
        });
    }

    /**
     * Obtener dirección IP del usuario
     */
    private async getIPAddress(): Promise<string | undefined> {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return undefined;
        }
    }
}

export default DigitalSignatureService;
