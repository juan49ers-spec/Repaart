import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { financeService } from '../services/financeService';
import { franchiseService } from '../services/franchiseService';
import { intelService, IntellectualEvent } from '../services/intelService';
import { format } from 'date-fns';
import { Ticket } from '../types/support';

export interface PendingAction {
    id: string;
    type: 'ticket' | 'premium' | 'record' | 'alert';
    title: string;
    subtitle: string;
    priority: string;
}

export interface Franchise {
    id: string;
    name: string;
    metrics?: {
        margin: number;
        revenue?: number;
    };
    [key: string]: any;
}

export interface FinancialSummary {
    id?: string;
    franchiseId?: string;
    month?: string;
    revenue?: number;
    totalIncome?: number;
    expenses?: number | any; // Could be object or number depending on legacy
    totalExpenses?: number;
    breakdown?: {
        consultoria?: number;
        premium?: number;
        [key: string]: number | undefined;
    };
    [key: string]: any;
}

export interface AdminControlData {
    network: {
        total: number;
        excellent: number;
        acceptable: number;
        critical: number;
        franchises: Franchise[];
    };
    pending: {
        total: number;
        tickets: number;
        premium: number;
        records: number;
        alerts: number;
        list: PendingAction[];
    };
    events: IntellectualEvent[];
    earnings: {
        royalties: number;
        services: number;
        totalNetworkRevenue: number;
    };
}

export const useAdminControl = (monthKey?: string) => {
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
                // Switch to franchiseService to match IDs with Financial Summaries
                const result = await franchiseService.getAllFranchises();
                const franchises: Franchise[] = (result.success) ? result.data : [];

                const franchiseMap = new Map(franchises.map(f => [f.id, f.name]));
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
                const allTickets = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));

                const premiumTickets = allTickets.filter((t: Ticket) => t.category === 'premium');
                const standardTickets = allTickets.filter((t: Ticket) => t.category !== 'premium');

                // 4. Fetch Unread System Alerts
                const alertsQuery = query(
                    collection(db, "admin_notifications"),
                    where("read", "==", false)
                );
                const alertsSnap = await getDocs(alertsQuery);
                const unreadAlerts = alertsSnap.docs.length;

                // 5. Fetch Events for current week
                const upcomingEvents = await intelService.getIntelForWeek(new Date());

                // 6. Calculate Earnings (Target Month)
                const activeMonthKey = monthKey || format(new Date(), 'yyyy-MM');
                const summariesQuery = query(
                    collection(db, "financial_summaries"),
                    where("month", "==", activeMonthKey)
                );
                const summariesSnap = await getDocs(summariesQuery);
                const summaries: FinancialSummary[] = summariesSnap.docs.map(doc => {
                    const d = doc.data();
                    // Robustness: Extract franchiseId from doc.id if missing in body
                    // DocID convention: {franchiseId}_{yyyy-MM}
                    let fid = d.franchiseId;
                    if (!fid && doc.id.includes('_')) {
                        // Attempt to strip the month suffix
                        if (doc.id.endsWith(`_${activeMonthKey}`)) {
                            fid = doc.id.slice(0, -(activeMonthKey.length + 1));
                        } else {
                            // Fallback splitting (risky if ID has underscores, but better than nothing)
                            const parts = doc.id.split('_');
                            parts.pop(); // remove date
                            fid = parts.join('_');
                        }
                    }
                    // Normalize ID
                    return { ...d, franchiseId: fid ? String(fid).trim() : fid, _debugId: doc.id } as FinancialSummary;
                });

                // --- Calculate Global Financials ---
                const totalNetworkRevenue = summaries.reduce((acc, s) => acc + (s.revenue || s.totalIncome || 0), 0);
                const royalties = totalNetworkRevenue * 0.05;

                // Services revenue: Aggregate from premium tickets or specific records
                const servicesRevenue = summaries.reduce((acc, s) => {
                    const consultoria = s.breakdown?.consultoria || 0;
                    const premium = s.breakdown?.premium || 0;
                    return acc + consultoria + premium;
                }, 0);

                const financialMap = new Map<string, FinancialSummary>();
                summaries.forEach(s => {
                    if (s.franchiseId) {
                        financialMap.set(String(s.franchiseId).trim(), s);
                    }
                });

                if (isMounted) {
                    setData({
                        network: {
                            total: franchises.length,
                            ...networkStats,
                            franchises: franchises.map(f => {
                                const summary = financialMap.get(f.id);
                                let margin = f.metrics?.margin || 0; // Fallback to user-stored metric

                                if (summary) {
                                    const revenue = summary.revenue || summary.totalIncome || 0;
                                    const expense = (typeof summary.expenses === 'number' ? summary.expenses : summary.totalExpenses) || 0;
                                    const profit = revenue - expense;

                                    // Calculate real-time margin for the selected month
                                    if (revenue > 0) {
                                        margin = (profit / revenue) * 100;
                                    } else {
                                        margin = 0;
                                    }
                                }

                                const finalRevenue = summary ? (summary.revenue || summary.totalIncome || 0) : 0;
                                // console.log(`[DEBUG] Franchise ${f.id} Revenue:`, finalRevenue);

                                return {
                                    ...f,
                                    metrics: {
                                        ...f.metrics,
                                        margin, // Override with calculated margin
                                        revenue: finalRevenue
                                    }
                                };
                            }).sort((a, b) => (a.metrics?.margin || 0) - (b.metrics?.margin || 0))
                        },
                        pending: {
                            total: standardTickets.length + premiumTickets.length + pendingRecords.length + unreadAlerts,
                            tickets: standardTickets.length,
                            premium: premiumTickets.length,
                            records: pendingRecords.length,
                            alerts: unreadAlerts,
                            list: [
                                ...standardTickets.map(t => ({ id: t.id as string, type: 'ticket' as const, title: t.subject, subtitle: t.email || 'Sin email', priority: t.urgency || 'low' })),
                                ...premiumTickets.map(t => ({ id: t.id as string, type: 'premium' as const, title: t.subject, subtitle: 'Solicitud Premium', priority: 'high' })),
                                ...pendingRecords.map(r => ({
                                    id: r.id,
                                    type: 'record' as const,
                                    title: 'Cierre Mensual',
                                    subtitle: `Sede: ${franchiseMap.get(r.franchise_id) || r.franchise_id}`,
                                    priority: 'normal'
                                }))
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
            } catch (err: unknown) {
                console.error("Error loading admin control data:", err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Error cargando datos de control');
                    setLoading(false);
                }
            }
        };

        loadControlData();

        return () => { isMounted = false; };
    }, [monthKey]);

    return { data, loading, error };
};
