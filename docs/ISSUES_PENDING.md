# Issues y Bugs Pendientes

**Fecha:** 2026-02-02  
**Estado:** Revisión en curso

## 🐛 Bugs Críticos (RESUELTOS)

### ✅ #1: ADMIN_UID Hardcoded - **RESUELTO**
**Archivo:** `src/features/admin/dashboard/AdminFinanceInbox.tsx`

**Problema:** Se usaba `'ADMIN_UID'` hardcoded para aprobar registros financieros.

**Solución:**
```typescript
import { useAuth } from '../../../context/AuthContext';

const { user } = useAuth();
await financeService.updateStatus(auditModal.record.id, 'approved', user?.uid || 'UNKNOWN');
```

**Riesgo:** 🚨 CRÍTICO - Cualquier usuario podría aprobar registros si se conocía el UID hardcoded.

**Estado:** ✅ Corregido - Ahora usa el UID del usuario autenticado.

---

## ⚠️ Issues Medianos

### #2: Console.log DEBUG en Producción
**Archivos afectados:**
- `src/features/admin/dashboard/AdminHero.tsx:29`
- `src/features/admin/dashboard/FranchiseDirectory.tsx`
- `src/features/admin/dashboard/IntelligenceGrid.tsx`
- `src/features/admin/dashboard/PowerMetrics.tsx`

**Problema:** Logs de debug que deberían eliminarse en producción.

**Solución:** Usar condición de entorno:
```typescript
if (import.meta.env.DEV) {
  console.log('DEBUG: Component mounted');
}
```

**Prioridad:** MEDIA (no crítico, pero debe limpiarse)

---

### #3: isConflict prop no implementado
**Archivo:** `src/features/operations/WeeklyScheduler.tsx:1336`

**Problema:** 
```typescript
// TODO: Pass 'isConflict' prop if available. For now, assuming standard logic.
```

**Impacto:** Los turnos pueden solaparse sin detección.

**Prioridad:** MEDIA (funcionalidad faltante)

**Solución:** Implementar lógica de detección de conflictos de horarios.

---

### # #4: Tracking de cambios no implementado
**Archivo:** `src/features/scheduler/DeliveryScheduler.tsx:344`

**Problema:**
```typescript
hasChanges={false} // TODO: Track changes
```

**Impacto:** No se detectan cambios sin guardar en el scheduler.

**Prioridad:** BAJA (mejora de UX)

**Solución:** Implementar detección de cambios comparando estado inicial con actual.

---

## 💡 Recomendaciones

### Limpieza de Código
1. **Eliminar/reemplazar `alert()`** por componentes de UI
2. **Eliminar console.log DEBUG** de producción
3. **Reemplazar XXX placeholders** con datos reales

### Mejoras de Funcionalidad
1. Implementar `isConflict` detection en WeeklyScheduler
2. Implementar tracking de cambios en DeliveryScheduler
3. Agregar validación de Conflictos en el scheduler

### Seguridad
1. ✅ Ya arreglado: ADMIN_UID hardcoded
2. Revisar otros lugares donde se usen UIDs hardcoded
3. Implementar verificación de permisos en acciones críticas

---

## 📊 Métricas

| Categoría | Pendientes | Resueltos |
|-----------|------------|-----------|
| Críticos | 0 | 1 ✅ |
| Medios | 2 | 0 |
| Bajos | 1 | 0 |

**Total:** 3 pendientes (2 medios, 1 bajo)

---

**Próxima acción:** Revisar issues medios o crear nuevos tests para cobertura.
