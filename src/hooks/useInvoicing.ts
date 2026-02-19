import { useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CreateInvoiceRequest, InvoiceDTO, FranchiseRestaurant } from '../types/invoicing';

export type { InvoiceDTO, FranchiseRestaurant };

export const useInvoicing = () => {
    const { user } = useAuth();

    const createRestaurant = useCallback(async (data: Partial<FranchiseRestaurant>) => {
        const fn = httpsCallable(functions, 'createRestaurant');
        return fn(data);
    }, []);

    const getRestaurants = useCallback(async (franchiseId: string) => {
        const fn = httpsCallable(functions, 'getRestaurants');
        const result = await fn({ franchiseId });
        return (result.data as any).restaurants as FranchiseRestaurant[];
    }, []);

    const generateInvoice = useCallback(async (data: CreateInvoiceRequest) => {
        const fn = httpsCallable(functions, 'generateInvoice');
        return fn(data);
    }, []);

    const getInvoices = useCallback(async (franchiseId: string) => {
        console.log('[useInvoicing] Fetching invoices for franchiseId:', franchiseId);
        const fn = httpsCallable(functions, 'getInvoices');
        const result = await fn({ franchiseId });
        return (result.data as any).invoices as InvoiceDTO[];
    }, []);

    const getFranchises = useCallback(async () => {
        try {
            const getFranchisesFn = httpsCallable<{ franchiseId: string }, { franchises: any[] }>(functions, 'getFranchises');
            const result = await getFranchisesFn({ franchiseId: user?.uid || '' });
            return result.data.franchises;
        } catch (error) {
            console.error('Error fetching franchises:', error);
            throw error;
        }
    }, [user?.uid]);

    return {
        createRestaurant,
        getRestaurants,
        generateInvoice,
        getInvoices,
        getFranchises
    };
};
