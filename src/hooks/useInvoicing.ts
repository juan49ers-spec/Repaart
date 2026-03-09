import { useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CreateInvoiceRequest, Invoice } from '../types/invoicing';

export type { Invoice };

// Backward compatibility type alias for deprecated components
export type FranchiseRestaurant = unknown;

export const useInvoicing = () => {
    const { user } = useAuth();

    const createRestaurant = useCallback(async (data: { fiscalName: string, franchiseId?: string, [key: string]: unknown }) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId || ''
        };
        const fn = httpsCallable(functions, 'createRestaurant');
        return fn(payload);
    }, []);

    const getRestaurants = useCallback(async (franchiseId: string) => {
        const fn = httpsCallable(functions, 'getRestaurants');
        const result = await fn({ franchiseId });
        const data = result.data as { restaurants: unknown[] };
        return data.restaurants;
    }, []);

    const generateInvoice = useCallback(async (data: CreateInvoiceRequest) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId || ''
        };
        const fn = httpsCallable(functions, 'generateInvoice');
        return fn(payload);
    }, []);

    const getInvoices = useCallback(async (franchiseId: string) => {
        console.log('[useInvoicing] Fetching invoices for franchiseId:', franchiseId);
        const fn = httpsCallable(functions, 'getInvoices');
        const result = await fn({ franchiseId });
        const data = result.data as { invoices: Invoice[] };
        return data.invoices;
    }, []);

    const getFranchises = useCallback(async () => {
        try {
            const getFranchisesFn = httpsCallable<{ franchiseId: string }, { franchises: unknown[] }>(functions, 'getFranchises');
            const result = await getFranchisesFn({ franchiseId: user?.uid || '' });
            return result.data.franchises;
        } catch (error) {
            console.error('Error fetching franchises:', error);
            throw error;
        }
    }, [user]);

    const updateRestaurant = useCallback(async (data: { id: string, [key: string]: unknown }) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId || ''
        };
        const fn = httpsCallable(functions, 'updateRestaurant');
        return fn(payload);
    }, []);

    const deleteRestaurant = useCallback(async (data: { id: string, franchiseId: string }) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId
        };
        const fn = httpsCallable(functions, 'deleteRestaurant');
        return fn(payload);
    }, []);

    return {
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
        getRestaurants,
        generateInvoice,
        getInvoices,
        getFranchises
    };
};
