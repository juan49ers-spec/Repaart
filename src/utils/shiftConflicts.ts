/**
 * Detecta si hay conflictos de horario entre turnos
 * Un conflicto ocurre cuando un rider tiene turnos solapados
 */
export function detectShiftConflicts(shifts: Array<{
  id: string;
  riderId: string;
  date: string;
  startTime: string;
  endTime: string;
}>): Set<string> {
  const conflicts = new Set<string>();
  
  // Agrupar turnos por rider y fecha
  const shiftsByRiderAndDate = new Map<string, typeof shifts>();
  
  shifts.forEach(shift => {
    const key = `${shift.riderId}_${shift.date}`;
    if (!shiftsByRiderAndDate.has(key)) {
      shiftsByRiderAndDate.set(key, []);
    }
    shiftsByRiderAndDate.get(key)!.push(shift);
  });
  
  // Verificar solapamientos en cada grupo
  shiftsByRiderAndDate.forEach(riderShifts => {
    // Ordenar por hora de inicio
    const sorted = riderShifts.sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const shift1 = sorted[i];
        const shift2 = sorted[j];
        
        // Verificar solapamiento
        if (shiftsOverlap(shift1, shift2)) {
          conflicts.add(shift1.id);
          conflicts.add(shift2.id);
        }
      }
    }
  });
  
  return conflicts;
}

/**
 * Verifica si dos turnos se solapan
 */
function shiftsOverlap(
  shift1: { startTime: string; endTime: string },
  shift2: { startTime: string; endTime: string }
): boolean {
  const start1 = timeToMinutes(shift1.startTime);
  const end1 = timeToMinutes(shift1.endTime);
  const start2 = timeToMinutes(shift2.startTime);
  const end2 = timeToMinutes(shift2.endTime);
  
  // Normalizar a minutos del día (0-1440)
  // Si un turno cruza la medianoche, su endTime será menor que startTime
  
  // Convertir a rangos de tiempo en minutos desde medianoche
  // Para turnos que cruzan medianoche, extendemos el end al día siguiente
  let s1 = start1;
  let e1 = end1 < start1 ? end1 + 24 * 60 : end1;
  let s2 = start2;
  let e2 = end2 < start2 ? end2 + 24 * 60 : end2;
  
  // Verificar solapamiento simple
  // Dos rangos se solapan si: inicio1 < fin2 AND fin1 > inicio2
  return s1 < e2 && e1 > s2;
}

/**
 * Convierte hora "HH:mm" a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export default detectShiftConflicts;
