import { useState, useEffect } from 'react';
import { db } from '../../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { resourceRequestService } from '../../../../services/resourceRequestService';
import { ResourceItem } from '../domain/resource.types';

export const useAdminResources = () => {
    const [dbResources, setDbResources] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    useEffect(() => {
        let isSubscribed = true;
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!isSubscribed) return;
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceItem));
            setDbResources(fetched);
            setLoading(false);
            setError(null);
        }, (err) => {
            if (!isSubscribed) return;
            console.error("AdminResources - Error al obtener recursos: ", err);
            setError(err);
            setLoading(false);
            // Política de Fallo Seguro: mantener array vacío en vez de crashear
            setDbResources([]);
        });

        return () => {
            isSubscribed = false;
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        let isSubscribed = true;
        const fetchPending = async () => {
            try {
                const reqs = await resourceRequestService.getPendingRequests();
                if (isSubscribed) {
                    setPendingRequestsCount(reqs.length);
                }
            } catch (err) {
                console.error("AdminResources - Error al obtener solicitudes pendientes: ", err);
                if (isSubscribed) {
                    setPendingRequestsCount(0);
                }
            }
        };
        fetchPending();
        
        return () => {
            isSubscribed = false;
        };
    }, []);

    return {
        dbResources,
        loading,
        error,
        pendingRequestsCount,
        setPendingRequestsCount
    };
};
