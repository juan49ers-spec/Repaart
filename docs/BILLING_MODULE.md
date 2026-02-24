# Módulo de Facturación y Tesorería - Repaart v3.0

## Descripción General

Este módulo implementa un sistema completo de facturación y gestión de tesorería para Repaart v3.0, diseñado con una arquitectura transaccional, estricta segregación de dominios y cumplimiento normativo europeo.

## Características Principales

### 1. Motor de Facturación Inmutable (Server-Side)

- **Estados de Factura**: DRAFT (editable), ISSUED (inmutable), RECTIFIED (anulada)
- **Generación de PDF**: Exclusivamente en backend al transicionar a ISSUED
- **Numeración Legal**: Series automáticas (ej. "2026-A", "R-2026-A")
- **Rectificación Transaccional**: Creación automática de facturas rectificativas

### 2. Integración de Tarifas Logísticas

- **Cálculo Dinámico**: Basado en rangos de distancia (0-4km, 4-5km, etc.)
- **Múltiples Tipos Impositivos**: Soporte para diferentes tasas de IVA en una misma factura
- **Inyección de Conceptos**: Generación automática de líneas de factura desde datos de entregas

### 3. Gestor de Cobros y Tesorería

- **Estados de Pago**: PENDING, PARTIAL, PAID
- **Registro de Recibos**: PaymentReceipt con evidencia documental
- **Dashboard de Deuda Viva**: Separación entre deuda "Al día" y "Vencida" (>30 días)

### 4. Puente Fiscal (Tax Vault & Ledger)

- **Observador Fiscal**: Agregación automática de impuestos al emitir facturas
- **Cierre Mensual**: Wizard con bloqueos a nivel de base de datos
- **Sumatorio Inmutable**: Prohibición de entrada manual de ingresos

## Arquitectura

```
src/services/billing/
├── invoiceEngine.ts          # Motor de facturación inmutable
├── logisticsBillingEngine.ts # Cálculo de tarifas logísticas
├── accountsReceivable.ts     # Gestión de cobros y deuda
├── taxVault.ts              # Puente fiscal y cierre mensual
├── controllers/
│   └── billingController.ts  # Controladores y rutas API
└── index.ts                 # Exportaciones del módulo

src/types/invoicing.ts       # Tipos del dominio de facturación

src/schemas/invoicing/
└── index.ts                 # Esquemas de validación Zod
```

## Uso del Módulo

### Crear una Factura

```typescript
import { billingController } from '@/services/billing';

const request: CreateInvoiceRequest = {
    franchiseId: 'franchise_123',
    customerId: 'customer_456',
    customerType: 'RESTAURANT',
    items: [
        {
            description: 'Servicio de logística - Rango 0-4km',
            quantity: 100,
            unitPrice: 2.50,
            taxRate: 0.21
        }
    ]
};

const result = await billingController.createInvoice(request, userId);
if (result.success) {
    console.log('Factura creada:', result.data);
}
```

### Emitir una Factura

```typescript
const issueRequest: IssueInvoiceRequest = {
    invoiceId: 'invoice_789',
    issuedBy: userId
};

const result = await billingController.issueInvoice(issueRequest);
if (result.success) {
    console.log('Factura emitida:', result.data);
    // PDF generado automáticamente y almacenado
}
```

### Rectificar una Factura

```typescript
const rectifyRequest: RectifyInvoiceRequest = {
    invoiceId: 'invoice_789',
    reason: 'Error en cantidad',
    rectifiedBy: userId
};

const result = await billingController.rectifyInvoice(rectifyRequest);
if (result.success) {
    console.log('Factura rectificada:', result.data);
}
```

### Calcular Tarifas Logísticas

```typescript
const billingRequest: CalculateBillingRequest = {
    franchiseId: 'franchise_123',
    customerId: 'customer_456',
    customerType: 'RESTAURANT',
    period: {
        start: '2026-01-01T00:00:00Z',
        end: '2026-01-31T23:59:59Z'
    },
    logisticsRates: [
        { id: 'range_0_4', name: '0-4km', minKm: 0, maxKm: 4, pricePerUnit: 2.50 }
    ]
};

const result = await billingController.calculateBilling(billingRequest);
if (result.success) {
    console.log('Cálculo:', result.data);
}
```

### Registrar un Pago

```typescript
const paymentRequest: AddPaymentRequest = {
    invoiceId: 'invoice_789',
    amount: 250.00,
    paymentMethod: 'TRANSFER',
    reference: 'REF-12345'
};

const result = await billingController.addPayment(paymentRequest, userId);
if (result.success) {
    console.log('Pago registrado:', result.data);
}
```

### Generar Dashboard de Deuda

```typescript
const result = await billingController.getDebtDashboard('franchise_123');
if (result.success) {
    console.log('Deuda total:', result.data.totalDebt);
    console.log('Deuda vencida:', result.data.totalOverdueDebt);
}
```

### Ejecutar Cierre Mensual

```typescript
const closeRequest: MonthlyCloseRequest = {
    franchiseId: 'franchise_123',
    period: '2026-01',
    requestedBy: userId
};

const result = await billingController.executeMonthlyClose(closeRequest);
if (result.success) {
    console.log('Cierre mensual completizado:', result.data);
}
```

## Modelos de Datos

### Invoice

```typescript
interface Invoice {
    id: string;
    franchiseId: string;
    series: string;                    // "2026-A"
    number: number;                    // 1234
    fullNumber: string;                // "2026-A/1234"
    status: InvoiceStatus;             // DRAFT | ISSUED | RECTIFIED
    paymentStatus: PaymentStatus;      // PENDING | PARTIAL | PAID
    customerSnapshot: CustomerSnapshot;
    issuerSnapshot: IssuerSnapshot;
    lines: InvoiceLine[];
    subtotal: number;
    taxBreakdown: TaxBreakdown[];
    total: number;
    remainingAmount: number;
    pdfUrl?: string;
}
```

### PaymentReceipt

```typescript
interface PaymentReceipt {
    id: string;
    franchiseId: string;
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: Date;
    reference?: string;
    customerSnapshot: CustomerSnapshot;
}
```

### TaxVaultEntry

```typescript
interface TaxVaultEntry {
    id: string;
    franchiseId: string;
    period: string;                    // "2026-01"
    ivaRepercutido: number;
    ivaSoportado: number;
    irpfReserva: number;
    isLocked: boolean;
    invoiceIds: string[];
    expenseRecordIds?: string[];
}
```

## API Endpoints

### Facturación

- `POST /invoices` - Crear factura borrador
- `POST /invoices/:id/issue` - Emitir factura
- `POST /invoices/:id/rectify` - Rectificar factura
- `GET /invoices/:id` - Obtener factura
- `GET /invoices` - Listar facturas

### Pagos

- `POST /payments` - Registrar pago
- `GET /payments/:id` - Obtener pago
- `GET /invoices/:id/payments` - Listar pagos de factura

### Tesorería

- `GET /debt/dashboard` - Dashboard de deuda
- `GET /debt/customer/:id` - Deuda por cliente

### Fiscal

- `POST /billing/calculate` - Calcular tarifas
- `POST /tax-vault/monthly-close` - Ejecutar cierre mensual
- `GET /tax-vault/:period` - Obtener entrada fiscal

## Consideraciones de Seguridad

1. **Inmutabilidad**: Las facturas emitidas son de solo lectura
2. **Transaccionalidad**: Todas las operaciones críticas usan transacciones ACID
3. **Audit Trail**: Todas las operaciones registran usuario y timestamp
4. **Bloqueos Mensuales**: Los períodos cerrados no pueden modificarse
5. **Validación**: Todos los inputs se validan con Zod

## Próximos Pasos

1. Implementar generación de PDF con jspdf o pdfkit
2. Crear tests unitarios para todos los servicios
3. Implementar Firebase Cloud Functions para los endpoints
4. Crear componentes de React para la UI de facturación
5. Implementar notificaciones de vencimientos
6. Crear reportes financieros avanzados
