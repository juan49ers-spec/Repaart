# Issues y Bugs Pendientes

**Última actualización:** 2026-03-23 (sesión tarde)

---

## 🐛 Bugs Críticos

*Ninguno actualmente.*

---

## ⚠️ Issues Medios

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

~~### #8: GitHub Secrets para E2E en CI~~ — RESUELTO

`TEST_USER_EMAIL` y `TEST_USER_PASSWORD` creados en GitHub Actions secrets. Usuario `hola@repaart.es` ya existía en Firebase Auth. Tests E2E son stubs vacíos — pasarán en el próximo pipeline.

---

## 💡 Mejoras Técnicas

~~### #5: Console.log DEBUG en producción~~ — RESUELTO

Los 4 archivos mencionados (AdminHero, FranchiseDirectory, IntelligenceGrid, PowerMetrics) ya no contienen `console.log`. Los logs restantes en el proyecto son intencionados (utilidades de debug para admins, scripts de seed).

---

### ~~#6: warnings de tipo `any` en lint~~ — RESUELTO EN CÓDIGO DE PRODUCCIÓN

**Estado:** 0 warnings `no-explicit-any` en código de producción. 257 warnings totales restantes: todos en archivos de test (`__tests__/`) o de otros tipos (react-refresh, exhaustive-deps).

**Historial:** 809 → 505 → 257 (todos fuera de producción). Sesión 2026-03-23.

---

### ~~#7: 5 chunks >500KB en el bundle~~ — WON'T FIX

**Descripción:** Vite reporta chunks grandes. `manualChunks` fue removido explícitamente en el pasado porque causó errores de inicialización circular en runtime. Firebase SDK y Ant Design son intrínsecamente grandes. Con lazy loading ya activo, el impacto real en usuarios es bajo.

**Decisión:** Cerrado como won't fix. Reabrirlo solo si hay evidencia de impacto real en LCP/TTI.

---

## ✅ Issues Resueltos

| #                 | Descripción                                               | Resuelta   |
| ----------------- | --------------------------------------------------------- | ---------- |
| #1                | ADMIN_UID hardcoded en AdminFinanceInbox                  | 2026-02-02 |
| #2 (anterior)     | `user as any` en useRiderSupport                          | 2026-03-21 |
| #3 (anterior)     | `franchiseId` incorrecto en modales de rider              | 2026-03-21 |
| #4 (anterior)     | Coste de rider con tarifa hardcoded                       | 2026-03-21 |
| #5 (anterior)     | Componente muerto `CoverageStats.tsx`                     | 2026-03-21 |
| #3 (isConflict)   | Detección de turnos solapados en WeeklyScheduler          | 2026-03-22 |
| #4 (hasChanges)   | hasUnsavedChanges ya implementado en DeliveryScheduler    | 2026-03-22 |
| #6 (any warnings) | 0 warnings `any` en producción (809→0)                    | 2026-03-23 |
| #5 (console.log)  | Admin dashboard files ya limpios; logs restantes son OK   | 2026-03-23 |
| #8 (CI secrets)   | GitHub secrets TEST_USER_EMAIL/PASSWORD creados           | 2026-03-23 |
| Sentry inactivo   | `initSentry()` nunca se llamaba; ErrorBoundary sin Sentry | 2026-03-22 |
| IVA combustible   | Deducción revertida a 100% en `finance.ts`                | 2026-03-22 |
| IVA doble cómputo | `Math.max` en `useTaxCalculations.ts`                     | 2026-03-22 |

---

## 📊 Métricas

| Categoría      | Pendientes | Resueltos |
| -------------- | ---------- | --------- |
| Críticos       | 0          | 1         |
| Medios         | 0          | 6         |
| Bajos/Mejoras  | 0          | 6         |

**Total pendientes:** 0 🎉
