# 🚀 Guía de Despliegue - Módulo de Facturación y Tesorería

## 📋 Checklist Pre-Despliegue

### 1. Verificación de Código

```bash
# Ejecutar type-check
npm run type-check
# ✅ Debe mostrar 0 errores en archivos de producción

# Ejecutar tests
npm run test:unit -- billing/
# ✅ Todos los tests deben pasar

# Ejecutar lint
npm run lint
# ✅ No errores críticos
```

### 2. Configuración de Firebase

```bash
# Autenticarse
firebase login

# Seleccionar proyecto
firebase use your-production-project-id

# Verificar configuración
firebase functions:config:get
```

### 3. Configurar Variables de Entorno

```bash
# Configurar logo URL
firebase functions:config:set billing.logo_url="https://your-domain.com/logo.png"

# Configurar emails
firebase functions:config:set \
  billing.email_from="noreply@repaart.com" \
  billing.email_reply="info@repaart.com"

# Configurar.timezone
firebase functions:config:set billing.timezone="Europe/Madrid"
```

---

## 🔧 Configuración de Firebase Storage

### 1. Habilitar Firebase Storage

```bash
firebase storage --project your-production-project-id
```

### 2. Crear archivo `cors.json`

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

### 3. Aplicar reglas CORS

```bash
# Instalar gsutil si no está instalado
# Windows: Descargar desde https://gsutil.net/

# Aplicar CORS
gsutil cors set cors.json gs://your-production-project-id.appspot.com
```

### 4. Crear directorio de invoices

```bash
# Opcional: El directorio se crea automáticamente
# Pero puedes verificar con:
gsutil ls gs://your-production-project-id.appspot.com/invoices
```

---

## 📦 Despliegue de Cloud Functions

### 1. Instalar Dependencias

```bash
cd functions
npm install --save-dev firebase-functions@latest
npm install --save firebase-admin@latest
npm install jspdf jspdf-autotable
```

### 2. Configurar TypeScript

```bash
# Asegurarse de que tsconfig.json está configurado correctamente
cat functions/tsconfig.json
```

### 3. Desplegar Todas las Funciones

```bash
# Desde el directorio raíz
firebase deploy --only functions
```

### 4. Desplegar Funciones Específicas

```bash
# Solo función de PDF
firebase deploy --only functions:generateInvoicePdf

# Solo función de sincronización
firebase deploy --only functions:syncInvoiceToTaxVault

# Solo tareas programadas
firebase deploy --only functions:cleanupDraftInvoices,sendPaymentReminders
```

### 5. Verificar Despliegue

```bash
# Ver funciones desplegadas
firebase functions:list

# Ver logs en tiempo real
firebase functions:log --only generateInvoicePdf
```

---

## ✅ Pruebas Post-Despliegue

### 1. Probar Generación de PDF

```javascript
// Desde Firebase Console o usando el SDK
const invoiceRef = await db.collection('invoices').add({
  franchiseId: 'test_franchise',
  customerId: 'test_customer',
  customerType: 'RESTAURANT',
  status: 'DRAFT',
  lines: [{
    description: 'Test Service',
    quantity: 1,
    unitPrice: 100,
    taxRate: 0.21,
    amount: 100,
    taxAmount: 21,
    total: 121
  }],
  subtotal: 100,
  taxBreakdown: [{ taxRate: 0.21, taxableBase: 100, taxAmount: 21 }],
  total: 121,
  remainingAmount: 121,
  totalPaid: 0,
  paymentStatus: 'PENDING',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  customerSnapshot: {
    fiscalName: 'Test Customer',
    cif: 'B12345678'
  },
  issuerSnapshot: {
    fiscalName: 'Test Issuer',
    cif: 'A87654321',
    address: {
      street: 'Test Street',
      city: 'Madrid',
      zipCode: '28001',
      province: 'Madrid',
      country: 'España'
    },
    email: 'test@issuer.com'
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});

// Esperar 5 segundos
await new Promise(resolve => setTimeout(resolve, 5000));

// Emitir factura
await invoiceRef.update({
  status: 'ISSUED',
  series: '2026-A',
  number: 1,
  fullNumber: '2026-A/0001',
  issuedAt: admin.firestore.FieldValue.serverTimestamp()
});

// Esperar a que se genere el PDF (10-15 segundos)
await new Promise(resolve => setTimeout(resolve, 15000));

// Verificar que se generó el PDF
const invoice = await invoiceRef.get();
console.log('PDF URL:', invoice.data().pdfUrl);
```

### 2. Probar Tax Vault Sync

```bash
# Ver logs
firebase functions:log --only syncInvoiceToTaxVault

# Verificar en Firestore
# → Ir a colección "tax_vault"
# → Buscar documento "{franchiseId}_2026-01"
# → Verificar que ivaRepercutido se incrementó
```

### 3. Probar Tareas Programadas

```bash
# Ver logs de cleanup
firebase functions:log --only cleanupDraftInvoices

# Ver logs de reminders
firebase functions:log --only sendPaymentReminders
```

---

## 🔐 Configuración de Seguridad

### 1. Reglas de Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar rol de admin
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Facturas: Los dueños pueden leer, admins pueden escribir
    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() && 
        (resource.data.franchiseId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.franchiseId 
         || isAdmin());
      allow write: if isAdmin();
    }
    
    // Tax Vault: Solo admins
    match /tax_vault/{vaultId} {
      allow read, write: if isAdmin();
    }
    
    // Payment Receipts: Los dueños pueden leer, admins pueden escribir
    match /payment_receipts/{receiptId} {
      allow read: if isAuthenticated() && 
        (resource.data.franchiseId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.franchiseId 
         || isAdmin());
      allow write: if isAdmin();
    }
  }
}
```

### 2. Reglas de Storage

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /invoices/{franchiseId}/{allPaths} {
    // Permitir lectura a usuarios autenticados
    allow read: if request.auth != null;
    
    // Solo las funciones pueden escribir
    allow write: if false;
  }
}
```

---

## 📊 Monitoreo

### 1. Configurar Alerts

```bash
# Ir a Firebase Console
# → Firestore → Triggers
# → Configurar alertas para:
#   - Fallos en funciones
#   - Errores de generación de PDF
#   - Tax Vault locked (warnings)
```

### 2. Métricas Clave

Monitorea estas métricas:

- **PDF Generation Success Rate**: >99%
- **PDF Generation Time**: <3 segundos
- **Tax Vault Sync Success Rate**: >99%
- **Scheduled Function Execution**: 100%

### 3. Logs

```bash
# Ver logs recientes
firebase functions:log --only generateInvoicePdf --limit 10

# Ver logs en tiempo real
firebase functions:log --only generateInvoicePdf --tail
```

---

## 🐛 Solución de Problemas

### PDF no se genera

```bash
# 1. Verificar que el estado cambió de DRAFT a ISSUED
firebase firestore:documents get invoices/{invoiceId}

# 2. Ver logs de la función
firebase functions:log --only generateInvoicePdf

# 3. Verificar que el PDF existe en Storage
gsutil ls gs://your-bucket.appspot.com/invoices/{franchiseId}/{period}/

# 4. Si existe, verificar URL en invoice.pdfUrl
```

### Tax Vault no se actualiza

```bash
# 1. Verificar que el mes no está bloqueado
firebase firestore:documents get tax_vault/{franchiseId}_{period}

# 2. Ver logs
firebase functions:log --only syncInvoiceToTaxVault

# 3. Sincronizar manualmente si es necesario
# → Usar el SDK para llamar a taxVaultObserver.onInvoiceIssued()
```

### Funciones fallan

```bash
# 1. Verificar variables de entorno
firebase functions:config:get

# 2. Verificar permisos de la cuenta de servicio
gcloud iam service-accounts list

# 3. Verificar cuotas
gcloud functions describe generateInvoicePdf --region europe-west1
```

---

## 📈 Optimización de Costos

### 1. Reducir Invocaciones

```javascript
// Agrupar actualizaciones en batch
const batch = db.batch();
batch.update(ref1, data1);
batch.update(ref2, data2);
await batch.commit();
```

### 2. Optimizar PDFs

```javascript
// Reducir calidad de imágenes
doc.addImage(logoUrl, 'PNG', x, y, width, height, 'FAST');

// Usar fuentes estándar (no incrustar)
doc.setFont('helvetica'); // Más rápido que fuentes custom
```

### 3. Almacenamiento

```bash
# Configurar lifecycle para archivos antiguos
gsutil lifecycle set lifecycle.json gs://your-bucket

# lifecycle.json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 2555  // 7 años (requisito legal)
        }
      }
    ]
  }
}
```

---

## 🎯 Checklist Final de Producción

- [ ] TypeScript sin errores
- [ ] Tests unitarios pasando
- [ ] Firebase Functions desplegadas
- [ ] Storage configurado con CORS
- [ ] Variables de entorno configuradas
- [ ] Reglas de Firestore aplicadas
- [ ] Reglas de Storage aplicadas
- [ ] Probar generación de PDF
- [ ] Verificar Tax Vault sync
- [ ] Configurar monitoreo y alertas
- [ ] Documentar procedimientos de emergencia
- [ ] Formar al equipo en el uso del módulo

---

## ✨ ¡Felicidades!

El módulo de facturación y tesorería está ahora en producción. El sistema está diseñado para:
- ✅ Manejar miles de transacciones diarias
- ✅ Mantener la integridad de los datos
- ✅ Cumplir con la normativa europea
- ✅ Escalar horizontalmente
- ✅ Proporcionar auditoría completa

**El módulo está listo para usar en Repaart v3.0.** 🎉
