import { describe, it, expect } from 'vitest';
import { detectShiftConflicts } from '../shiftConflicts';

describe('detectShiftConflicts', () => {
  it('should detect overlapping shifts for same rider', () => {
    const shifts = [
      { id: 'shift1', riderId: 'rider1', date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
      { id: 'shift2', riderId: 'rider1', date: '2024-01-15', startTime: '14:00', endTime: '22:00' },
    ];
    
    const conflicts = detectShiftConflicts(shifts);
    
    expect(conflicts.has('shift1')).toBe(true);
    expect(conflicts.has('shift2')).toBe(true);
  });

  it('should not detect conflicts for non-overlapping shifts', () => {
    const shifts = [
      { id: 'shift1', riderId: 'rider1', date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
      { id: 'shift2', riderId: 'rider1', date: '2024-01-15', startTime: '18:00', endTime: '22:00' },
    ];
    
    const conflicts = detectShiftConflicts(shifts);
    
    expect(conflicts.size).toBe(0);
  });

  it('should not detect conflicts for different riders', () => {
    const shifts = [
      { id: 'shift1', riderId: 'rider1', date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
      { id: 'shift2', riderId: 'rider2', date: '2024-01-15', startTime: '10:00', endTime: '18:00' },
    ];
    
    const conflicts = detectShiftConflicts(shifts);
    
    expect(conflicts.size).toBe(0);
  });

  it('should not detect conflicts for different dates', () => {
    const shifts = [
      { id: 'shift1', riderId: 'rider1', date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
      { id: 'shift2', riderId: 'rider1', date: '2024-01-16', startTime: '09:00', endTime: '17:00' },
    ];
    
    const conflicts = detectShiftConflicts(shifts);
    
    expect(conflicts.size).toBe(0);
  });

  it('should handle midnight-crossing shifts', () => {
    // Shift 1: 20:00 - 02:00 (cruza medianoche)
    // Shift 2: 22:00 - 04:00 (cruza medianoche también)
    // Ambos están en la misma fecha y se solapan de 22:00 a 02:00
    const shifts = [
      { id: 'shift1', riderId: 'rider1', date: '2024-01-15', startTime: '20:00', endTime: '02:00' },
      { id: 'shift2', riderId: 'rider1', date: '2024-01-15', startTime: '22:00', endTime: '04:00' },
    ];
    
    const conflicts = detectShiftConflicts(shifts);
    
    // Ambos turnos cruzan la medianoche y se solapan
    // shift1: 20:00-02:00 (1200-1560 minutos extendidos)
    // shift2: 22:00-04:00 (1320-1680 minutos extendidos)
    // Se solapan de 22:00 a 02:00
    expect(conflicts.has('shift1')).toBe(true);
    expect(conflicts.has('shift2')).toBe(true);
  });

  it('should handle multiple conflicts', () => {
    const shifts = [
      { id: 'shift1', riderId: 'rider1', date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
      { id: 'shift2', riderId: 'rider1', date: '2024-01-15', startTime: '14:00', endTime: '22:00' },
      { id: 'shift3', riderId: 'rider1', date: '2024-01-15', startTime: '20:00', endTime: '23:00' },
    ];
    
    const conflicts = detectShiftConflicts(shifts);
    
    // shift1 y shift2 se solapan
    // shift2 y shift3 se solapan
    // shift1 y shift3 NO se solapan
    expect(conflicts.has('shift1')).toBe(true);
    expect(conflicts.has('shift2')).toBe(true);
    expect(conflicts.has('shift3')).toBe(true);
  });

  it('should return empty set for empty input', () => {
    const conflicts = detectShiftConflicts([]);
    expect(conflicts.size).toBe(0);
  });

  it('should return empty set for single shift', () => {
    const shifts = [
      { id: 'shift1', riderId: 'rider1', date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
    ];
    
    const conflicts = detectShiftConflicts(shifts);
    expect(conflicts.size).toBe(0);
  });
});
