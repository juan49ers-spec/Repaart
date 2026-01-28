# @repaart/sdk

TypeScript SDK para la API de Repaart - Plataforma SaaS de Gestión Logística.

## 📦 Instalación

```bash
npm install @repaart/sdk
# o
yarn add @repaart/sdk
# o
pnpm add @repaart/sdk
```

## 🔧 Configuración

### Configuración Básica

```typescript
import { RepaartApi, Configuration } from '@repaart/sdk';

const config = new Configuration({
  basePath: 'https://repaartfinanzas.web.app',
  accessToken: async () => {
    // Obtén el token JWT de Firebase Auth
    const token = await getFirebaseAuthToken();
    return token;
  }
});

const api = new RepaartApi(config);
```

### Configuración con Firebase Auth

```typescript
import { getAuth } from 'firebase/auth';
import { RepaartApi, Configuration } from '@repaart/sdk';

// Configuración que refresca el token automáticamente
const config = new Configuration({
  basePath: 'https://repaartfinanzas.web.app',
  accessToken: async () => {
    const user = getAuth().currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error('User not authenticated');
  }
});

const api = new RepaartApi(config);
```

## 📚 API Usage

### Finance API

#### Listar Registros Financieros

```typescript
const records = await api.finance.listFinanceRecords({
  franchiseId: 'franchise_abc',
  month: '2026-01'
});

console.log(`Found ${records.length} records`);
```

#### Crear Registro Financiero

```typescript
const newRecord = await api.finance.createFinanceRecord({
  recordInput: {
    franchiseId: 'franchise_abc',
    type: 'income',
    amount: 1500.00,
    category: 'delivery_revenue',
    description: 'Weekly delivery revenue'
  }
});

console.log('Created record:', newRecord.id);
```

#### Actualizar Estado de Registro

```typescript
const updated = await api.finance.updateRecordStatus({
  recordId: 'rec_123',
  status: 'submitted'
});

console.log('Status updated to:', updated.status);
```

#### Obtener Resumen Mensual

```typescript
const summary = await api.finance.getMonthlySummary({
  franchiseId: 'franchise_abc',
  month: '2026-01'
});

console.log('Total Income:', summary.totalIncome);
console.log('Net Profit:', summary.netProfit);
console.log('Margin:', summary.margin, '%');
```

#### Bloquear Mes Financiero

```typescript
const locked = await api.finance.lockFinancialMonth({
  summaryId: 'summary_2026-01'
});

console.log('Month locked at:', locked.lockedAt);
```

#### Obtener Tendencias Financieras

```typescript
const trends = await api.finance.getFinancialTrends({
  franchiseId: 'franchise_abc'
});

trends.forEach(trend => {
  console.log(`${trend.month}: Income=${trend.income}, Profit=${trend.profit}`);
});
```

### Fleet API

#### Listar Riders

```typescript
const riders = await api.fleet.listRiders({
  franchiseId: 'franchise_abc'
});

riders.forEach(rider => {
  console.log(`${rider.fullName} - ${rider.status}`);
});
```

#### Crear Rider

```typescript
const rider = await api.fleet.createRider({
  riderData: {
    email: 'rider@example.com',
    password: 'securePass123',
    fullName: 'Juan Pérez',
    franchiseId: 'franchise_abc',
    contractHours: 40,
    phone: '+34600123456',
    licenseType: '125cc'
  }
});

console.log('Created rider:', rider.id);
```

#### Actualizar Rider

```typescript
await api.fleet.updateRider({
  riderId: 'rider_123',
  body: {
    fullName: 'Juan Pérez García',
    contractHours: 45
  }
});
```

#### Listar Vehículos

```typescript
const vehicles = await api.fleet.listVehicles({
  franchiseId: 'franchise_abc'
});

vehicles.forEach(vehicle => {
  console.log(`${vehicle.plate} - ${vehicle.brand} ${vehicle.model}`);
  console.log(`Status: ${vehicle.status}, KM: ${vehicle.currentKm}`);
});
```

#### Crear Vehículo

```typescript
const vehicle = await api.fleet.createVehicle({
  franchiseId: 'franchise_abc',
  createVehicleInput: {
    plate: '1234ABC',
    brand: 'Yamaha',
    model: 'NMAX 155',
    currentKm: 5000,
    nextRevisionKm: 10000
  }
});

console.log('Created vehicle:', vehicle.id);
```

### Academy API

#### Listar Cursos

```typescript
const courses = await api.academy.listCourses();

courses.forEach(course => {
  console.log(`${course.title} - ${course.level}`);
  console.log(`Duration: ${course.duration}, Lessons: ${course.lessonCount}`);
});
```

#### Crear Curso

```typescript
const course = await api.academy.createCourse({
  academyCourse: {
    title: 'Delivery Best Practices',
    description: 'Learn how to deliver efficiently',
    category: 'Operations',
    duration: '2 hours',
    level: 'beginner',
    status: 'active'
  }
});

console.log('Created course:', course.id);
```

#### Crear Lección

```typescript
const lesson = await api.academy.createLesson({
  lesson: {
    moduleId: 'course_123',
    title: 'Package Handling',
    content: '<h1>Package Handling</h1><p>Learn proper techniques...</p>',
    videoUrl: 'https://storage.googleapis.com/videos/package_handling.mp4',
    duration: 900,
    order: 1
  }
});

console.log('Created lesson:', lesson.id);
```

#### Obtener Progreso de Usuario

```typescript
const progress = await api.academy.getUserProgress({
  userId: 'user_abc'
});

Object.entries(progress).forEach(([courseId, data]) => {
  console.log(`Course ${courseId}:`);
  console.log(`  Status: ${data.status}`);
  console.log(`  Completed: ${data.completedLessons?.length || 0} lessons`);
  console.log(`  Quiz Score: ${data.quizScore}`);
});
```

#### Completar Lección

```typescript
await api.academy.completeLesson({
  lessonId: 'lesson_456',
  body: {
    userId: 'user_abc',
    moduleId: 'course_123'
  }
});
```

### Scheduler API

#### Listar Turnos

```typescript
const shifts = await api.scheduler.listShifts({
  franchiseId: 'franchise_abc',
  startDate: '2026-01-20',
  endDate: '2026-01-26',
  riderId: 'rider_123' // opcional
});

shifts.forEach(shift => {
  console.log(`${shift.riderName}: ${shift.startAt} - ${shift.endAt}`);
});
```

#### Crear Turno

```typescript
const shift = await api.scheduler.createShift({
  shiftInput: {
    franchiseId: 'franchise_abc',
    riderId: 'rider_123',
    riderName: 'Juan Pérez',
    motoId: 'vehicle_456',
    motoPlate: '1234ABC',
    startAt: '2026-01-25T09:00:00Z',
    endAt: '2026-01-25T14:00:00Z',
    status: 'scheduled'
  }
});

console.log('Created shift:', shift.id);
```

#### Iniciar Turno (Clock In)

```typescript
const started = await api.scheduler.startShift({
  shiftId: 'shift_789'
});

console.log('Shift started at:', started.actualStart);
```

#### Finalizar Turno (Clock Out)

```typescript
const ended = await api.scheduler.endShift({
  shiftId: 'shift_789'
});

console.log('Shift ended at:', ended.actualEnd);
```

#### Confirmar Turno

```typescript
await api.scheduler.confirmShift({
  shiftId: 'shift_789'
});

console.log('Shift confirmed');
```

#### Solicitar Intercambio

```typescript
await api.scheduler.requestSwap({
  shiftId: 'shift_789',
  body: {
    requested: true
  }
});

console.log('Swap requested');
```

#### Solicitar Cambio

```typescript
await api.scheduler.requestChange({
  shiftId: 'shift_789',
  body: {
    requested: true,
    reason: 'Personal commitment'
  }
});

console.log('Change requested');
```

#### Obtener Datos de Semana

```typescript
const week = await api.scheduler.getWeek({
  franchiseId: 'franchise_abc',
  weekId: '2026_04'
});

console.log('Week status:', week.status);
console.log('Total hours:', week.metrics.totalHours);
console.log('Active riders:', week.metrics.activeRiders);
```

## 🎨 Manejo de Errores

El SDK lanza excepciones de forma estandarizada:

```typescript
try {
  const records = await api.finance.listFinanceRecords({
    franchiseId: 'franchise_abc',
    month: '2026-01'
  });
} catch (error) {
  if (error.response) {
    // API returned error response
    const { status, data } = error.response;
    console.error(`API Error ${status}:`, data.message);
    
    // Manejar errores específicos
    if (data.code === 'VALIDATION_ERROR') {
      console.error('Validation details:', data.details);
    } else if (data.code === 'AUTH_INVALID_TOKEN') {
      // Redirigir a login
      window.location.href = '/login';
    }
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network error:', error.message);
  } else {
    // Something happened in setting up the request
    console.error('Request error:', error.message);
  }
}
```

## 🔌 Custom Interceptors

### Request Interceptor

```typescript
import { Configuration } from '@repaart/sdk';

const config = new Configuration({
  basePath: 'https://repaartfinanzas.web.app',
  accessToken: async () => getFirebaseAuthToken(),
  baseOptions: {
    transformRequest: [
      (data, headers) => {
        // Add custom headers
        headers['X-Custom-Header'] = 'value';
        headers['X-Request-ID'] = generateRequestId();
        return data;
      }
    ]
  }
});
```

### Response Interceptor

```typescript
const config = new Configuration({
  baseOptions: {
    transformResponse: [
      (data, headers) => {
        // Log responses
        console.log('API Response:', data);
        console.log('Response Headers:', headers);
        return data;
      }
    ]
  }
});
```

## 📊 TypeScript Types

El SDK exporta todos los tipos TypeScript para mayor seguridad:

```typescript
import type {
  FinancialRecord,
  Rider,
  Vehicle,
  AcademyCourse,
  Shift,
  WeekData,
  // ... más tipos
} from '@repaart/sdk';

const record: FinancialRecord = {
  id: 'rec_123',
  franchiseId: 'franchise_abc',
  type: 'income',
  amount: 1500.00,
  // ... TypeScript validará que todos los campos estén presentes
};
```

## 🧪 Testing

```typescript
import { RepaartApi } from '@repaart/sdk';

describe('Repaart SDK', () => {
  let api: RepaartApi;

  beforeEach(() => {
    api = new RepaartApi(new Configuration({
      basePath: 'https://repaartfinanzas.web.app',
      accessToken: async () => 'test-token'
    }));
  });

  it('should list riders', async () => {
    const riders = await api.fleet.listRiders({
      franchiseId: 'franchise_abc'
    });

    expect(Array.isArray(riders)).toBe(true);
  });

  it('should create financial record', async () => {
    const record = await api.finance.createFinanceRecord({
      recordInput: {
        franchiseId: 'franchise_abc',
        type: 'income',
        amount: 1000
      }
    });

    expect(record.id).toBeDefined();
    expect(record.amount).toBe(1000);
  });
});
```

## 🚀 Soporte

- **Documentación**: https://docs.repaart.com
- **OpenAPI Spec**: https://repaartfinanzas.web.app/docs/api/openapi.yaml
- **GitHub Issues**: https://github.com/repaart/sdk-ts/issues
- **Email**: sdk@repaart.com

## 📄 Licencia

Proprietary - © 2026 Repaart. All rights reserved.
