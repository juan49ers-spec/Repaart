import { test, expect } from '@playwright/test';

test.describe('Finance Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login y navegar a finanzas
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@repaart.com');
    await page.fill('input[type="password"]', 'TestPassword123');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.click('text=Finanzas');
    await expect(page).toHaveURL(/.*finance.*/);
  });

  test('should display finance dashboard', async ({ page }) => {
    await expect(page.locator('text=Finanzas')).toBeVisible();
    await expect(page.locator('text=Resumen')).toBeVisible();
  });

  test('should create income record', async ({ page }) => {
    // Click en agregar ingreso
    await page.click('text=Nuevo Ingreso');
    
    // Llenar formulario
    await page.fill('input[name="amount"]', '1000');
    await page.fill('input[name="description"]', 'Venta del día');
    await page.selectOption('select[name="category"]', 'ventas');
    
    // Guardar
    await page.click('button:has-text("Guardar")');
    
    // Verificar
    await expect(page.locator('text=Registro creado')).toBeVisible();
  });

  test('should create expense record', async ({ page }) => {
    // Click en agregar gasto
    await page.click('text=Nuevo Gasto');
    
    // Llenar formulario
    await page.fill('input[name="amount"]', '500');
    await page.fill('input[name="description"]', 'Combustible');
    await page.selectOption('select[name="category"]', 'combustible');
    
    // Guardar
    await page.click('button:has-text("Guardar")');
    
    // Verificar
    await expect(page.locator('text=Registro creado')).toBeVisible();
  });

  test('should display financial charts', async ({ page }) => {
    await expect(page.locator('.chart, [class*="chart"], canvas')).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    // Seleccionar rango de fechas
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.first().fill('2024-01-01');
    await dateInputs.nth(1).fill('2024-01-31');
    
    // Aplicar filtro
    await page.click('button:has-text("Filtrar")');
    
    // Verificar resultados filtrados
    await expect(page.locator('text=Enero')).toBeVisible();
  });
});
