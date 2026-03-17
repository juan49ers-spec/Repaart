import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { getApp } from 'firebase/app';

/**
 * Force refresh custom claims for the current user
 */
export const forceRefreshClaims = async (): Promise<void> => {
  try {
    const auth = await import('firebase/auth').then(m => m.getAuth());
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user logged in');
    }

    // Force token refresh from server
    await user.getIdTokenResult(true);

    console.log('[Auth] Claims refreshed successfully');
  } catch (error) {
    console.error('[Auth] Error refreshing claims:', error);
    throw error;
  }
};

/**
 * Debug function to check current permissions
 */
export const checkFinancialPermissions = async (franchiseId: string, month?: string) => {
  try {
    const functionsInstance = getFunctions(getApp(), 'europe-west1');
    const debugFn = httpsCallable(functionsInstance, 'debugFinancePermissions');

    const result = await debugFn({ franchiseId, month });
    console.log('[Debug] Financial permissions check result:', result.data);
    return result.data;
  } catch (error) {
    console.error('[Debug] Error checking permissions:', error);
    throw error;
  }
};
