import { Timestamp } from 'firebase/firestore';

/**
 * Formatea cualquier entrada de fecha (Timestamp, String, Date) a un formato legible consistente.
 * @param dateInput - Timestamp, string, Date, or null
 * @returns Fecha formateada o '---' si es inválida/null
 */
export function formatDate(dateInput: Timestamp | string | Date | null | undefined): string;
