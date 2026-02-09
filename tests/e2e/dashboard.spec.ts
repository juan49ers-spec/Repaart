import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@repaart.com');
    await page.fill('input[type="password"]', 'TestPassword123');
    await page.click('button:has-text("Iniciar Sesión")');
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Resumen')).toBeVisible();
  });

  test('should navigate to schedule page', async ({ page }) => {
    await page.click('text=Horarios');
    await expect(page).toHaveURL(/.*schedule.*/);
    await expect(page.locator('text=Programación')).toBeVisible();
  });

  test('should navigate to finance page', async ({ page }) => {
    await page.click('text=Finanzas');
    await expect(page).toHaveURL(/.*finance.*/);
    await expect(page.locator('text=Finanzas')).toBeVisible();
  });

  test('should navigate to riders page', async ({ page }) => {
    await page.click('text=Riders');
    await expect(page).toHaveURL(/.*riders.*/);
    await expect(page.locator('text=Riders')).toBeVisible();
  });

  test('should navigate to fleet page', async ({ page }) => {
    await page.click('text=Flota');
    await expect(page).toHaveURL(/.*fleet.*/);
    await expect(page.locator('text=Flota')).toBeVisible();
  });

  test('should display user menu', async ({ page }) => {
    await page.click('[data-testid="user-menu"]').catch(async () => {
      // Fallback si no hay data-testid
      await page.click('text=Perfil');
    });
    
    await expect(page.locator('text=Cerrar Sesión')).toBeVisible();
  });
});
