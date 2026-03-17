/**
 * Script para forzar el refresh de custom claims del usuario actual
 * Ejecutar en la consola del navegador:
 *
 * import('/src/utils/refreshToken.js').then(m => m.forceRefreshToken());
 */

import { getAuth } from 'firebase/auth';

export async function forceRefreshToken() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('❌ No hay usuario autenticado');
      return false;
    }

    console.log('🔄 Forzando refresh de token...');
    console.log('👤 Usuario:', user.email);
    console.log('🆔 UID:', user.uid);

    // Forzar refresh del token desde el servidor
    const idTokenResult = await user.getIdTokenResult(true);

    console.log('✅ Token refrescado exitosamente');
    console.log('🔑 Custom Claims:', JSON.stringify(idTokenResult.claims, null, 2));
    console.log('🎭 Role:', idTokenResult.claims.role);
    console.log('🏢 Franchise ID:', idTokenResult.claims.franchiseId);

    return true;
  } catch (error) {
    console.error('❌ Error refrescando token:', error);
    return false;
  }
}

/**
 * Verificar permisos actuales del usuario
 */
export async function checkCurrentPermissions() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('❌ No hay usuario autenticado');
      return null;
    }

    const idTokenResult = await user.getIdTokenResult();
    const claims = idTokenResult.claims;

    console.log('=== PERMISOS ACTUALES ===');
    console.log('👤 Email:', user.email);
    console.log('🆔 UID:', user.uid);
    console.log('🎭 Role:', claims.role);
    console.log('🏢 Franchise ID:', claims.franchiseId);
    console.log('📊 Status:', claims.status);
    console.log('📦 Pack:', claims.pack);
    console.log('========================');

    return claims;
  } catch (error) {
    console.error('❌ Error obteniendo permisos:', error);
    return null;
  }
}

// Hacer funciones disponibles globalmente en desarrollo
if (typeof window !== 'undefined') {
  (window as any).forceRefreshToken = forceRefreshToken;
  (window as any).checkCurrentPermissions = checkCurrentPermissions;
  console.log('💡 Comandos disponibles:');
  console.log('  - forceRefreshToken() - Refrescar custom claims');
  console.log('  - checkCurrentPermissions() - Verificar permisos actuales');
}
