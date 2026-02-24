/**
 * Script para cargar datos de prueba en emuladores locales
 * 
 * Ejecutar: node scripts/seed-billing-data.js
 * 
 * Requiere: firebase emulators ejecutándose
 */

const admin = require('firebase-admin');

// Configurar para emuladores locales
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
  projectId: 'repaartfinanzas'
});

const db = admin.firestore();
const auth = admin.auth();

async function createTestData() {
  console.log('🚀 Creando datos de prueba...\n');

  try {
    // 1. Crear usuario admin
    console.log('1. Creando usuario admin...');
    const adminUser = await auth.createUser({
      uid: 'admin_test_123',
      email: 'admin@test.com',
      password: 'test123456',
      displayName: 'Admin Test'
    });
    
    await auth.setCustomUserClaims(adminUser.uid, {
      role: 'admin',
      admin: true
    });
    console.log('✅ Admin creado:', adminUser.uid);

    // 2. Crear usuario franchise
    console.log('\n2. Creando usuario franchise...');
    const franchiseUser = await auth.createUser({
      uid: 'franchise_test_123',
      email: 'franchise@test.com',
      password: 'test123456',
      displayName: 'Franquicia Test'
    });
    
    await auth.setCustomUserClaims(franchiseUser.uid, {
      role: 'franchise',
      franchiseId: 'franchise_test_123'
    });
    console.log('✅ Franchise creado:', franchiseUser.uid);

    // 3. Crear documento de usuario
    console.log('\n3. Creando documentos de usuario...');
    await db.collection('users').doc(adminUser.uid).set({
      email: 'admin@test.com',
      role: 'admin',
      admin: true,
      name: 'Admin Test',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await db.collection('users').doc(franchiseUser.uid).set({
      email: 'franchise@test.com',
      role: 'franchise',
      franchiseId: 'franchise_test_123',
      name: 'Franquicia Test',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Documentos de usuario creados');

    // 4. Crear customer (restaurante)
    console.log('\n4. Creando customer...');
    await db.collection('customers').doc('customer_test_123').set({
      fiscalName: 'Restaurante Test SL',
      cif: 'B12345678',
      email: 'restaurante@test.com',
      address: 'Calle Test 123, Madrid',
      phone: '+34 912345678',
      type: 'RESTAURANT',
      active: true,
      franchiseId: 'franchise_test_123',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Customer creado');

    // 5. Crear factura DRAFT
    console.log('\n5. Creando factura DRAFT...');
    await db.collection('invoices').doc('invoice_draft_123').set({
      franchiseId: 'franchise_test_123',
      customerId: 'customer_test_123',
      customerSnapshot: {
        fiscalName: 'Restaurante Test SL',
        cif: 'B12345678',
        email: 'restaurante@test.com'
      },
      status: 'DRAFT',
      paymentStatus: 'PENDING',
      invoiceType: 'STANDARD',
      series: '2026',
      number: 0,
      fullNumber: '',
      lines: [
        {
          id: 'line_1',
          description: 'Servicio de logística - Enero 2026',
          quantity: 100,
          unitPrice: 2.50,
          taxRate: 0.21,
          taxAmount: 52.50,
          subtotal: 250.00,
          total: 302.50
        }
      ],
      subtotal: 250.00,
      taxBreakdown: [
        {
          taxRate: 0.21,
          taxType: 'IVA',
          taxableBase: 250.00,
          taxAmount: 52.50
        }
      ],
      total: 302.50,
      totalPaid: 0,
      remainingAmount: 302.50,
      issueDate: null,
      dueDate: null,
      issuedAt: null,
      createdBy: 'admin_test_123',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Factura DRAFT creada');

    // 6. Crear factura ISSUED
    console.log('\n6. Creando factura ISSUED...');
    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días
    
    await db.collection('invoices').doc('invoice_issued_123').set({
      franchiseId: 'franchise_test_123',
      customerId: 'customer_test_123',
      customerSnapshot: {
        fiscalName: 'Restaurante Test SL',
        cif: 'B12345678',
        email: 'restaurante@test.com'
      },
      status: 'ISSUED',
      paymentStatus: 'PENDING',
      invoiceType: 'STANDARD',
      series: '2026-A',
      number: 1,
      fullNumber: '2026-A/0001',
      lines: [
        {
          id: 'line_1',
          description: 'Servicio de logística - Diciembre 2025',
          quantity: 150,
          unitPrice: 2.50,
          taxRate: 0.21,
          taxAmount: 78.75,
          subtotal: 375.00,
          total: 453.75
        }
      ],
      subtotal: 375.00,
      taxBreakdown: [
        {
          taxRate: 0.21,
          taxType: 'IVA',
          taxableBase: 375.00,
          taxAmount: 78.75
        }
      ],
      total: 453.75,
      totalPaid: 0,
      remainingAmount: 453.75,
      issueDate: now,
      dueDate: dueDate,
      issuedAt: now,
      issuedBy: 'admin_test_123',
      createdBy: 'admin_test_123',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Factura ISSUED creada');

    // 7. Crear factura PARTIALLY_PAID
    console.log('\n7. Creando factura PARTIALLY_PAID...');
    await db.collection('invoices').doc('invoice_partial_123').set({
      franchiseId: 'franchise_test_123',
      customerId: 'customer_test_123',
      customerSnapshot: {
        fiscalName: 'Restaurante Test SL',
        cif: 'B12345678',
        email: 'restaurante@test.com'
      },
      status: 'ISSUED',
      paymentStatus: 'PARTIAL',
      invoiceType: 'STANDARD',
      series: '2026-A',
      number: 2,
      fullNumber: '2026-A/0002',
      lines: [
        {
          id: 'line_1',
          description: 'Servicio de logística - Noviembre 2025',
          quantity: 200,
          unitPrice: 2.50,
          taxRate: 0.21,
          taxAmount: 105.00,
          subtotal: 500.00,
          total: 605.00
        }
      ],
      subtotal: 500.00,
      taxBreakdown: [
        {
          taxRate: 0.21,
          taxType: 'IVA',
          taxableBase: 500.00,
          taxAmount: 105.00
        }
      ],
      total: 605.00,
      totalPaid: 300.00,
      remainingAmount: 305.00,
      issueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      issuedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      issuedBy: 'admin_test_123',
      createdBy: 'admin_test_123',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Factura PARTIALLY_PAID creada');

    // 8. Crear factura VENCIDA (overdue)
    console.log('\n8. Creando factura VENCIDA...');
    const oldDueDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // -45 días
    
    await db.collection('invoices').doc('invoice_overdue_123').set({
      franchiseId: 'franchise_test_123',
      customerId: 'customer_test_123',
      customerSnapshot: {
        fiscalName: 'Restaurante Test SL',
        cif: 'B12345678',
        email: 'restaurante@test.com'
      },
      status: 'ISSUED',
      paymentStatus: 'PENDING',
      invoiceType: 'STANDARD',
      series: '2025-A',
      number: 99,
      fullNumber: '2025-A/0099',
      lines: [
        {
          id: 'line_1',
          description: 'Servicio de logística - Octubre 2025',
          quantity: 80,
          unitPrice: 2.50,
          taxRate: 0.21,
          taxAmount: 42.00,
          subtotal: 200.00,
          total: 242.00
        }
      ],
      subtotal: 200.00,
      taxBreakdown: [
        {
          taxRate: 0.21,
          taxType: 'IVA',
          taxableBase: 200.00,
          taxAmount: 42.00
        }
      ],
      total: 242.00,
      totalPaid: 0,
      remainingAmount: 242.00,
      issueDate: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
      dueDate: oldDueDate,
      issuedAt: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
      issuedBy: 'admin_test_123',
      createdBy: 'admin_test_123',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Factura VENCIDA creada');

    console.log('\n✨ ¡Datos de prueba creados exitosamente!\n');
    console.log('📋 Resumen:');
    console.log('   - 2 usuarios (admin + franchise)');
    console.log('   - 1 customer (restaurante)');
    console.log('   - 4 facturas (DRAFT, ISSUED, PARTIAL, OVERDUE)');
    console.log('\n🔐 Credenciales:');
    console.log('   Admin: admin@test.com / test123456');
    console.log('   Franchise: franchise@test.com / test123456');
    console.log('\n🌐 URLs:');
    console.log('   App: http://localhost:5173');
    console.log('   Firebase UI: http://localhost:4000');
    console.log('   Billing: http://localhost:5173/billing');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

createTestData();
