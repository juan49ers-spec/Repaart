/**
 * SCRIPT PARA REPARAR CUSTOM CLAIMS
 * Copiar y pegar en la consola del navegador
 *
 * Este script reparará los custom claims del usuario actual
 * sincronizándolos desde Firestore
 */

(async function repairClaims() {
    console.log('🔧 Iniciando reparación de custom claims...');

    try {
        // Obtener el usuario actual de Firebase Auth
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');

        // Acceder a la instancia de auth que ya debería estar inicializada
        const auth = window.auth || window.firebaseAuth;

        if (!auth) {
            console.error('❌ No se encontró instancia de Firebase Auth. Asegúrate de estar logueado.');
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            console.error('❌ No hay usuario logueado. Por favor inicia sesión primero.');
            return;
        }

        console.log('👤 Usuario:', user.email);
        console.log('🆔 UID:', user.uid);

        // Obtener instancia de functions
        const functions = getFunctions();

        // Llamar a la función repairCustomClaims
        const repairFn = httpsCallable(functions, 'repairCustomClaims');
        const result = await repairFn({});

        console.log('✅ Custom claims reparados exitosamente');
        console.log('📋 Datos:', result.data);
        console.log('');
        console.log('⚠️  IMPORTANTE: Debes hacer logout y login nuevamente para que los cambios surtan efecto.');
        console.log('');
        console.log('Pasos a seguir:');
        console.log('1. Haz clic en logout/cerrar sesión');
        console.log('2. Vuelve a iniciar sesión');
        console.log('3. Los custom claims estarán actualizados');

        // Mostrar botón para hacer logout (opcional)
        if (confirm('¿Quieres hacer logout ahora para refrescar los claims?')) {
            await auth.signOut();
            console.log('✅ Logout realizado. Por favor inicia sesión nuevamente.');
            window.location.reload();
        }

    } catch (error) {
        console.error('❌ Error durante la reparación:', error);
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);

        if (error.code === 'functions/not-found') {
            console.error('');
            console.error('⚠️  La función repairCustomClaims no está desplegada.');
            console.error('Debes desplegar las funciones actualizadas primero:');
            console.error('  cd functions && firebase deploy --only functions');
        }
    }
})();
