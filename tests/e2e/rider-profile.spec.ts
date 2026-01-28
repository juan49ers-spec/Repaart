import { test, expect } from '@playwright/test';

test.describe('Rider Profile', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/rider/profile');
    });

    test('should display rider profile header', async ({ page }) => {
        await expect(page.locator('text=Rider')).toBeVisible();
        await expect(page.locator('text=PROFESIONAL LOGÍSTICA')).toBeVisible();
    });

    test('should display performance overview section', async ({ page }) => {
        await expect(page.locator('text=Rendimiento Semanal')).toBeVisible();
        await expect(page.locator('.rider-stats-overview')).toBeVisible();
    });

    test('should display quick actions', async ({ page }) => {
        await expect(page.locator('text=Mis Turnos')).toBeVisible();
        await expect(page.locator('text=Disponibilidad')).toBeVisible();
    });

    test('should navigate to schedule page', async ({ page }) => {
        await page.click('text=Mis Turnos');
        await expect(page).toHaveURL('/rider/schedule');
    });

    test('should navigate to availability page', async ({ page }) => {
        await page.click('text=Disponibilidad');
        await expect(page).toHaveURL('/rider/availability');
    });

    test('should navigate to personal data page', async ({ page }) => {
        await page.click('text=Datos Personales');
        await expect(page).toHaveURL('/rider/profile/personal');
    });

    test('should navigate to notifications page', async ({ page }) => {
        await page.click('text=Notificaciones');
        await expect(page).toHaveURL('/rider/profile/notifications');
    });

    test('should navigate to security page', async ({ page }) => {
        await page.click('text=Seguridad y Acceso');
        await expect(page).toHaveURL('/rider/profile/security');
    });

    test('should display account settings section', async ({ page }) => {
        await expect(page.locator('text=Configuración de cuenta')).toBeVisible();
    });

    test('should display support section', async ({ page }) => {
        await expect(page.locator('text=Soporte')).toBeVisible();
    });

    test('should open support email', async ({ page }) => {
        const context = page.context();
        const pagePromise = context.waitForEvent('page');
        await page.click('text=Centro de Ayuda');
        const newPage = await pagePromise;
        await expect(newPage).toHaveURL(/^mailto:/);
    });

    test('should confirm logout', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await page.click('text=Cerrar Sesión');
        await expect(page).toHaveURL('/login');
    });
});

test.describe('Rider Availability', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/rider/availability');
    });

    test('should display availability view', async ({ page }) => {
        await expect(page.locator('text=Mi Disponibilidad')).toBeVisible();
        await expect(page.locator('text=Configura tu disponibilidad semanal para recibir asignaciones de turnos')).toBeVisible();
    });

    test('should display availability status toggle', async ({ page }) => {
        await expect(page.locator('text=Estado de Disponibilidad')).toBeVisible();
        await expect(page.locator('text=Disponible para turnos')).toBeVisible();
    });

    test('should display weekly goal section', async ({ page }) => {
        await expect(page.locator('text=Objetivo Semanal')).toBeVisible();
    });

    test('should display weekly schedule section', async ({ page }) => {
        await expect(page.locator('text=Horario Semanal')).toBeVisible();
    });

    test('should display all days of week', async ({ page }) => {
        await expect(page.locator('text=Lunes')).toBeVisible();
        await expect(page.locator('text=Martes')).toBeVisible();
        await expect(page.locator('text=Miércoles')).toBeVisible();
        await expect(page.locator('text=Jueves')).toBeVisible();
        await expect(page.locator('text=Viernes')).toBeVisible();
        await expect(page.locator('text=Sábado')).toBeVisible();
        await expect(page.locator('text=Domingo')).toBeVisible();
    });

    test('should toggle availability status', async ({ page }) => {
        const toggleButton = page.locator('text=Disponible para turnos').locator('..');
        await toggleButton.click();
        await expect(page.locator('text=No disponible temporalmente')).toBeVisible();
    });

    test('should update weekly goal', async ({ page }) => {
        const slider = page.locator('input[type="range"]');
        await slider.fill('45');
        await expect(page.locator('text=45h')).toBeVisible();
    });
});

test.describe('Rider Schedule', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/rider/schedule');
    });

    test('should display schedule view', async ({ page }) => {
        await expect(page.locator('.mobile-agenda-view')).toBeVisible();
    });

    test('should display week navigation', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Semana anterior' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Semana siguiente' })).toBeVisible();
    });

    test('should display total hours metric', async ({ page }) => {
        await expect(page.locator('text=HORAS')).toBeVisible();
    });
});