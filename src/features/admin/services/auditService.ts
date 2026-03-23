import { addDoc, collection, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { User } from 'firebase/auth';

export type AuditAction = 'APPROVE' | 'REJECT' | 'MODIFY' | 'CREATE' | 'DELETE';
export type AuditResource = 'finance_closure' | 'work_shift' | 'user' | 'system';

export interface AuditLogEntry {
    action: AuditAction;
    resource: AuditResource;
    resourceId: string;
    actor: {
        uid: string;
        email: string | null;
        role?: string;
    };
    meta: {
        userAgent: string;
        timestamp: FieldValue;
        ip?: string;
        version: string;
    };
    changes?: {
        before?: unknown;
        after?: unknown;
    };
    context?: {
        reason?: string;
        notificationId?: string;
        [key: string]: unknown;
    };
}

class AuditService {
    private collectionName = 'audit_logs';

    /**
     * Logs an action to the audit trail.
     * @param user The user performing the action (Firebase Auth User)
     * @param action The type of action performed
     * @param resource The resource being acted upon
     * @param resourceId The ID of the resource
     * @param changes Optional changes (before/after)
     * @param context Optional additional context
     */
    async logAction(
        user: User,
        action: AuditAction,
        resource: AuditResource,
        resourceId: string,
        changes?: { before?: unknown; after?: unknown },
        context?: { reason?: string; notificationId?: string;[key: string]: unknown }
    ): Promise<string> {
        try {
            const entry: AuditLogEntry = {
                action,
                resource,
                resourceId,
                actor: {
                    uid: user.uid,
                    email: user.email,
                    // If we had role in User object directly or passed separately, we'd add it here. 
                    // For now, assuming standard Firebase User.
                },
                meta: {
                    userAgent: navigator.userAgent,
                    timestamp: serverTimestamp(),
                    version: '3.12.2', // Could be environment variable
                },
                changes,
                context
            };

            const docRef = await addDoc(collection(db, this.collectionName), entry);
            console.log(`[Audit] Logged ${action} on ${resource} (${resourceId}) - ID: ${docRef.id}`);
            return docRef.id;

        } catch (error) {
            console.error("[Audit] Failed to log action:", error);
            // We don't throw here to avoid blocking the main business logic if logging fails,
            // but in strict compliance environments, you might want to throw.
            return '';
        }
    }
}

export const auditService = new AuditService();
