import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CreateInvoiceRequest, Invoice } from '../types/invoicing';

export type { Invoice };

// Backward compatibility type alias for deprecated components
export type FranchiseRestaurant = any;

export const useInvoicing = () => {
    const { user } = useAuth();

    const createRestaurant = async (data: any) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId || ''
        };
        const fn = httpsCallable(functions, 'createRestaurant');
        return fn(payload);
    };

    const getRestaurants = async (franchiseId: string) => {
        const fn = httpsCallable(functions, 'getRestaurants');
        const result = await fn({ franchiseId });
        return (result.data as any).restaurants as any[];
    };

    const generateInvoice = async (data: CreateInvoiceRequest) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId || ''
        };
        const fn = httpsCallable(functions, 'generateInvoice');
        return fn(payload);
    };

    const getInvoices = async (franchiseId: string) => {
        console.log('[useInvoicing] Fetching invoices for franchiseId:', franchiseId);
        const fn = httpsCallable(functions, 'getInvoices');
        const result = await fn({ franchiseId });
        return (result.data as any).invoices as Invoice[];
    };

    const getFranchises = async () => {
        try {
            const getFranchisesFn = httpsCallable<{ franchiseId: string }, { franchises: any[] }>(functions, 'getFranchises');
            const result = await getFranchisesFn({ franchiseId: user?.uid || '' });
            return result.data.franchises;
        } catch (error) {
            console.error('Error fetching franchises:', error);
            throw error;
        }
    };

    const updateRestaurant = async (data: any) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId || ''
        };
        const fn = httpsCallable(functions, 'updateRestaurant');
        return fn(payload);
    };

    const deleteRestaurant = async (data: { id: string, franchiseId: string }) => {
        const payload = {
            ...data,
            franchiseId: data.franchiseId
        };
        const fn = httpsCallable(functions, 'deleteRestaurant');
        return fn(payload);
    };

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
