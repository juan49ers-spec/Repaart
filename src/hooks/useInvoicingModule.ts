import { useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface InvoicingModuleStatus {
    enabled: boolean;
    activatedAt: Date | null;
}

interface RawInvoicingStatus {
    enabled?: boolean;
    activatedAt?: { _seconds: number; _nanoseconds: number } | { seconds: number; nanoseconds: number } | string | Date | null;
}

export const useInvoicingModule = () => {
    const toggleModule = useCallback(async (franchiseId: string, enabled: boolean) => {
        const fn = httpsCallable(functions, 'toggleInvoicingModule');
        const result = await fn({ franchiseId, enabled });
        return (result.data as { enabled: boolean }).enabled;
    }, []);

    const getModuleStatus = useCallback(async (franchiseId: string): Promise<InvoicingModuleStatus> => {
        const fn = httpsCallable(functions, 'getInvoicingModuleStatus');
        const result = await fn({ franchiseId });
        const data = result.data as RawInvoicingStatus;



        // Helper para parsear fechas de Firestore (pueden venir como string o como objeto {seconds, nanoseconds})
        const parseDate = (d: unknown): Date | null => {
            if (!d) return null;
            if (d instanceof Date) return d;
            if (typeof d === 'string') return new Date(d);

            // Manejo de Timestamps de Firestore serializados
            const dObj = d as Record<string, number>;
            if (dObj._seconds) return new Date(dObj._seconds * 1000);
            if (dObj.seconds) return new Date(dObj.seconds * 1000);

            const date = new Date(d as string | number);
            return isNaN(date.getTime()) ? null : date;
        };

        const status = {
            enabled: !!data?.enabled,
            activatedAt: parseDate(data?.activatedAt)
        };



        return status;
    }, []);

    return {
        toggleModule,
        getModuleStatus
    };
};
