# Spec: Estabilidad Defensiva — REPAART

**Fecha:** 2026-03-22
**Autor:** Claude Code (revisado con usuario)
**Enfoque elegido:** A — Estabilidad Defensiva
**Estado:** Aprobado para implementación

---

## Contexto y motivación

REPAART es un SaaS en producción con 516 tests unitarios pasando y 0 errores de TypeScript. Sin embargo, existen tres brechas de estabilidad operacional que no son visibles en los tests:

1. **Sentry está instalado pero nunca inicializado** — `initSentry()` se exporta en `src/lib/sentry/index.ts` pero no se llama en ningún punto de entrada de la app. Ningún error de producción llega a Sentry.
2. **ErrorBoundary no está conectado a Sentry** — `componentDidCatch` solo hace `console.error`. Si un componente falla, el error no se captura.
3. **E2E desactivado en CI** — 13 archivos spec existen en `tests/e2e/` pero no hay job e2e en `.github/workflows/ci-cd.yml`. Los flujos críticos nunca se verifican automáticamente.

Además hay ruido de calidad menor: `console.log` en producción y 4 errores de lint en `withErrorBoundary.tsx`.

---

## Alcance

### Incluido

- Activar Sentry con contexto de usuario y franquicia
- Conectar ErrorBoundary a Sentry
- Limpiar console.logs de producción (4 archivos admin + `initSentry`)
- Corregir errores de lint en `withErrorBoundary.tsx`
- Añadir job e2e en CI con Firebase Emulator (smoke test: auth + flujos críticos)

### Excluido (fuera de alcance)

- 811 warnings de tipo `any` (deuda técnica progresiva)
- Optimización de bundle (chunks >500KB)
- Issues #3 y #4 del backlog (isConflict, hasChanges)
- Nuevos tests e2e — solo reactivar los existentes

---

## Diseño por componente

### 1. Activación de Sentry

**Archivo a modificar:** `src/main.tsx` (punto de entrada de la app)

Llamar `initSentry()` antes del `ReactDOM.createRoot()`:

```typescript
import { initSentry } from './lib/sentry';

initSentry(); // antes del render
```

**Archivo a modificar:** `src/context/AuthContext.tsx`

Importar y llamar `setUserContext` (ya definido en `src/services/errorLogger.ts`) tras el login exitoso, pasando `uid`, `email`, `role` y `franchiseId`:

```typescript
import { setUserContext, clearUserContext } from '../services/errorLogger';

// al setear usuario autenticado:
setUserContext({ uid, email, role, franchiseId });

// al hacer logout:
clearUserContext();
```

**Limpiar console.logs en `src/lib/sentry/index.ts`:** Las líneas 51 y 53 son logs innecesarios dentro del módulo de observabilidad.

---

### 2. ErrorBoundary + Sentry

**Archivo a modificar:** `src/components/ui/feedback/ErrorBoundary.tsx`

Conectar `componentDidCatch` con `captureException`:

```typescript
import { captureException } from '../../../services/errorLogger';

componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  captureException(error, { extra: { componentStack: errorInfo.componentStack } });
}
```

**Archivo a modificar:** `src/hoc/withErrorBoundary.tsx`

Corregir los 4 errores de lint:
- Reemplazar `onError?: (error: any, errorInfo: any)` con tipos específicos (`Error`, `ErrorInfo`)
- Eliminar la prop `resetOnError` si no está implementada en el ErrorBoundary real (evitar interfaz muerta)

---

### 3. Console.logs en producción

**Archivos a modificar:**
- `src/features/admin/dashboard/AdminHero.tsx:29`
- `src/features/admin/dashboard/FranchiseDirectory.tsx`
- `src/features/admin/dashboard/IntelligenceGrid.tsx`
- `src/features/admin/dashboard/PowerMetrics.tsx`

**Patrón de fix:**
```typescript
// Antes:
console.log('DEBUG:', data);

// Después:
if (import.meta.env.DEV) console.log('DEBUG:', data);
// O eliminar si no aporta valor
```

---

### 4. E2E en CI

**Archivo a modificar:** `.github/workflows/ci-cd.yml`

Añadir job `e2e-smoke` que corre en paralelo con `unit-tests`, después de lint:

```yaml
e2e-smoke:
  runs-on: ubuntu-latest
  needs: lint-and-typecheck
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: "npm"
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium
    - name: Build app
      run: npm run build
      env:
        VITE_USE_EMULATOR: "true"
    - name: Run e2e smoke tests
      run: npx playwright test tests/e2e/auth.spec.ts tests/e2e/critical-flows.spec.ts
      timeout-minutes: 10
      env:
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    - name: Upload Playwright report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

**Nota:** Los tests e2e actuales usan Firebase real. Si los tests van a correr en CI sin credenciales reales, hay dos opciones:
- **Opción A (recomendada a corto plazo):** Usar secrets de GitHub con credenciales de un usuario de test dedicado en el proyecto Firebase
- **Opción B (más robusta, más trabajo):** Configurar Firebase Emulator en CI con `npm run firebase:emulators` y datos seed

Para el plan de implementación, se usará la Opción A como primera iteración.

---

## Criterios de éxito

| Criterio | Verificación |
|----------|-------------|
| Sentry recibe errores | `captureException` llamado en `componentDidCatch` + `initSentry()` en main.tsx |
| Usuario con contexto en Sentry | `setUserContext` llamado tras login, `clearUserContext` tras logout |
| 0 errores de lint | `npm run lint` — de 4 errores → 0 errores |
| Sin console.logs en prod | Revisión de los 4 archivos admin |
| E2E en CI | Job `e2e-smoke` en ci-cd.yml corriendo `auth.spec.ts` + `critical-flows.spec.ts` |
| Tests existentes siguen pasando | `npx vitest run` — 516/516 |

---

## Orden de implementación

1. Limpiar console.logs + errores lint (cambios aislados, bajo riesgo)
2. Activar Sentry en `main.tsx` + contexto de usuario en `AuthContext`
3. Conectar ErrorBoundary a Sentry
4. Añadir job e2e al CI

Cada paso puede ser un commit o PR separado.

---

## Archivos clave

| Archivo | Cambio |
|---------|--------|
| `src/main.tsx` | Llamar `initSentry()` |
| `src/context/AuthContext.tsx` | Llamar `setUserContext` / `clearUserContext` |
| `src/lib/sentry/index.ts` | Eliminar console.logs internos |
| `src/components/ui/feedback/ErrorBoundary.tsx` | Conectar `captureException` en `componentDidCatch` |
| `src/hoc/withErrorBoundary.tsx` | Corregir tipos `any` → tipos específicos |
| `src/features/admin/dashboard/*.tsx` (4 archivos) | Wrappear logs en `DEV` o eliminar |
| `.github/workflows/ci-cd.yml` | Añadir job `e2e-smoke` |
