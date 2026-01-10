import { useMemo } from 'react';
import {
    checkSupportHealth,
    detectUserAnomaly,
    generatePredictiveAlerts,
    calculateHealthScore,
    type SupportAnalysis,
    type UserAnomalyAnalysis,
    type Alert
} from '../utils/analyticsHelpers';

interface UseIntelligenceParams {
    tickets?: any[];
    users?: any[];
    dashboardData?: any;
}

export const useIntelligence = ({ tickets = [], users = [], dashboardData = {} }: UseIntelligenceParams) => {

    // 1. Analyze Support Vector
    const supportAnalysis: SupportAnalysis = useMemo(() => {
        return checkSupportHealth(tickets);
    }, [tickets]);

    // 2. Analyze User/Growth Vector
    const userAnalysis: UserAnomalyAnalysis = useMemo(() => {
        return detectUserAnomaly(users, dashboardData);
    }, [users, dashboardData]);

    // 3. Aggregate Alerts
    const alerts: Alert[] = useMemo(() => {
        return generatePredictiveAlerts(supportAnalysis, userAnalysis);
    }, [supportAnalysis, userAnalysis]);

    // 4. Calculate Global Health Score
    const healthScore: number = useMemo(() => {
        return calculateHealthScore(alerts);
    }, [alerts]);

    // 5. Predictive Trends (Placeholder for ML expansion)
    const predictions = useMemo(() => {
        return {
            supportLoad: supportAnalysis.status === 'bottleneck' ? 'increasing' : 'stable',
            growth: userAnalysis.detected ? 'feature_spike' : 'organic',
            nextAction: alerts.length > 0 ? 'immediate_attention' : 'monitor'
        };
    }, [supportAnalysis, userAnalysis, alerts]);

    return {
        // High Level
        healthScore,
        status: healthScore > 80 ? 'optimal' : healthScore > 50 ? 'warning' : 'critical',

        // Actionable
        alerts,
        predictions,

        // Raw Analysis (for drilling down)
        raw: {
            support: supportAnalysis,
            users: userAnalysis
        }
    };
};
