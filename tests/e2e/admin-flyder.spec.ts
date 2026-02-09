import { test, expect } from '@playwright/test';

test.describe('Admin Flyder Module - Hyper-Vision', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar directamente al módulo Flyder
    // En un entorno real, deberías usar storageState para autenticación
    await page.goto('/admin/flyder');
    
    // Si redirige a login, hacer login
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'admin@repaart.com');
      await page.fill('input[type="password"]', 'AdminPass123');
      await page.click('button:has-text("Iniciar Sesión")');
      await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
      await page.goto('/admin/flyder');
    }
    
    // Esperar a que cargue el módulo
    await expect(page.locator('text=Admin Flyder')).toBeVisible({ timeout: 10000 });
  });

  test.describe('Navigation and Layout', () => {
    test('should display all three pillars in sidebar', async ({ page }) => {
      await expect(page.locator('text=Control Horario')).toBeVisible();
      await expect(page.locator('text=Fleet Intelligence')).toBeVisible();
      await expect(page.locator('text=Facturación')).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
      // Verificar que empieza en Control Horario
      await expect(page.locator('text=Gestión de turnos y horas trabajadas')).toBeVisible();
      
      // Click en Fleet Intelligence
      await page.click('text=Fleet Intelligence');
      await expect(page.locator('text=Análisis operativo y alertas')).toBeVisible();
      
      // Click en Facturación
      await page.click('text=Facturación');
      await expect(page.locator('text=Gestión de nóminas y cierres mensuales')).toBeVisible();
      
      // Volver a Control Horario
      await page.click('text=Control Horario');
      await expect(page.locator('text=Gestión de turnos y horas trabajadas')).toBeVisible();
    });

    test('should display franchise info if available', async ({ page }) => {
      // Verificar que se muestra la sección de franquicia
      await expect(page.locator('text=Franquicia')).toBeVisible();
    });
  });

  test.describe('Time Control Dashboard', () => {
    test('should display date picker', async ({ page }) => {
      await expect(page.locator('input[type="date"]')).toBeVisible();
    });

    test('should display metrics cards', async ({ page }) => {
      await expect(page.locator('text=Riders Activos')).toBeVisible();
      await expect(page.locator('text=Horas Totales')).toBeVisible();
      await expect(page.locator('text=Total Riders')).toBeVisible();
      await expect(page.locator('text=Turnos Completados')).toBeVisible();
    });

    test('should display worked hours table', async ({ page }) => {
      await expect(page.locator('text=Horas Trabajadas')).toBeVisible();
      await expect(page.locator('th:has-text("Rider")')).toBeVisible();
      await expect(page.locator('th:has-text("Turnos")')).toBeVisible();
      await expect(page.locator('th:has-text("Horas Totales")')).toBeVisible();
    });

    test('should refresh data on button click', async ({ page }) => {
      await page.click('button[title="Actualizar"]');
      // Verificar que no hay error después de refrescar
      await expect(page.locator('text=Error al cargar datos')).not.toBeVisible();
    });
  });

  test.describe('Fleet Intelligence Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Fleet Intelligence');
    });

    test('should display date picker', async ({ page }) => {
      await expect(page.locator('input[type="date"]')).toBeVisible();
    });

    test('should display metrics cards', async ({ page }) => {
      await expect(page.locator('text=Riders Activos')).toBeVisible();
      await expect(page.locator('text=Turnos Completados')).toBeVisible();
      await expect(page.locator('text=Horas Promedio')).toBeVisible();
      await expect(page.locator('text=Eficiencia')).toBeVisible();
    });

    test('should display top performers section', async ({ page }) => {
      await expect(page.locator('text=Top Performers')).toBeVisible();
    });

    test('should display franchise coverage section', async ({ page }) => {
      await expect(page.locator('text=Cobertura por Franquicia')).toBeVisible();
    });

    test('should display hourly demand chart', async ({ page }) => {
      await expect(page.locator('text=Demanda por Hora')).toBeVisible();
    });
  });

  test.describe('Billing Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Facturación');
    });

    test('should display month picker', async ({ page }) => {
      await expect(page.locator('input[type="month"]')).toBeVisible();
    });

    test('should open config modal', async ({ page }) => {
      await page.click('text=Configurar');
      await expect(page.locator('text=Configuración de Tarifas')).toBeVisible();
      await expect(page.locator('label:has-text("Tarifa por Hora")')).toBeVisible();
      await expect(page.locator('label:has-text("Tarifa por KM")')).toBeVisible();
      await expect(page.locator('label:has-text("Retención IRPF")')).toBeVisible();
    });

    test('should close config modal on cancel', async ({ page }) => {
      await page.click('text=Configurar');
      await expect(page.locator('text=Configuración de Tarifas')).toBeVisible();
      
      await page.click('text=Cancelar');
      await expect(page.locator('text=Configuración de Tarifas')).not.toBeVisible();
    });

    test('should generate monthly closure', async ({ page }) => {
      await page.click('text=Generar Cierre');
      
      // Verificar que aparecen las métricas después de generar
      await expect(page.locator('text=Riders')).toBeVisible();
      await expect(page.locator('text=Horas Totales')).toBeVisible();
      await expect(page.locator('text=Total Bruto')).toBeVisible();
      await expect(page.locator('text=Total Neto')).toBeVisible();
    });

    test('should display riders table after generating closure', async ({ page }) => {
      await page.click('text=Generar Cierre');
      await expect(page.locator('text=Detalle por Rider')).toBeVisible();
      
      // Verificar columnas de la tabla
      await expect(page.locator('th:has-text("Rider")')).toBeVisible();
      await expect(page.locator('th:has-text("Horas")')).toBeVisible();
      await expect(page.locator('th:has-text("Pedidos")')).toBeVisible();
      await expect(page.locator('th:has-text("Neto")')).toBeVisible();
    });

    test('should export to Excel', async ({ page }) => {
      await page.click('text=Generar Cierre');
      
      // Esperar a que el botón de exportar esté disponible
      await expect(page.locator('text=Exportar Excel')).toBeVisible();
      
      // Click en exportar (no podemos verificar la descarga real en CI)
      await page.click('text=Exportar Excel');
      
      // Verificar que el botón muestra estado de carga o vuelve a la normalidad
      await expect(page.locator('text=Exportando...')).toBeVisible();
    });

    test('should save config changes', async ({ page }) => {
      await page.click('text=Configurar');
      
      // Modificar valores
      await page.fill('input[id="hourly-rate"]', '15.00');
      await page.fill('input[id="km-rate"]', '0.75');
      await page.fill('input[id="irpf-rate"]', '20');
      
      // Guardar
      await page.click('text=Guardar');
      
      // Verificar que el modal se cierra
      await expect(page.locator('text=Configuración de Tarifas')).not.toBeVisible();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should show mobile header on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/flyder');
      
      // Verificar que se muestra el header móvil
      await expect(page.locator('button[aria-label="Abrir menú"]')).toBeVisible();
    });

    test('should toggle sidebar on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/flyder');
      
      // Abrir menú
      await page.click('button[aria-label="Abrir menú"]');
      await expect(page.locator('button[aria-label="Cerrar menú"]')).toBeVisible();
      
      // Cerrar menú
      await page.click('button[aria-label="Cerrar menú"]');
      await expect(page.locator('button[aria-label="Abrir menú"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should display error state when data fails to load', async ({ page }) => {
      // Simular error bloqueando la red
      await page.route('**/firestore/**', route => route.abort());
      await page.reload();
      
      await expect(page.locator('text=Error al cargar datos')).toBeVisible();
      await expect(page.locator('text=Reintentar')).toBeVisible();
    });

    test('should recover from error on retry', async ({ page }) => {
      // Simular error
      await page.route('**/firestore/**', route => route.abort());
      await page.reload();
      
      // Quitar el bloqueo
      await page.unroute('**/firestore/**');
      
      // Reintentar
      await page.click('text=Reintentar');
      
      // Verificar que ya no hay error
      await expect(page.locator('text=Error al cargar datos')).not.toBeVisible();
    });
  });
});
