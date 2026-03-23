/**
 * Script para reparar custom claims del usuario actual
 * Ejecutar en la consola del navegador estando logueado
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { auth } from '../lib/firebase';

export const repairMyClaims = async () => {
    if (!auth.currentUser) {
        console.error('❌ No hay usuario logueado');
        return false;
    }

    try {
        console.log('🔧 Reparando custom claims para:', auth.currentUser.email);

        const repairClaimsFn = httpsCallable(functions, 'repairCustomClaims');
        const result = await repairClaimsFn({});

        console.log('✅ Custom claims reparados exitosamente');
        console.log('📋 Claims:', result.data);
        console.log('⚠️ IMPORTANTE: Haz logout y login nuevamente para refrescar el token');

        return true;
    } catch (error: unknown) {
        console.error('❌ Error reparando custom claims:', error);
        const err = error as { code?: string; message?: string };
        console.error('Código:', err.code);
        console.error('Mensaje:', err.message);
        return false;
    }
};

// Ejecutar automáticamente si se importa el script
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).repairMyClaims = repairMyClaims;
    console.log('💡 Función repairMyClaims disponible. Ejecuta: await repairMyClaims()');
}
