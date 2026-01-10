/**
 * Utility to parse Firebase Errors into user-friendly messages
 */
export const getFriendlyFirebaseError = (error: any): string => {
    if (!error) return 'Error desconocido';

    const code = error.code || '';

    switch (code) {
        case 'auth/user-not-found':
            return 'Usuario no encontrado.';
        case 'auth/wrong-password':
            return 'Contraseña incorrecta.';
        case 'auth/email-already-in-use':
            return 'Este email ya está registrado.';
        case 'auth/weak-password':
            return 'La contraseña es muy débil (min. 6 caracteres).';
        case 'auth/invalid-email':
            return 'Formato de email inválido.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos falidos. Inténtalo más tarde.';
        case 'permission-denied':
            return 'No tienes permisos para realizar esta acción.';
        case 'unavailable':
            return 'Servicio temporalmente no disponible.';
        default:
            return error.message || 'Ocurrió un error inesperado.';
    }
};
