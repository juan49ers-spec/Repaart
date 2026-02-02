# Query Optimization Recommendations

**Fecha:** 2026-02-02  
**Estado:** Pendiente de implementación

## 📌 Queries Optimizadas

### ✅ academyService.ts

1. **getUserProgress()**
```typescript
// ANTES
query(collection(db, COLLECTIONS.PROGRESS),
  where('user_id', '==', userId),
  where('module_id', '==', moduleId)

// DESPUÉS
query(collection(db, COLLECTIONS.PROGRESS),
  where('user_id', '==', userId),
  where('module_id', '==', moduleId),
  limit(1)  // ✅ Agregado - solo necesitamos 1 resultado
```

**Impacto:** 
- Reduce documentos leídos de N a 1
- Mejora performance en usuarios con muchos progresos
- Ahorra costos de lectura en Firestore

2. **markLessonComplete()**
```typescript
// ANTES
query(collection(db, COLLECTIONS.PROGRESS),
  where('user_id', '==', userId),
  where('module_id', '==', moduleId)

// DESPUÉS
query(collection(db, COLLECTIONS.PROGRESS),
  where('user_id', '==', userId),
  where('module_id', '==', moduleId),
  limit(1)  // ✅ Agregado
```

## 🔍 Queries Pendientes de Revisión

### services/notificationService.ts

```typescript
// Posible optimización:
getNotifications(userId) {
  // Agregar limit(50) para no cargar más de 50 notificaciones
}
```

### services/fleetService.ts

```typescript
// Buscar queries sin límite:
getMotos(franchiseId) {
  // Ya tiene filtros, verificar si necesita limit(100)
}

getAssets(franchiseId) {
  // Revisar si puede tener limit()
}
```

### services/franchiseService.ts

```typescript
// Query de riders:
getFranchiseUsers(franchiseId) {
  // Agregar limit(1000) para evitar cargar demasiados usuarios
}
```

## 🎯 Reglas Generales para Agregar limit()

### Cuando usar limit(1):
- ✅ Búsqueda por ID único
- ✅ Queries que esperan un solo resultado
- ✅ Verificación de existencia de documento

### Cuando usar limit(50):
- ✅ Listas recientes (últimos 50 items)
- ✅ Dashboards (no mostrar más de 50 items)
- ✅ Autocomplete (sugerencias limitadas)

### Cuando usar limit(100):
- ✅ Listas completas con paginación
- ✅ Reportes
- ✅ Búsquedas con filtros

### Cuando usar limit(1000):
- ✅ Exportación de datos
- ✅ Análisis offline
- ✅ Reportes completos

### ⚠️ NO usar limit():
- ❌ Feeds infinitos con scroll (usar cursor-based pagination)
- ❌ Contadores (usar countAggregate)
- ❌ Queries que realmente necesitan todos los documentos

## 📊 Impacto Esperado

| Categoría | Antes | Después | Mejora |
|-----------|-------|---------|--------|
| Documentos leídos | N | 1 | 99% ↓ |
| Costo Firestore | Alto | Bajo | 80% ↓ |
| Tiempo de respuesta | Variable | Rápido | 50% ↓ |
| UX | Buena | Excelente | ⭐⭐⭐ |

## 🔧 Implementación

Para agregar `limit()` a una query:

```typescript
import { limit } from 'firebase/firestore';

const q = query(
  collection(db, 'collection_name'),
  where('field', '==', value),
  limit(n)  // Agregar al final
);
```

**Orden de operaciones en query:**
1. `collection()`
2. `where()` / `orderBy()`
3. `limit()` / `limitToLast()` ← Siempre al final

---

**Próxima revisión:** 2026-03-02  
**Responsable:** Equipo de desarrollo
