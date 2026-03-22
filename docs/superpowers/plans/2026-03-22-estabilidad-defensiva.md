# Estabilidad Defensiva — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activar Sentry correctamente, conectar ErrorBoundary a Sentry, y reactivar e2e en CI — eliminando las tres brechas de observabilidad operacional del proyecto.

**Architecture:** Sentry se inicializa en el punto de entrada (`main.tsx`) antes del render. El contexto de usuario se setea en `AuthContext` al detectar cambio de sesión. El `ErrorBoundary` de `main.tsx` captura y envía errores via `captureException`. El CI añade un job `e2e-smoke` que corre contra Firebase real con credenciales de test dedicadas.

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library, @sentry/react, GitHub Actions, Playwright

**Spec:** `docs/superpowers/specs/2026-03-22-estabilidad-defensiva-design.md`

---

## Context: ErrorBoundary landscape

Hay tres ErrorBoundary en el proyecto — es importante no confundirlos:

| Archivo | Usado en | Estado Sentry |
| ------- | -------- | ------------- |
| `src/components/ui/feedback/ErrorBoundary.tsx` | `main.tsx` (raíz de la app) | ❌ Solo `console.error` |
| `src/components/error/ErrorBoundary.tsx` | Módulos de features | ❌ Solo `console.error` + callback `onError` |
| `src/components/ErrorBoundary.tsx` | `withErrorBoundary` HOC | ⚠️ Llama `ErrorLogger.logError()` pero Sentry nunca inicializado |

Este plan conecta el de `main.tsx` (`ui/feedback/ErrorBoundary.tsx`) y activa Sentry globalmente.

---

## File Map

| Archivo | Acción | Qué cambia |
| ------- | ------ | ---------- |
| `src/lib/sentry/index.ts` | Modificar | Eliminar 2 `console.log` (líneas 51, 53) |
| `src/hoc/withErrorBoundary.tsx` | Modificar | Reemplazar `any` → `Error`/`ErrorInfo`, `onError` type completo |
| `src/main.tsx` | Modificar | Añadir `initSentry()` antes de `ReactDOM.createRoot()` |
| `src/context/AuthContext.tsx` | Modificar | Llamar `setUserContext`/`clearUserContext` en `onAuthStateChanged` |
| `src/components/ui/feedback/ErrorBoundary.tsx` | Modificar | Conectar `captureException` en `componentDidCatch` |
| `src/components/ui/feedback/__tests__/ErrorBoundary.test.tsx` | Crear | Test: `captureException` se llama cuando un componente falla |
| `.github/workflows/ci-cd.yml` | Modificar | Añadir job `e2e-smoke` |

---

## Task 1: Limpiar console.logs en sentry/index.ts

**Files:**
- Modify: `src/lib/sentry/index.ts:51,53`

- [ ] **Step 1: Confirmar líneas a eliminar**

```bash
grep -n "console.log" src/lib/sentry/index.ts
```

Esperado: 2 líneas — "Sentry initialized successfully" y "Sentry DSN not configured..."

- [ ] **Step 2: Eliminar las dos líneas**

En `src/lib/sentry/index.ts`, eliminar:
```typescript
// Línea ~51 — ELIMINAR:
console.log('Sentry initialized successfully');

// Línea ~53 — ELIMINAR:
console.log('Sentry DSN not configured, skipping initialization');
```

El bloque `if/else` queda vacío en el `else` — eliminar también el `else` si solo contenía ese log, dejando la función más limpia.

- [ ] **Step 3: Verificar que no quedan console.log en el módulo**

```bash
grep -n "console\." src/lib/sentry/index.ts
```

Esperado: 0 líneas.

- [ ] **Step 4: Correr tests para confirmar nada se rompe**

```bash
npx vitest run src/services/__tests__/errorLogger.test.ts
```

Esperado: todos los tests pasan.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sentry/index.ts
git commit -m "chore(sentry): remove console.logs from sentry init module"
```

---

## Task 2: Corregir tipos en withErrorBoundary.tsx

**Files:**
- Modify: `src/hoc/withErrorBoundary.tsx`

- [ ] **Step 1: Ver el estado actual del archivo**

```bash
cat src/hoc/withErrorBoundary.tsx
```

Esperado: interfaz con `onError?: (error: any, errorInfo: any)` en línea ~7.

- [ ] **Step 2: Corregir tipos**

Reemplazar la interfaz completa:

```typescript
// ANTES:
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: any, errorInfo: any) => void;
    resetOnError?: boolean;
}

// DESPUÉS:
import { type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

Nota: `resetOnError` se elimina porque el `ErrorBoundary` que usa este HOC (`src/components/ErrorBoundary.tsx`) tiene la prop en su interfaz pero nunca la usa internamente. Eliminarla del HOC evita confusión.

- [ ] **Step 3: Verificar 0 errores de lint en el archivo**

```bash
npx eslint src/hoc/withErrorBoundary.tsx
```

Esperado: 0 errores, 0 warnings.

- [ ] **Step 4: Correr build para verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add src/hoc/withErrorBoundary.tsx
git commit -m "fix(hoc): replace any types with Error/ErrorInfo in withErrorBoundary"
```

---

## Task 3: Activar Sentry en el punto de entrada

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Añadir initSentry() antes del render**

En `src/main.tsx`, añadir el import y la llamada **antes** de la línea `const rootElement = document.getElementById('root')`:

```typescript
// Añadir este import junto a los demás imports:
import { initSentry } from './lib/sentry';

// Añadir esta línea justo antes de "const rootElement = ...":
initSentry();
```

El bloque relevante queda así:

```typescript
import { initSentry } from './lib/sentry';

// ... resto de imports ...

initSentry(); // ← NUEVO — debe estar antes del render

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

ReactDOM.createRoot(rootElement).render(
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Verificar que el build completo funciona**

```bash
npm run build
```

Esperado: build exitoso sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "feat(sentry): initialize Sentry at app entry point"
```

---

## Task 4: Setear contexto de usuario en Sentry al login

**Files:**
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Leer el bloque onAuthStateChanged**

```bash
grep -n "onAuthStateChanged\|setUser\|setRoleConfig" src/context/AuthContext.tsx
```

Identificar las líneas donde se hace `setUser(authUser)` (login) y `setUser(null)` (logout).

- [ ] **Step 2: Añadir el import de setUserContext/clearUserContext**

Al inicio de `src/context/AuthContext.tsx`, añadir:

```typescript
import { setUserContext, clearUserContext } from '../services/errorLogger';
```

- [ ] **Step 3: Llamar setUserContext tras el login exitoso**

En el bloque `if (firebaseUser)`, justo después de `setUser(authUser)`:

```typescript
// ANTES:
setUser(authUser);
setRoleConfig(data);
setIsAdmin(data.role === 'admin');

// DESPUÉS:
setUser(authUser);
setRoleConfig(data);
setIsAdmin(data.role === 'admin');
setUserContext(
  authUser.uid,
  authUser.email ?? undefined,
  {
    role: data.role,
    franchiseId: data.franchiseId ?? null,
  }
);
```

- [ ] **Step 4: Llamar clearUserContext en el logout**

En el bloque `else` (cuando `firebaseUser` es null), justo después de `setUser(null)`:

```typescript
// ANTES:
setUser(null);
setRoleConfig(null);
setIsAdmin(false);
clearAuthCache();

// DESPUÉS:
setUser(null);
setRoleConfig(null);
setIsAdmin(false);
clearAuthCache();
clearUserContext();
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: 0 errores. Verificar especialmente que los tipos de `data.role` y `data.franchiseId` son compatibles con `Record<string, unknown>`.

- [ ] **Step 6: Correr tests existentes**

```bash
npx vitest run src/features/auth
```

Esperado: todos los tests de auth pasan.

- [ ] **Step 7: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat(sentry): set user context in Sentry on login/logout"
```

---

## Task 5: Conectar ErrorBoundary de main.tsx a Sentry

**Files:**
- Modify: `src/components/ui/feedback/ErrorBoundary.tsx`
- Create: `src/components/ui/feedback/__tests__/ErrorBoundary.test.tsx`

- [ ] **Step 1: Escribir el test que falla primero (TDD)**

Crear `src/components/ui/feedback/__tests__/ErrorBoundary.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock captureException del errorLogger
vi.mock('../../../../services/errorLogger', () => ({
  captureException: vi.fn(),
}));

// Mock iconos de Lucide
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    AlertTriangle: ({ ...props }: React.SVGProps<SVGSVGElement>) => <svg data-testid="alert-icon" {...props} />,
    RefreshCw: ({ ...props }: React.SVGProps<SVGSVGElement>) => <svg data-testid="refresh-icon" {...props} />,
  };
});

// Componente que lanza error intencionalmente
const Bomba = () => {
  throw new Error('Error de prueba controlado');
};

describe('ErrorBoundary (ui/feedback)', () => {
  beforeEach(() => {
    // Silenciar errores de consola — React los imprime siempre en tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra fallback UI cuando un hijo lanza un error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>
    );

    expect(getByText('Módulo no disponible')).toBeInTheDocument();
  });

  it('llama captureException cuando un hijo lanza un error', async () => {
    const { captureException } = await import('../../../../services/errorLogger');

    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>
    );

    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: expect.any(Object) })
    );
  });
});
```

- [ ] **Step 2: Correr el test para confirmar que falla**

```bash
npx vitest run src/components/ui/feedback/__tests__/ErrorBoundary.test.tsx
```

Esperado: FAIL — el segundo test falla porque `captureException` aún no se llama.

- [ ] **Step 3: Implementar la conexión en ErrorBoundary**

En `src/components/ui/feedback/ErrorBoundary.tsx`, modificar `componentDidCatch`:

```typescript
// Añadir import al inicio del archivo (junto a los imports existentes):
import { captureException } from '../../../services/errorLogger';

// Modificar componentDidCatch:
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    console.error('[CRITICAL UI FAIL]:', error, errorInfo);
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

```bash
npx vitest run src/components/ui/feedback/__tests__/ErrorBoundary.test.tsx
```

Esperado: PASS — 2/2 tests.

- [ ] **Step 5: Correr la suite completa para verificar no hay regresiones**

```bash
npx vitest run
```

Esperado: 518/518 tests (516 existentes + 2 nuevos).

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/feedback/ErrorBoundary.tsx \
        src/components/ui/feedback/__tests__/ErrorBoundary.test.tsx
git commit -m "feat(sentry): connect main ErrorBoundary to captureException"
```

---

## Task 6: Añadir job e2e-smoke al CI

**Files:**
- Modify: `.github/workflows/ci-cd.yml`

**Pre-requisito:** Antes de activar este job, el repositorio necesita dos GitHub Secrets configurados:
- `TEST_USER_EMAIL` — email de un usuario de test dedicado en Firebase (no usar cuenta real)
- `TEST_USER_PASSWORD` — contraseña de ese usuario

Si los secrets no están creados, crear el usuario en Firebase Console > Authentication y añadir los secrets en GitHub > Settings > Secrets and variables > Actions.

- [ ] **Step 1: Verificar que los tests e2e de auth y critical-flows están listos**

```bash
npx playwright test tests/e2e/auth.spec.ts tests/e2e/critical-flows.spec.ts --list
```

Esperado: lista de tests sin errores de configuración.

- [ ] **Step 2: Añadir el job e2e-smoke al workflow**

En `.github/workflows/ci-cd.yml`, añadir el siguiente job después del bloque `unit-tests` y antes de `build`:

```yaml
  # Job 3: E2E Smoke Tests
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

      - name: Run e2e smoke tests
        run: npx playwright test tests/e2e/auth.spec.ts tests/e2e/critical-flows.spec.ts
        timeout-minutes: 10
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload Playwright report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 3: Actualizar el job `build` para que dependa también de e2e-smoke**

En el job `build`, cambiar:
```yaml
# ANTES:
needs: [unit-tests]

# DESPUÉS:
needs: [unit-tests, e2e-smoke]
```

Esto garantiza que solo se buildea y deployea si los smoke tests pasan.

- [ ] **Step 4: Verificar sintaxis YAML**

```bash
npx js-yaml .github/workflows/ci-cd.yml
```

Esperado: no hay errores de parseo.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "ci: reactivate e2e smoke tests in CI pipeline

Adds e2e-smoke job with auth.spec.ts + critical-flows.spec.ts.
Runs in parallel with unit-tests, blocks build on failure.
Uses dedicated Firebase test user via GitHub Secrets."
```

---

## Verificación Final

- [ ] **Correr suite completa de tests unitarios**

```bash
npx vitest run
```

Esperado: 518/518 (o más si otros tests se añadieron).

- [ ] **Verificar 0 errores TypeScript**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Verificar 0 errores de lint**

```bash
npm run lint 2>&1 | grep "error"
```

Esperado: 0 errores (warnings de `any` no importan para este plan).

- [ ] **Verificar que Sentry se llama en prueba manual (dev)**

```bash
npm run dev
```

Abrir la app, abrir DevTools > Network — verificar que no hay llamadas erróneas a Sentry (solo se enviará cuando haya un DSN real configurado en `.env`).

- [ ] **Verificar build final**

```bash
npm run build
```

Esperado: build exitoso sin errores.

---

## Resumen de commits esperados

```
chore(sentry): remove console.logs from sentry init module
fix(hoc): replace any types with Error/ErrorInfo in withErrorBoundary
feat(sentry): initialize Sentry at app entry point
feat(sentry): set user context in Sentry on login/logout
feat(sentry): connect main ErrorBoundary to captureException
ci: reactivate e2e smoke tests in CI pipeline
```

Después de este plan: Sentry activo, ErrorBoundary conectado, e2e en CI. El proyecto pasa de operar a ciegas a tener visibilidad operacional básica.
