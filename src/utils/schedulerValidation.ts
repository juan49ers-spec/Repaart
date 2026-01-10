/**
 * Valida conflictos de horario usando fechas completas (ISO Strings).
 * Funciona perfecto para turnos nocturnos.
 */

interface MotoAssignment {
    motoId: string;
    // other fields
}

interface ValidationShift {
    startAt: string;
    endAt: string;
    shiftId?: string;
    riderId?: string;
    riderName?: string;
    motoAssignments?: MotoAssignment[];
}

interface ConflictResult {
    riderName: string;
    // other relevant info about the conflict shift
    [key: string]: any;
}

export const findMotoConflict = (
    newShift: ValidationShift,
    existingShifts: ValidationShift[],
    ignoreShiftId: string | null = null
): ConflictResult | null => {
    // Convertimos a milisegundos (Unix Timestamp) para comparación numérica pura
    const newStart = new Date(newShift.startAt).getTime();
    const newEnd = new Date(newShift.endAt).getTime();

    // Validación de seguridad básica
    if (newEnd <= newStart) {
        throw new Error("La hora de fin debe ser posterior a la de inicio.");
    }

    // Buscamos el conflicto
    const conflict = existingShifts.find(shift => {
        // Ignorar el mismo turno si estamos editando
        if (ignoreShiftId && shift.shiftId === ignoreShiftId) return false;

        // 1. ¿Tiene asignada la misma moto?
        // Analizamos cada asignación de moto del NUEVO turno
        // vs cada asignación de moto del turno EXISTENTE + Seguridad para arrays nulos
        const newAssignments = newShift.motoAssignments || [];
        const existingAssignments = shift.motoAssignments || [];

        const hasMotoConflict = newAssignments.some(newAssignment => {
            return existingAssignments.some(existingAssignment => {
                return newAssignment.motoId === existingAssignment.motoId;
            });
        });

        if (!hasMotoConflict) return false;

        // 2. Comprobación de Solapamiento Temporal (Universal)
        const existingStart = new Date(shift.startAt).getTime();
        const existingEnd = new Date(shift.endAt).getTime();

        // La lógica de intersección:
        // Un evento A interseca con B si: (InicioA < FinB) Y (FinA > InicioB)
        return (newStart < existingEnd && newEnd > existingStart);
    });

    return (conflict as ConflictResult) || null;
};

/**
 * Valida conflictos de RIDER (Un rider no puede estar en dos sitios a la vez)
 */
export const findRiderConflict = (
    newShift: ValidationShift,
    existingShifts: ValidationShift[],
    ignoreShiftId: string | null = null
): ConflictResult | null => {
    const newStart = new Date(newShift.startAt).getTime();
    const newEnd = new Date(newShift.endAt).getTime();

    const conflict = existingShifts.find(shift => {
        if (ignoreShiftId && shift.shiftId === ignoreShiftId) return false;

        // Mismo Rider en un turno *diferente* (aunque el riderId sea el mismo en new y existing)
        if (shift.riderId !== newShift.riderId) return false;

        const existingStart = new Date(shift.startAt).getTime();
        const existingEnd = new Date(shift.endAt).getTime();

        return (newStart < existingEnd && newEnd > existingStart);
    });

    return (conflict as ConflictResult) || null;
};
