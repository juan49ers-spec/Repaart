import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { AdminInvoice } from '../../../../types/billing';

export const useAdminInvoices = () => {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'admin_invoices'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data();
          return { ...raw, id: doc.id } as AdminInvoice;
        }).filter(inv => inv.documentStatus !== 'deleted');
        setInvoices(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching admin invoices:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const refresh = () => {
    setLoading(true);
    // onSnapshot will handle the update automatically, 
    // but we can force a small delay to show the loading state for UX
    setTimeout(() => setLoading(false), 500);
  };

  return { invoices, loading, error, refresh };
};
