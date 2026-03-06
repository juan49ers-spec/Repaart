/**
 * SCRIPT PARA CONSOLA - Reparar Custom Claims
 *
 * Instrucciones:
 * 1. Abre la consola del navegador (F12)
 * 2. Pega este script completo
 * 3. Presiona Enter
 * 4. Sigue las instrucciones
 */

(async function() {
    'use strict';

    console.log('🔧 Iniciando reparación de custom claims...\n');

    // Esperar un poco para que las dependencias se carguen
    await new Promise(resolve => setTimeout(resolve, 100));

    // Función para obtener módulos dinámicamente
    async function getFirebaseModules() {
        try {
            // Intentar importar desde las rutas del bundle
            const module = window.__webpack_require__ || window.webpackChunk;
            return null;
        } catch (e) {
            console.warn('No se pudo acceder a webpack:', e);
            return null;
        }
    }

    // Método 1: Buscar en el objeto window
    let auth = null;
    let functions = null;

    // Buscar Firebase en diferentes ubicaciones posibles
    const possibleKeys = [
        'firebase',
        'Firebase',
        '__firebaseApp',
        'app',
        '__authInstance',
        '__functionsInstance'
    ];

    for (const key of possibleKeys) {
        if (window[key] && window[key].auth) {
            auth = window[key].auth;
            console.log(`✅ Auth encontrado en window.${key}`);
            break;
        }
    }

    // Método 2: Acceder a través de React DevTools (si está disponible)
    if (!auth && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('🔍 Buscando instancias a través de React DevTools...');

        const fiberNode = document.querySelector('#root')?.['_reactRootContainer']?._internalRoot?.current;
        if (fiberNode) {
            console.log('✅ React Fiber encontrado, buscando contexto...');
        }
    }

    // Método 3: Usar la API directamente importando
    if (!auth) {
        console.log('📦 Intentando importar módulos dinámicamente...');

        try {
            // Importar desde la CDN como fallback
            const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');

            // Configuración de tu proyecto (debe coincidir con firebase.ts)
            const firebaseConfig = {
                apiKey: "AIzaSyC0vTiufm9bWbzXzWwqy2sEuIZLNxYiVdg",
                authDomain: "repaartfinanzas.firebaseapp.com",
                projectId: "repaartfinanzas",
                storageBucket: "repaartfinanzas.firebasestorage.app",
                messagingSenderId: "263883873106",
                appId: "1:263883873106:web:9860e5519848f48533788b",
                measurementId: "G-JK3BF315QM"
            };

            const app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            functions = getFunctions(app, 'us-central1');

            console.log('✅ Firebase inicializado desde CDN');
        } catch (error) {
            console.error('❌ Error importando desde CDN:', error);
        }
    }

    if (!auth) {
        console.error('❌ No se pudo encontrar instancia de Firebase Auth');
        console.error('\n⚠️ SOLUCIÓN: Usa el componente RepairClaimsButton en su lugar');
        console.error('1. Importa el componente en App.tsx');
        console.error('2. Haz logout y login');
        console.error('3. O ejecuta: cd functions && firebase deploy --only functions\n');
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        console.error('❌ No hay usuario logueado');
        console.error('Por favor inicia sesión primero\n');
        return;
    }

    console.log('👤 Usuario:', user.email);
    console.log('🆔 UID:', user.uid);
    console.log('');

    try {
        if (!functions) {
            throw new Error('No se pudo inicializar Firebase Functions');
        }

        console.log('📞 Llamando a función repairCustomClaims...');
        const repairFn = httpsCallable(functions, 'repairCustomClaims');
        const result = await repairFn({});

        console.log('\n✅ Custom claims reparados exitosamente');
        console.log('📋 Respuesta:', result.data);
        console.log('\n⚠️ IMPORTANTE: Debes hacer logout y login nuevamente');

        console.log('\nPasos a seguir:');
        console.log('1. Haz clic en el botón de logout/cerrar sesión');
        console.log('2. Vuelve a iniciar sesión');
        console.log('3. Los custom claims estarán actualizados');

        // Mostrar confirmación
        if (confirm('\n¿Quieres hacer logout ahora para refrescar los claims?')) {
            console.log('🚪 Haciendo logout...');
            await auth.signOut();
            console.log('✅ Logout completado');
            setTimeout(() => {
                console.log('🔄 Recargando página...');
                window.location.reload();
            }, 1000);
        }

    } catch (error) {
        console.error('\n❌ Error durante la reparación:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        console.error('\n');

        if (error.code === 'functions/not-found') {
            console.error('⚠️ La función repairCustomClaims NO está desplegada.');
            console.error('\nSOLUCIÓN: Debes desplegar las funciones actualizadas primero:');
            console.error('  cd functions');
            console.error('  firebase deploy --only functions\n');
        } else if (error.code === 'unauthenticated') {
            console.error('⚠️ No autenticado. Asegúrate de estar logueado.\n');
        } else {
            console.error('Error desconocido. Revisa la consola para más detalles.\n');
        }
    }

})();
