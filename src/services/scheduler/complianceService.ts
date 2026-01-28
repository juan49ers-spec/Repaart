import { differenceInHours, areIntervalsOverlapping, isSameDay } from 'date-fns';

export interface ComplianceIssue {
    type: 'rest' | 'daily_limit' | 'weekly_limit' | 'overlap';
    message: string;
    severity: 'critical' | 'warning';
}

export const ComplianceService = {
    /**
     * Check for compliance issues for a set of PROPOSED shifts against EXISTING shifts for a rider.
     * @param proposedShift The shift we want to create
     * @param existingShifts The rider's current schedule
     */
    validateShiftRules: (
        proposedShift: { startAt: string, endAt: string, riderId: string | null },
        existingShifts: { startAt: string, endAt: string, riderId: string | null }[]
    ): ComplianceIssue[] => {
        // If no rider is assigned, there are no personal compliance rules to check (rest, limits, etc.)
        if (!proposedShift.riderId) return [];

        const issues: ComplianceIssue[] = [];
        const pStart = new Date(proposedShift.startAt);
        const pEnd = new Date(proposedShift.endAt);
        const pDuration = (pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60);

        // 1. OVERLAP CHECK
        const hasOverlap = existingShifts.some(s =>
            areIntervalsOverlapping(
                { start: new Date(s.startAt), end: new Date(s.endAt) },
                { start: pStart, end: pEnd }
            )
        );
        if (hasOverlap) {
            issues.push({
                type: 'overlap',
                message: 'Conflicto de horario: Se solapa con otro turno.',
                severity: 'critical'
            });
        }

        // 2. DAILY LIMIT CHECK (Max 9 hours)
        const sameDayShifts = existingShifts.filter(s => isSameDay(new Date(s.startAt), pStart));
        const currentDailyHours = sameDayShifts.reduce((acc, s) => {
            return acc + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / (1000 * 60 * 60);
        }, 0);

        if (currentDailyHours + pDuration > 9) {
            issues.push({
                type: 'daily_limit',
                message: `Límite diario excedido: ${currentDailyHours + pDuration}h > 9h.`,
                severity: 'warning'
            });
        }

        // 3. REST CHECK (Min 12 hours between shifts)
        // Find the closest previous shift end
        // And closest next shift start
        const allShifts = [...existingShifts, proposedShift].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        const myIndex = allShifts.findIndex(s => s === proposedShift); // This assumes ref equality or we filter carefully

        if (myIndex > 0) {
            const prev = allShifts[myIndex - 1];
            const hoursSincePrev = differenceInHours(pStart, new Date(prev.endAt));
            if (hoursSincePrev < 12) {
                // Relaxed rule: In hospitality/delivery, often "split shifts" (partido) are allowed.
                // A strict 12h rest is usually between *work days*. 
                // If it's the SAME day, it's a split shift, which requires min 1h break usually.
                // Let's refine: If different day, enforce 12h. If same day, enforce split logic? 
                // For now, let's keep it simple: Warn if < 12h rest between *days*, but ignore if same day split.
                if (!isSameDay(pStart, new Date(prev.endAt))) {
                    issues.push({
                        type: 'rest',
                        message: `Descanso insuficiente: Solo ${hoursSincePrev}h desde el último turno.`,
                        severity: 'warning'
                    });
                }
            }
        }

        return issues;
    }
};
