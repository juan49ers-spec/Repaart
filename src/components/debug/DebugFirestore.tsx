import { db } from '../../lib/firebase';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';

export default function DebugFirestore() {
  useEffect(() => {
    // Exponer funciones de debug globalmente
    (window as any).testInvoiceCreate = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          console.error('❌ No hay usuario autenticado');
          return;
        }

        console.log('=== TEST DE PERMISOS FIRESTORE ===');
        console.log('Usuario:', user.email);
        console.log('UID:', user.uid);
        console.log('FranchiseID:', (user as any).franchiseId);

        const testInvoice = {
          franchiseId: user.uid,
          franchise_id: user.uid,
          customerId: 'TEST_CUSTOMER',
          customer_id: 'TEST_CUSTOMER',
          customerType: 'TEST',
          customer_type: 'TEST',
          series: 'TEST',
          number: 999,
          fullNumber: 'TEST_999',
          type: 'STANDARD',
          status: 'DRAFT',
          paymentStatus: 'PENDING',
          payment_status: 'PENDING',
          customerSnapshot: { name: 'Test Customer' },
          issuerSnapshot: { name: 'Test Issuer' },
          issueDate: new Date(),
          dueDate: new Date(),
          lines: [],
          subtotal: 0,
          taxBreakdown: {},
          total: 0,
          remainingAmount: 0,
          totalPaid: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        console.log('📝 Intentando crear factura de prueba...');
        console.log('Colección: invoices');
        console.log('Datos:', Object.keys(testInvoice));

        const docRef = await addDoc(collection(db, 'invoices'), testInvoice);

        console.log('✅ SUCCESS: Factura creada con ID:', docRef.id);
        console.log('🎉 Las reglas de Firestore funcionan correctamente');
        return docRef.id;

      } catch (error: any) {
        console.error('❌ ERROR: No se pudo crear factura');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        console.error('Error completo:', error);
        throw error;
      }
    };

    console.log('💡 DebugFirestore: Función testInvoiceCreate() disponible globalmente');
    console.log('   Ejecuta: testInvoiceCreate()');
  }, []);

  return null;
}
