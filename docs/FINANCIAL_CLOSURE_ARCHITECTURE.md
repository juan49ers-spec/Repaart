# Flujo de Cierre Financiero Inteligente - Documentación de Arquitectura

## 📋 Resumen Ejecutivo

El **Flujo de Cierre Financiero Inteligente** automatiza la reconciliación entre la operativa de franquicias y la facturación real. Este sistema elimina la entrada manual de datos propena a errores, proporcionando una experiencia de usuario donde los datos se sincronizan automáticamente desde las facturas.

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                  FINANCIAL CONTROL CENTER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  RevenueStep │  │  ExpensesStep│  │    Review    │      │
│  │   (Step 1)   │  │   (Step 2)   │  │   (Step 3)   │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
└─────────┼──────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              useFinancialDataLoad Hook                       │
│  - Carga datos existentes                                   │
│  - Obtiene datos de facturación                             │
│  - Calcula horas operativas                                 │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   INVOICE ENGINE                             │
│  ┌────────────────┐  ┌──────────────────┐                  │
│  │  ID Resolution │  │ Range Extraction │                  │
│  │   (Robust)     │  │   (Multi-modal)  │                  │
│  └────────────────┘  └──────────────────┘                  │
│  ┌────────────────┐  ┌──────────────────┐                  │
│  │ Date Filtering │  │ Order Reconstruction              │
│  │  (In-memory)   │  │   (Fallback)     │                  │
│  └────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     FIRESTORE                                │
│  • invoices (ISSUED status)                                 │
│  • orders_history (fallback)                                │
│  • financial_summaries (storage)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Flujo de Datos Detallado

### 1. Inicialización del Cierre

**Trigger**: Usuario abre "Cierre Financiero" para un mes específico

**Flujo**:
```typescript
// FinancialControlCenter.tsx
const { invoicedIncome, record, loading } = useFinancialDataLoad({
  franchiseId, 
  month 
});
```

### 2. Carga de Datos de Facturación

**Método**: `invoiceEngine.getInvoicedIncomeForMonth()`

#### 2.1 Resolución de ID (Robusta)

El sistema busca facturas usando múltiples identificadores:
- ID directo del documento (UID)
- Variaciones de case (lowercase, UPPERCASE, TitleCase)
- Campos: `franchiseId`, `uid`, `franchise_id`, `name`, `city`

**Ejemplo**:
```typescript
// Input: "benavente"
// Busca en: users.benavente, users.Benavente, users.BENAVENTE
// También: users.name == "Benavente", users.city == "Benavente"
```

#### 2.2 Filtrado de Facturas

Criterios:
- **Status**: `ISSUED` (emitidas, no borradores)
- **Fecha**: Dentro del rango del mes seleccionado
- **Campo fecha soportado**: `issueDate`, `issuedAt`, `issued_at`

**Nota**: El filtrado se hace en memoria para evitar requerir índices compuestos.

#### 2.3 Extracción de Datos de Pedidos

El sistema intenta extraer el desglose de pedidos en este orden:

**Método 1: logisticsData.ranges (Preferido)**
```typescript
// Estructura ideal en la factura
logisticsData: {
  ranges: [
    { id: "range_0_4", name: "0-4km", units: 200, pricePerUnit: 6.00 },
    { id: "range_4_5", name: "4-5km", units: 50, pricePerUnit: 7.00 }
  ],
  totalUnits: 250
}
```

**Método 2: Invoice lines con logisticsRange**
```typescript
lines: [
  { 
    description: "Servicio 0-4km", 
    logisticsRange: "range_0_4",
    units: 200 
  }
]
```

**Método 3: Parsing de descripción (Fallback inteligente)**

El sistema analiza el texto de la descripción usando múltiples patrones:

```typescript
// Patrones soportados:
/\d+\.?\d*-\d+\s*km/i      // "0-4km", "4.1-5 km"
/rango\s+\d+-\d+/i          // "rango 0-4"
/distancia\s+\d+-\d+/i      // "distancia 0-4"
/>\s*7\s*km/i               // ">7km"
/mas\s+de\s*7/i             // "mas de 7"
```

**Ejemplo real**:
```
Input: "Servicio logístico 0-4km (6.00€)"
Output: { "0-4 km": 200 }
```

**Método 4: Reconstrucción desde orders_history (Último recurso)**

Si ningún método anterior proporciona datos de pedidos, el sistema:
1. Consulta `orders_history` para el rango de fechas
2. Filtra pedidos con `status: 'finished'`
3. Clasifica por distancia en rangos estándar
4. Requiere índice Firestore: `(franchiseId, createdAt)`

```typescript
// Query necesario:
orders
  .where('franchiseId', '==', franchiseId)
  .where('createdAt', '>=', startDate)
  .where('createdAt', '<=', endDate)
```

**Creación del índice**:
```bash
# URL directo (aparece en error de consola)
https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...
```

#### 2.4 Normalización de Rangos

Todos los rangos extraídos se normalizan al formato estándar de UI:

```typescript
// Mapping de rangos
{
  'range_0_4': '0-4 km',
  'range_4_5': '4-5 km',
  'range_5_6': '5-6 km',
  'range_6_7': '6-7 km',
  'range_gt_7': '>7 km'
}

// Normalización de texto
Input: "4.1-5km", "4 - 5 km", "rango 4-5"
Output: "4-5 km"
```

### 3. Auto-Populación del Formulario

**Condición**: Solo ocurre si no existe un registro previo (`record` es null)

```typescript
// FinancialControlCenter.tsx - useEffect
if (!loading && invoicedIncome && !record) {
  // Mapear datos facturados a rangos activos
  const mappedOrders = mapInvoicedDataToRanges(invoicedIncome.ordersDetail);
  setOrders(mappedOrders);
  setTotalIncome(invoicedIncome.subtotal);
}
```

### 4. Sincronización Manual

**Trigger**: Usuario hace clic en "SINCRONIZAR TODO"

```typescript
// RevenueStep.tsx
const handleSyncFromInvoices = () => {
  setTotalIncome(invoicedIncome.subtotal);
  setOrders(prev => {
    // Smart merge manteniendo coincidencias de rangos
    const newOrders = { ...prev };
    Object.entries(invoicedIncome.ordersDetail).forEach(([range, count]) => {
      const match = findMatchingRange(range, activeRanges);
      if (match) newOrders[match] = count;
    });
    return newOrders;
  });
};
```

### 5. Indicadores de Discrepancia

El sistema muestra badges en cada campo:

- **🟢 Verde (✅)**: El valor manual coincide con el facturado
- **🟠 Ámbar (⚠️)**: Hay discrepancia entre manual y facturado

```typescript
const isMatch = (orders[range] || 0) === invoicedCount;
```

---

## 📊 Estructura de Datos

### Invoice (Firestore)

```typescript
interface Invoice {
  id: string;
  franchiseId: string;
  fullNumber: string;        // "2026-A/0002"
  status: 'ISSUED' | 'DRAFT' | 'RECTIFIED';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  issueDate: Timestamp;
  subtotal: number;
  total: number;
  
  // Opcional: Datos estructurados (preferido)
  logisticsData?: {
    ranges: Array<{
      id: string;           // "range_0_4"
      name: string;         // "0-4km"
      units: number;        // 200
      pricePerUnit: number; // 6.00
    }>;
  };
  
  // Alternativa: Líneas de factura
  lines?: Array<{
    description: string;    // "Servicio 0-4km (6.00€)"
    logisticsRange?: string;
    units: number;
    unitPrice: number;
  }>;
}
```

### InvoicedIncome (Retorno del Engine)

```typescript
interface InvoicedIncome {
  subtotal: number;        // 1200 (base imponible)
  total: number;           // 1452 (con IVA)
  ordersDetail: {
    "0-4 km": 200,
    "4-5 km": 50,
    // ...
  };
}
```

---

## 🛠️ Resolución de Problemas

### Problema: "No aparecen datos facturados"

**Causas comunes**:

1. **Factura en estado DRAFT**
   - Solución: Emitir la factura primero

2. **FranchiseId no coincide**
   - Verificar en consola: `[invoiceEngine] Processing: franchiseId=...`
   - Comparar con campo `franchiseId` de la factura en Firestore

3. **Fecha fuera de rango**
   - Verificar que `issueDate` esté dentro del mes del cierre
   - Formatos soportados: Timestamp, Date, ISO string

4. **Sin datos de rangos en la factura**
   - La factura debe tener `logisticsData` o `lines` con descripciones parseables
   - Ver en consola: `hasLogisticsData: true/false`, `hasLines: true/false`

### Problema: "Los pedidos aparecen en 'Otros'"

**Causa**: El sistema no pudo mapear el rango encontrado a un rango estándar.

**Solución**: Verificar que las descripciones sigan patrones reconocidos:
- ✅ "0-4km", "0 - 4 km", "4.1-5km"
- ✅ "rango 0-4", "distancia 0-4"
- ❌ "Servicio completo" (sin indicación de rango)

### Problema: "Error de índice en orders_history"

**Mensaje**: `FirebaseError: The query requires an index`

**Solución**:
1. Abrir el URL proporcionado en el error
2. Crear el índice compuesto: `(franchiseId, createdAt)`
3. Esperar a que el índice se active (puede tardar varios minutos)

### Problema: "Discrepancia persistente"

**Verificar**:
1. Tarifas de logística configuradas en el perfil de franquicia
2. Que las tarifas coincidan con los precios de la factura
3. Que los rangos estén configurados correctamente

---

## 🔧 Configuración Requerida

### Firestore Indexes

Necesarios para el funcionamiento óptimo:

```json
// financial_summaries
{
  "collectionGroup": "financial_summaries",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "franchiseId", "order": "ASCENDING" },
    { "fieldPath": "month", "order": "ASCENDING" }
  ]
}

// orders (para reconstruction fallback)
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "franchiseId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
}

// invoices
{
  "collectionGroup": "invoices",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "franchiseId", "order": "ASCENDING" }
  ]
}
```

### Perfil de Franquicia

Campos requeridos en el documento `users/{franchiseId}`:

```typescript
{
  franchiseId: string,    // ID único de franquicia
  logisticsRates: [       // Tarifas por rango
    { name: "0-4 km", min: 0, max: 4, price: 6.00 },
    { name: "4.1-5 km", min: 4.1, max: 5, price: 7.00 }
    // ...
  ]
}
```

---

## 📈 Mejoras Futuras Recomendadas

1. **Cache de consultas**: Implementar cache de 5 minutos para `getInvoicedIncomeForMonth`
2. **Validación en tiempo real**: Mostrar discrepancias mientras el usuario escribe
3. **Histórico de tarifas**: Soporte para cambios de tarifas dentro del mismo mes
4. **Notificaciones**: Alertar cuando hay facturas pendientes de conciliar
5. **Importación CSV**: Permitir importar datos operativos desde archivos externos

---

## 📚 Referencias de Código

### Archivos Principales

- `src/services/billing/invoiceEngine.ts` - Motor de detección y procesamiento
- `src/features/franchise/FinancialControlCenter.tsx` - Componente principal
- `src/features/franchise/finance/components/RevenueStep.tsx` - Paso de ingresos
- `src/features/franchise/finance/hooks/useFinancialDataLoad.ts` - Hook de carga de datos

### Funciones Clave

```typescript
// invoiceEngine.ts
getInvoicedIncomeForMonth(franchiseId, month)
  ├─ resolveFranchiseIds(franchiseId)
  ├─ queryInvoices(ids)
  ├─ extractOrderDetails(invoice)
  │   ├─ fromLogisticsData()
  │   ├─ fromLines()
  │   └─ fromDescriptionParsing()
  └─ reconstructFromOrders(fallback)

// RevenueStep.tsx  
handleSyncFromInvoices()
  ├─ setTotalIncome()
  └─ mergeOrderData()

// FinancialControlCenter.tsx
autoPopulateFromInvoices()
  ├─ checkExistingRecord()
  ├─ mapRanges()
  └─ setInitialState()
```

---

**Documento versión**: 1.0  
**Última actualización**: Febrero 2026  
**Mantenido por**: Equipo de Desarrollo Repaart