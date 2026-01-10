import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const AUDIT_ACTIONS = {
    // Auth
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED', // 🔐 Cambio de contraseña
    PASSWORD_RESET_REQ: 'PASSWORD_RESET_REQ', // 📩 Solicitud de mail recuperación

    // User Mgmt
    USER_APPROVED: 'USER_APPROVED',
    USER_REVOKED: 'USER_REVOKED',
    USER_ROLE_UPDATED: 'USER_ROLE_UPDATED',
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',

    // Support
    TICKET_CREATED: 'TICKET_CREATED',
    TICKET_REPLIED: 'TICKET_REPLIED',
    TICKET_RESOLVED: 'TICKET_RESOLVED',
    TICKET_UPDATE: 'TICKET_UPDATE',
    TICKET_NOTE: 'TICKET_NOTE',

    // Financials
    MONTHLY_DATA_EDITED: 'MONTHLY_DATA_EDITED',

    // System
    SYSTEM_EVENT: 'SYSTEM_EVENT',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    CLIENT_CRASH: 'CLIENT_CRASH'
} as const;

export type AuditActionType = keyof typeof AUDIT_ACTIONS | string;

export interface LogDetails {
    [key: string]: unknown;
}

interface AuditUser {
    uid?: string;
    email?: string | null;
    role?: string;
}

/**
 * Logs a critical action to the 'audit_logs' collection.
 * 
 * @param {object} user - The user performing the action (should have uid, email, role).
 * @param {string} action - CONSTANT_CASE action name (e.g., 'USER_LOGIN', 'TICKET_RESOLVED').
 * @param {object} details - Additional context (e.g., targetUserId, ticketId, changes).
 */
export const logAction = async (user: AuditUser | null, action: AuditActionType, details: LogDetails = {}): Promise<void> => {
    try {
        if (!user || !user.uid) {
            console.warn("Audit: No user provided for action", action);
            return;
        }

        await addDoc(collection(db, "audit_logs"), {
            timestamp: serverTimestamp(),
            actorId: user.uid,
            actorEmail: user.email || 'unknown',
            actorRole: user.role || 'unknown',
            action: action,
            details: details,
            userAgent: navigator.userAgent
        });

        if ((import.meta as any).env?.DEV) {
            console.log(`Audit: [${action}] logged successfully.`);
        }
    } catch (error) {
        console.error("Audit Critical Error: Failed to log action", action, error);

        // SECURITY HARDENING: Block critical actions if audit fails
        const CRITICAL_ACTIONS = [
            AUDIT_ACTIONS.LOGIN_SUCCESS,
            AUDIT_ACTIONS.USER_APPROVED,
            AUDIT_ACTIONS.USER_REVOKED,
            AUDIT_ACTIONS.USER_ROLE_UPDATED,
            AUDIT_ACTIONS.CREATE_USER,
            AUDIT_ACTIONS.UPDATE_USER,
            AUDIT_ACTIONS.DELETE_USER,
            AUDIT_ACTIONS.PASSWORD_CHANGED
        ];

        if (CRITICAL_ACTIONS.includes(action as any)) {
            throw new Error(`CRITICAL SECURITY: Action ${action} blocked because audit log failed.`);
        }
    }
};
