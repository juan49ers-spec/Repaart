export interface CostBreakdown {
    totalHours: number;
    baseCost: number;
    socialSecurity: number; // Approx 32-33%
    totalCost: number;
    ridersCount: number;
}

export const EST_HOURLY_BASE = 8.25; // Base estimate 2026 adjusted
export const SOCIAL_SECURITY_RATE = 0.33;

export const CostService = {
    /**
     * Calculate cost for a set of shifts
     * @param shifts Array of shifts with startAt/endAt
     * @param hourlyRate Base hourly rate (optional, defaults to EST_HOURLY_BASE)
     */
    calculateEstimatedCost: (
        shifts: { startAt: string; endAt: string }[],
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

        return {
            totalHours,
            baseCost,
            socialSecurity,
            totalCost: baseCost + socialSecurity,
            ridersCount: new Set(shifts.map((s: any) => s.riderId).filter(Boolean)).size
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
