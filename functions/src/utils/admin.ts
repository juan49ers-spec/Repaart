import * as admin from 'firebase-admin';

/**
 * Checks if a given user is the last active (not banned or deleted) administrator.
 * @param uid The UID of the user to check.
 * @returns Promise<boolean> True if the user is the last active admin.
 */
export async function isLastAdmin(uid: string): Promise<boolean> {
    const adminQuery = admin.firestore().collection('users')
        .where('role', '==', 'admin')
        .where('status', '==', 'active');

    const snapshot = await adminQuery.get();

    // If there's only one active admin and it matches the UID
    if (snapshot.size === 1 && snapshot.docs[0].id === uid) {
        return true;
    }

    // Safety check: if no admins found in Firestore (sync error?), 
    // we should be careful but usually we rely on Firestore as Mirror.
    return false;
}
