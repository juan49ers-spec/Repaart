export interface CostBreakdown {
    totalHours: number;
    baseCost: number;
    socialSecurity: number; // Approx 32-33%
    totalCost: number;
    ridersCount: number;
}

export const EST_HOURLY_BASE = 8.25; // Base estimate 2026 adjusted
export const SOCIAL_SECURITY_RATE = 0.33;

export interface CostShiftInput {
    startAt: string;
    endAt: string;
    riderId?: string | null;
}

export const CostService = {
    /**
     * Calculate cost for a set of shifts
     * @param shifts Array of shifts with startAt/endAt and riderId
     * @param hourlyRate Base hourly rate (optional, defaults to EST_HOURLY_BASE)
     */
    calculateEstimatedCost: (
        shifts: CostShiftInput[],
        hourlyRate: number = EST_HOURLY_BASE
    ): CostBreakdown => {
        let totalMinutes = 0;

        shifts.forEach(s => {
            const start = new Date(s.startAt);
            const end = new Date(s.endAt);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60);
            if (duration > 0) totalMinutes += duration;
        });

        const totalHours = totalMinutes / 60;
        const baseCost = totalHours * hourlyRate;
        const socialSecurity = baseCost * SOCIAL_SECURITY_RATE;

        // Count unique riders
        const uniqueRiders = new Set(
            shifts
                .map(s => s.riderId)
                .filter((id): id is string => !!id)
        ).size;

        return {
            totalHours,
            baseCost,
            socialSecurity,
            totalCost: baseCost + socialSecurity,
            ridersCount: uniqueRiders
        };
    },

    formatCurrency: (amount: number): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 2
        }).format(amount);
    }
};
