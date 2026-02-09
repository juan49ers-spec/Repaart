import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main sections', async ({ page }) => {
    // Asumimos que el usuario ya está logueado
    await page.goto('/dashboard');
    
    // Verificar que estamos en el dashboard
    await expect(page.getByText(/dashboard|inicio/i)).toBeVisible();
    
    // Navegar a otra sección (ejemplo: finanzas)
    await page.getByRole('link', { name: /finanzas|finance/i }).click();
    await expect(page).toHaveURL(/.*finance.*/);
    
    // Navegar a otra sección (ejemplo: flota)
    await page.getByRole('link', { name: /flota|fleet/i }).click();
    await expect(page).toHaveURL(/.*fleet.*/);
  });

  test('should show 404 for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Verificar página 404
    await expect(page.getByText(/404|página no encontrada/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /volver|inicio/i })).toBeVisible();
  });

  test('should maintain session on page refresh', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@repaart.com');
    await page.getByLabel(/contraseña/i).fill('testpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar a que cargue el dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Refrescar página
    await page.reload();
    
    // Verificar que sigue logueado
    await expect(page.getByText(/bienvenido|dashboard/i)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Verificar que hay menú hamburguesa o navegación móvil
    const mobileMenu = page.getByRole('button', { name: /menú|menu/i });
    if (await mobileMenu.isVisible().catch(() => false)) {
      await mobileMenu.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});
