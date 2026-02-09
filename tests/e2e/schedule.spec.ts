import { test, expect } from '@playwright/test';

test.describe('Schedule Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login y navegar a horarios
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@repaart.com');
    await page.fill('input[type="password"]', 'TestPassword123');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.click('text=Horarios');
    await expect(page).toHaveURL(/.*schedule.*/);
  });

  test('should display schedule calendar', async ({ page }) => {
    await expect(page.locator('text=Programación')).toBeVisible();
    await expect(page.locator('.calendar, [class*="calendar"], [class*="schedule"]')).toBeVisible();
  });

  test('should create a new shift', async ({ page }) => {
    // Click en botón de agregar turno
    await page.click('text=Nuevo Turno').catch(async () => {
      await page.click('button:has-text("+")');
    });
    
    // Llenar formulario
    await page.selectOption('select[name="rider"]', 'rider1');
    await page.fill('input[name="startTime"]', '09:00');
    await page.fill('input[name="endTime"]', '17:00');
    
    // Guardar
    await page.click('button:has-text("Guardar")');
    
    // Verificar que se creó
    await expect(page.locator('text=Turno creado')).toBeVisible();
  });

  test('should edit an existing shift', async ({ page }) => {
    // Click en un turno existente
    await page.locator('.shift, [class*="shift"]').first().click();
    
    // Editar hora
    await page.fill('input[name="endTime"]', '18:00');
    
    // Guardar cambios
    await page.click('button:has-text("Guardar")');
    
    // Verificar actualización
    await expect(page.locator('text=Turno actualizado')).toBeVisible();
  });

  test('should delete a shift', async ({ page }) => {
    // Click en un turno existente
    await page.locator('.shift, [class*="shift"]').first().click();
    
    // Click en eliminar
    await page.click('button:has-text("Eliminar")');
    
    // Confirmar
    await page.click('button:has-text("Confirmar")');
    
    // Verificar eliminación
    await expect(page.locator('text=Turno eliminado')).toBeVisible();
  });

  test('should detect shift conflicts', async ({ page }) => {
    // Intentar crear turno que se solape
    await page.click('text=Nuevo Turno');
    await page.selectOption('select[name="rider"]', 'rider1');
    await page.fill('input[name="startTime"]', '10:00');
    await page.fill('input[name="endTime"]', '12:00');
    
    // Guardar
    await page.click('button:has-text("Guardar")');
    
    // Verificar mensaje de conflicto
    await expect(page.locator('text=conflicto')).toBeVisible();
  });

  test('should navigate between weeks', async ({ page }) => {
    // Click en siguiente semana
    const nextWeekButton = page.locator('button[title="Semana siguiente"], button:has-text(">")').first();
    await nextWeekButton.click();
    
    // Verificar que cambió la fecha
    await expect(page.locator('text=Semana')).toBeVisible();
  });
});
