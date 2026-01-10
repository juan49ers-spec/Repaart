import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { financeService } from '../services/financeService';
import { userService } from '../services/userService';
import { intelService, IntellectualEvent } from '../services/intelService';
import { format } from 'date-fns';

export interface AdminControlData {
    network: {
        total: number;
        excellent: number;
        acceptable: number;
        critical: number;
        franchises: any[];
    };
    pending: {
        total: number;
        tickets: number;
        premium: number;
        records: number;
        alerts: number;
        list: any[];
    };
    events: IntellectualEvent[];
    earnings: {
        royalties: number;
        services: number;
        totalNetworkRevenue: number;
    };
}

export const useAdminControl = () => {
    const [data, setData] = useState<AdminControlData>({
        network: { total: 0, excellent: 0, acceptable: 0, critical: 0, franchises: [] },
        pending: { total: 0, tickets: 0, premium: 0, records: 0, alerts: 0, list: [] },
        events: [],
        earnings: { royalties: 0, services: 0, totalNetworkRevenue: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadControlData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Franchises & Analyze Network
                const franchises = await userService.fetchFranchises();
                const networkStats = franchises.reduce((acc, f) => {
                    const margin = f.metrics?.margin || 0;
                    if (margin > 20) acc.excellent++;
                    else if (margin > 10) acc.acceptable++;
                    else acc.critical++;
                    return acc;
                }, { excellent: 0, acceptable: 0, critical: 0 });

                // 2. Fetch Pending Financial Records
                const pendingRecords = await financeService.getGlobalPendingRecords();

                // 3. Fetch Pending Tickets (Real-time or simple fetch)
                const ticketsQuery = query(
                    collection(db, "tickets"),
                    where("status", "in", ["open", "investigating", "pending_admin"])
                );
                const ticketsSnap = await getDocs(ticketsQuery);
                const allTickets = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

                const premiumTickets = allTickets.filter(t => t.category === 'premium');
                const standardTickets = allTickets.filter(t => t.category !== 'premium');

                // 4. Fetch Unread System Alerts
                const alertsQuery = query(
                    collection(db, "admin_notifications"),
                    where("read", "==", false)
                );
                const alertsSnap = await getDocs(alertsQuery);
                const unreadAlerts = alertsSnap.docs.length;

                // 5. Fetch Events for current week
                const upcomingEvents = await intelService.getIntelForWeek(new Date());

                // 6. Calculate Earnings (Current Month)
                const monthKey = format(new Date(), 'yyyy-MM');
                const summariesQuery = query(
                    collection(db, "financial_summaries"),
                    where("month", "==", monthKey)
                );
                const summariesSnap = await getDocs(summariesQuery);
                const summaries = summariesSnap.docs.map(doc => doc.data() as any);

                const totalNetworkRevenue = summaries.reduce((acc, s) => acc + (s.revenue || 0), 0);
                const royalties = totalNetworkRevenue * 0.05;

                // Services revenue: Aggregate from premium tickets or specific records
                // For now, let's assume services are part of 'income' category 'consultoria' in records
                const servicesRevenue = summaries.reduce((acc, s) => {
                    const consultoria = s.breakdown?.consultoria || 0;
                    const premium = s.breakdown?.premium || 0;
                    return acc + consultoria + premium;
                }, 0);

                if (isMounted) {
                    setData({
                        network: {
                            total: franchises.length,
                            ...networkStats,
                            franchises: franchises.sort((a, b) => (a.metrics?.margin || 0) - (b.metrics?.margin || 0))
                        },
                        pending: {
                            total: standardTickets.length + premiumTickets.length + pendingRecords.length + unreadAlerts,
                            tickets: standardTickets.length,
                            premium: premiumTickets.length,
                            records: pendingRecords.length,
                            alerts: unreadAlerts,
                            list: [
                                ...standardTickets.map(t => ({ id: t.id, type: 'ticket', title: t.subject, subtitle: t.email, priority: t.urgency })),
                                ...premiumTickets.map(t => ({ id: t.id, type: 'premium', title: t.subject, subtitle: 'Solicitud Premium', priority: 'high' })),
                                ...pendingRecords.map(r => ({ id: r.id, type: 'record', title: 'Cierre Mensual', subtitle: `Franquicia: ${r.franchise_id}`, priority: 'normal' }))
                            ].slice(0, 10)
                        },
                        events: upcomingEvents,
                        earnings: {
                            royalties,
                            services: servicesRevenue,
                            totalNetworkRevenue
                        }
                    });
                    setLoading(false);
                }
            } catch (err: any) {
                console.error("Error loading admin control data:", err);
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        loadControlData();

        return () => { isMounted = false; };
    }, []);

    return { data, loading, error };
};
