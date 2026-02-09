import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('complete login and view dashboard', async ({ page }) => {
    // 1. Ir a login
    await page.goto('/login');
    
    // 2. Login con credenciales
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@repaart.com');
    await page.getByLabel(/contraseña/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // 3. Verificar dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.getByText(/bienvenido|dashboard/i)).toBeVisible();
    
    // 4. Verificar que hay datos cargados
    await expect(page.locator('body')).not.toHaveText(/cargando|loading/i, { timeout: 5000 });
  });

  test('create and view a new record', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@repaart.com');
    await page.getByLabel(/contraseña/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Navegar a sección donde se pueden crear registros
    await page.getByRole('link', { name: /finanzas|finance/i }).click();
    
    // Click en crear nuevo
    await page.getByRole('button', { name: /nuevo|crear|agregar/i }).first().click();
    
    // Llenar formulario
    await page.getByLabel(/monto|amount/i).fill('100');
    await page.getByLabel(/descripción|description/i).fill('Test transaction');
    
    // Guardar
    await page.getByRole('button', { name: /guardar|save/i }).click();
    
    // Verificar que se creó
    await expect(page.getByText(/test transaction|éxito|success/i)).toBeVisible();
  });

  test('search functionality works', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@repaart.com');
    await page.getByLabel(/contraseña/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Ir a una sección con búsqueda
    await page.goto('/fleet');
    
    // Buscar
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Verificar resultados
      await expect(page.locator('body')).not.toHaveText(/no hay resultados|no results found/i);
    }
  });

  test('logout flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@repaart.com');
    await page.getByLabel(/contraseña/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Logout
    await page.getByRole('button', { name: /perfil|usuario|account/i }).click();
    await page.getByRole('menuitem', { name: /cerrar sesión|logout/i }).click();
    
    // Verificar redirección a login
    await expect(page).toHaveURL(/.*login.*/);
  });
});
