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

Importar y llamar `setUserContext` (ya definido en `src/services/errorLogger.ts`) tras el login exitoso. La firma real de la función es:

```typescript
setUserContext(userId: string, email?: string, additionalData?: Record<string, unknown>): void
```

Por tanto la llamada correcta es:

```typescript
import { setUserContext, clearUserContext } from '../services/errorLogger';

// al setear usuario autenticado (después de setUser(authUser)):
setUserContext(authUser.uid, authUser.email ?? undefined, {
  role: authUser.role,
  franchiseId: authUser.franchiseId ?? null,
});

// al hacer logout (en el handler de onAuthStateChanged cuando user === null):
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

Corregir los 2 warnings de lint y una incompatibilidad de tipos:

- Reemplazar `onError?: (error: any, errorInfo: any)` → `onError?: (error: Error, errorInfo: ErrorInfo) => void` (importar `ErrorInfo` de React)
- Eliminar la prop `resetOnError` de la interfaz: el ErrorBoundary real no acepta esa prop, y spreadearla genera una prop desconocida en runtime. No está implementada → eliminar sin reemplazo.

---

### 3. Console.logs en producción

**Archivo a modificar:** `src/lib/sentry/index.ts` (líneas 51 y 53)

Las únicas instancias de `console.log` en código de inicialización son las que están dentro del propio módulo Sentry:

```typescript
// Línea 51 — eliminar:
console.log('Sentry initialized successfully');

// Línea 53 — eliminar:
console.log('Sentry DSN not configured, skipping initialization');
```

Los archivos del admin dashboard (`AdminHero`, `FranchiseDirectory`, etc.) solo tienen `console.error` en handlers de error — ese patrón es aceptable y no se modifica.

---

### 4. E2E en CI

**Archivo a modificar:** `.github/workflows/ci-cd.yml`

**Estrategia de credenciales:** Usar secrets de GitHub (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`) con un usuario de test dedicado en el proyecto Firebase. Opción emulador queda para una iteración posterior.

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

**Nota:** Los tests e2e actuales usan Firebase real. Opciones para credenciales en CI:

- **Opción A (recomendada):** Secrets de GitHub con usuario de test dedicado en Firebase
- **Opción B (más robusta, más trabajo):** Firebase Emulator en CI con datos seed

Se usa la Opción A en esta iteración. Secrets requeridos: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.

---

## Criterios de éxito

| Criterio | Verificación |
| -------- | ------------ |
| Sentry recibe errores | `captureException` en `componentDidCatch` + `initSentry()` en main.tsx |
| Usuario con contexto en Sentry | `setUserContext` tras login, `clearUserContext` tras logout |
| 0 errores de lint | `npm run lint` — de 4 errores → 0 errores |
| Sin console.logs en módulo Sentry | Líneas 51 y 53 eliminadas de `src/lib/sentry/index.ts` |
| E2E en CI | Job `e2e-smoke` en ci-cd.yml con `auth.spec.ts` + `critical-flows.spec.ts` |
| Tests unitarios intactos | `npx vitest run` — 516/516 |

---

## Orden de implementación

1. Limpiar console.logs en `sentry/index.ts` + corregir lint en `withErrorBoundary` (bajo riesgo, aislados)
2. Activar Sentry en `main.tsx` + contexto de usuario en `AuthContext`
3. Conectar `ErrorBoundary` a Sentry vía `captureException`
4. Añadir job `e2e-smoke` al CI

Cada paso es un commit o PR independiente.

---

## Archivos clave

| Archivo | Cambio |
| ------- | ------ |
| `src/main.tsx` | Llamar `initSentry()` antes del render |
| `src/context/AuthContext.tsx` | Llamar `setUserContext(uid, email, {role, franchiseId})` / `clearUserContext()` |
| `src/lib/sentry/index.ts` | Eliminar `console.log` en líneas 51 y 53 |
| `src/components/ui/feedback/ErrorBoundary.tsx` | Conectar `captureException` en `componentDidCatch` |
| `src/hoc/withErrorBoundary.tsx` | Reemplazar `any` → `Error`/`ErrorInfo`, eliminar `resetOnError` |
| `.github/workflows/ci-cd.yml` | Añadir job `e2e-smoke` |
| `.github/workflows/ci-cd.yml` | Añadir job `e2e-smoke` |
