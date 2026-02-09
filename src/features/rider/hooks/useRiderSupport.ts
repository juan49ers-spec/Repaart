import { useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supportService, SupportTicket } from '../../support/SupportService';

export const useRiderSupport = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTickets = useCallback(async () => {
        if (!user?.uid) return;

        setIsLoading(true);
        setError(null);
        try {
            // First try to fetch by userId (new method)
            let fetchedTickets: SupportTicket[] = [];

            // If getRiderTickets exists on service (we added it), use it
            if ('getRiderTickets' in supportService) {
                fetchedTickets = await supportService.getRiderTickets(user.uid);
            } else {
                // Fallback or if using franchiseId logic (less secure for rider view)
                // For now, let's assume getRiderTickets is available as we added it
                console.warn('getRiderTickets not found in supportService');
                return;
            }

            setTickets(fetchedTickets);
        } catch (err: any) {
            console.error('Error fetching rider tickets:', err);
            setError('No se pudieron cargar los tickets. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid]);

    const createTicket = async (subject: string, category: SupportTicket['category'], message: string) => {
        const currentUser = user as any;
        if (!user?.uid || !currentUser?.franchiseId) {
            throw new Error('Usuario no identificado');
        }

        setIsLoading(true);
        try {
            await supportService.createTicket({
                userId: user.uid,
                franchiseId: currentUser.franchiseId,
                franchiseName: '', // Logic to get franchise name if needed, or backend handles it. Optional for now.
                subject,
                message,
                category,
                priority: 'normal',
                replies: []
            });

            // Refresh list
            await fetchTickets();
            return true;
        } catch (err: any) {
            console.error('Error creating ticket:', err);
            setError('Error al crear el ticket. Inténtalo de nuevo.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        tickets,
        isLoading,
        error,
        fetchTickets,
        createTicket
    };
};
