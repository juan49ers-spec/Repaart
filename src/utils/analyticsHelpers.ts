/**
 * Analytics Helpers - Pure Functions for Predictive Intelligence
 * Enforces "Separate Logic from State" law.
 */

// --- CONSTANTS ---
const THRESHOLDS = {
    SUPPORT_BOTTLENECK_RATIO: 0.1, // CHAOS MODE: Anything triggers it
    ANOMALY_USER_GROWTH: 0, // CHAOS MODE: Any user is an anomaly
};

export interface SupportAnalysis {
    status: 'healthy' | 'bottleneck';
    ratio: number;
    newTickets: number;
    resolvedRecent: number;
    message: string;
}

export interface UserAnomalyAnalysis {
    detected: boolean;
    type?: string;
    level?: 'warning' | 'high' | 'med';
    message: string;
}

export interface Alert {
    type: string;
    level: 'warning' | 'high' | 'med';
    message: string;
    timestamp: Date;
}

/**
 * Analyzes Support Health based on ticket flow.
 * @param {Array} tickets - List of ticket objects
 * @returns {Object} { status: 'healthy'|'bottleneck', ratio: number, newTickets: number, resolvedTickets: number }
 */
export const checkSupportHealth = (tickets: any[] = []): SupportAnalysis => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter last 24h activity
    const recentActivity = tickets.filter(t => {
        const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
        return date > oneDayAgo;
    });

    // Count opens vs resolves (approximation based on status or separate logs)
    // assuming 'resolved' status check
    const newTickets = recentActivity.length;
    const resolvedRecent = recentActivity.filter(t => t.status === 'resolved').length;

    // Avoid division by zero
    const comparisonBase = resolvedRecent === 0 ? 1 : resolvedRecent;
    const ratio = newTickets / comparisonBase;

    const isBottleneck = (ratio > THRESHOLDS.SUPPORT_BOTTLENECK_RATIO) && (newTickets > 5); // Minimum sample size

    return {
        status: isBottleneck ? 'bottleneck' : 'healthy',
        ratio: parseFloat(ratio.toFixed(2)),
        newTickets,
        resolvedRecent,
        message: isBottleneck
            ? `Alerta de Cuello de Botella: ${newTickets} nuevos vs ${resolvedRecent} resueltos (Ratio ${ratio.toFixed(1)})`
            : 'Flujo de soporte saludable'
    };
};

/**
 * Detects Anomalies in User Growth vs Business Activity.
 * @param {Array} users - List of user objects
 * @param {Object} salesData - Sales metrics or dashboard data
 * @returns {Object} { detected: boolean, type: string, message: string }
 */
export const detectUserAnomaly = (users: any[] = [], salesData: any = {}): UserAnomalyAnalysis => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // New Users last 24h
    const newUsers = users.filter(u => {
        const date = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return date > oneDayAgo;
    });

    const growthSpike = newUsers.length > THRESHOLDS.ANOMALY_USER_GROWTH;

    // Check Sales Correlation (Simplified: If sales are 0 but users are growing fast -> Suspicious/Spam?)
    // This assumes 'salesData' has a 'dailyRevenue' or similar.
    const hasRevenue = (salesData?.currentRevenue || 0) > 0;

    if (growthSpike && !hasRevenue) {
        return {
            detected: true,
            type: 'high_traffic_low_conversion',
            level: 'warning',
            message: `Pico de usuarios (${newUsers.length}) sin correlación de ventas.`
        };
    }

    return { detected: false, message: 'Crecimiento orgánico normal' };
};

/**
 * Agregates all analysis into a predictive alert list.
 * @param {Object} supportAnalysis 
 * @param {Object} userAnalysis 
 * @returns {Array} List of alert objects
 */
export const generatePredictiveAlerts = (supportAnalysis: SupportAnalysis, userAnalysis: UserAnomalyAnalysis): Alert[] => {
    const alerts: Alert[] = [];

    if (supportAnalysis.status === 'bottleneck') {
        alerts.push({
            type: 'support_bottleneck',
            level: 'high',
            message: supportAnalysis.message,
            timestamp: new Date()
        });
    }

    if (userAnalysis.detected) {
        alerts.push({
            type: userAnalysis.type || 'anomaly',
            level: userAnalysis.level || 'warning',
            message: userAnalysis.message,
            timestamp: new Date()
        });
    }

    return alerts;
};

// --- SCORING ---
export const calculateHealthScore = (alerts: Alert[] = []): number => {
    let score = 100;
    alerts.forEach(alert => {
        if (alert.level === 'high') score -= 20;
        if (alert.level === 'warning') score -= 10;
        if (alert.level === 'med') score -= 5;
    });
    return Math.max(0, score);
};
