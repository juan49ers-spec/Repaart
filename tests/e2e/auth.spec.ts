import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Repaart/i);
    await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Iniciar Sesión")');
    
    await expect(page.locator('text=Error de autenticación')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Nota: Usar credenciales de test
    await page.fill('input[type="email"]', 'test@repaart.com');
    await page.fill('input[type="password"]', 'TestPassword123');
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login primero
    await page.fill('input[type="email"]', 'test@repaart.com');
    await page.fill('input[type="password"]', 'TestPassword123');
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Logout
    await page.click('text=Cerrar Sesión');
    
    // Verificar redirección a login
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
  });
});
