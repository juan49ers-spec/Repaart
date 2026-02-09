# E2E Testing Guide

## 🎭 Playwright Tests

Este proyecto usa [Playwright](https://playwright.dev) para tests End-to-End.

## 📁 Estructura

```
tests/e2e/
├── auth.spec.ts          # Tests de autenticación
├── dashboard.spec.ts     # Tests de navegación dashboard
├── schedule.spec.ts      # Tests de gestión de turnos
├── finance.spec.ts       # Tests de finanzas
├── academy.spec.ts       # Tests de academia
├── responsive.spec.ts    # Tests de diseño responsive
├── rider-profile.spec.ts # Tests de perfil de rider
├── critical-flows.spec.ts # Flujos críticos
├── login.spec.ts         # Tests de login
└── navigation.spec.ts    # Tests de navegación
```

## 🚀 Comandos

```bash
# Ejecutar todos los tests
npx playwright test

# Ejecutar tests específicos
npx playwright test auth.spec.ts

# Ejecutar en modo UI (interactivo)
npx playwright test --ui

# Ejecutar en modo debug
npx playwright test --debug

# Generar reporte HTML
npx playwright test --reporter=html
n
# Ejecutar solo en Chrome
npx playwright test --project=chromium

# Ejecutar tests en paralelo
npx playwright test --workers=4
```

## 🌐 Navegadores Soportados

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)
- **Tablet**: iPad Pro

## 📊 Reportes

Después de ejecutar los tests:

```bash
# Ver reporte HTML
npx playwright show-report
```

## 🎯 Mejores Prácticas

1. **Usar selectores semánticos**:
   ```typescript
   // ✅ Bien
   await page.click('text=Iniciar Sesión');
   await page.fill('input[type="email"]', 'test@example.com');
   
   // ❌ Evitar
   await page.click('.btn-primary');
   await page.fill('#input-123', 'test@example.com');
   ```

2. **Esperar elementos visibles**:
   ```typescript
   await expect(page.locator('text=Dashboard')).toBeVisible();
   ```

3. **Usar test.describe para organizar**:
   ```typescript
   test.describe('Authentication Flow', () => {
     test('should login successfully', async ({ page }) => {
       // ...
     });
   });
   ```

4. **Limpiar estado entre tests**:
   ```typescript
   test.afterEach(async ({ page }) => {
     await page.evaluate(() => localStorage.clear());
   });
   ```

## 🔧 Configuración

La configuración está en `playwright.config.ts`:

- **Base URL**: http://localhost:5173
- **Retries**: 2 en CI, 0 en local
- **Workers**: 1 en CI, automático en local
- **Screenshot**: Solo en fallos
- **Video**: Retain on failure

## 🐛 Debugging

```bash
# Modo debug paso a paso
npx playwright test --debug

# Ver navegador durante ejecución
npx playwright test --headed

# Ver logs detallados
DEBUG=pw:api npx playwright test
```

## 📝 Añadir Nuevos Tests

1. Crear archivo en `tests/e2e/`
2. Importar: `import { test, expect } from '@playwright/test';`
3. Usar `test.beforeEach` para setup común
4. Escribir tests descriptivos

Ejemplo:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Mi Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mi-feature');
  });

  test('should do something', async ({ page }) => {
    await expect(page.locator('text=Título')).toBeVisible();
  });
});
```

## 🔄 CI/CD

Los tests E2E se ejecutan automáticamente en:
- Push a `main` o `develop`
- Pull Requests a `main` o `develop`

Ver workflow: `.github/workflows/playwright.yml`
