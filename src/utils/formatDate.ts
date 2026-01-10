import { Timestamp } from 'firebase/firestore';

/**
 * Formatea cualquier entrada de fecha (Timestamp, String, Date) a un formato legible consistente.
 */
export const formatDate = (dateInput: Timestamp | string | Date | null | undefined): string => {
    if (!dateInput) return '---'; // Maneja null/undefined

    // Caso 1: Es un Timestamp de Firestore
    if (dateInput instanceof Timestamp || (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput)) {
        // Safe cast or usage since we checked for toDate
        return (dateInput as Timestamp).toDate().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Caso 2: Es un String ISO (Legacy data o JSON serialization)
    if (typeof dateInput === 'string') {
        // Intentar crear fecha
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // Caso 3: Ya es un objeto Date JS
    if (dateInput instanceof Date) {
        if (!isNaN(dateInput.getTime())) {
            return dateInput.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    return 'Fecha inválida';
};
