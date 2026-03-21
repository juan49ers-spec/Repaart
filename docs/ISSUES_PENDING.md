# Issues y Bugs Pendientes

**Última actualización:** 2026-03-21

---

## 🐛 Bugs Críticos

*Ninguno actualmente.*

---

## ⚠️ Issues Medios

### #3: `isConflict` prop no implementado
**Archivo:** `src/features/operations/WeeklyScheduler.tsx:1336`

**Problema:**
```typescript
// TODO: Pass 'isConflict' prop if available. For now, assuming standard logic.
```

**Impacto:** Los turnos pueden solaparse sin detección visual ni alerta.

**Prioridad:** MEDIA

**Solución propuesta:** Implementar lógica de detección de conflictos comparando rangos horarios de turnos del mismo rider en el mismo día.

---

### #4: Tracking de cambios no implementado
**Archivo:** `src/features/scheduler/DeliveryScheduler.tsx:344`

**Problema:**
```typescript
hasChanges={false} // TODO: Track changes
```

**Impacto:** El botón "Guardar" no se activa aunque haya cambios pendientes.

**Prioridad:** BAJA (mejora UX)

**Solución propuesta:** Comparar estado inicial con estado actual usando `JSON.stringify` o deep-equal.

---

## 💡 Mejoras Técnicas

### #5: Console.log DEBUG en producción
**Archivos afectados:**
- `src/features/admin/dashboard/AdminHero.tsx:29`
- `src/features/admin/dashboard/FranchiseDirectory.tsx`
- `src/features/admin/dashboard/IntelligenceGrid.tsx`
- `src/features/admin/dashboard/PowerMetrics.tsx`

**Problema:** Logs de debug en código de producción.

**Solución:**
```typescript
if (import.meta.env.DEV) {
  console.log('DEBUG:', data);
}
```

**Prioridad:** BAJA (no funcional, solo limpieza)

---

### #6: ~808 warnings de tipo `any` en lint
**Descripción:** El linter reporta ~808 warnings por uso de `any`. No son errores bloqueantes pero reducen la seguridad de tipos.

**Prioridad:** BAJA (mejora técnica progresiva)

**Abordaje recomendado:** Resolver por módulo, empezando por los servicios Firebase.

---

### #7: 5 chunks >500KB en el bundle
**Descripción:** Vite reporta chunks grandes en producción que pueden afectar el tiempo de carga inicial.

**Prioridad:** BAJA (optimización)

**Abordaje recomendado:** Analizar con `vite-bundle-analyzer` e implementar lazy loading en rutas pesadas.

---

## ✅ Issues Resueltos

| # | Descripción | Resuelta |
|---|-------------|---------|
| #1 | ADMIN_UID hardcoded en AdminFinanceInbox | 2026-02-02 |
| #2 (anterior) | `user as any` en useRiderSupport | 2026-03-21 |
| #3 (anterior) | `franchiseId` incorrecto en modales de rider | 2026-03-21 |
| #4 (anterior) | Coste de rider con tarifa hardcoded | 2026-03-21 |
| #5 (anterior) | Componente muerto `CoverageStats.tsx` | 2026-03-21 |

---

## 📊 Métricas

| Categoría | Pendientes | Resueltos |
|-----------|------------|-----------|
| Críticos | 0 | 1 |
| Medios | 1 | 3 |
| Bajos/Mejoras | 3 | 2 |

**Total pendientes:** 4 (1 medio, 3 bajos)
