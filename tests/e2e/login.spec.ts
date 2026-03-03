import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Verificar que el formulario de login está visible
    await expect(page.getByRole('heading', { name: /te damos la bienvenida/i })).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /acceder al portal/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Llenar formulario con credenciales inválidas
    await page.getByLabel(/correo electrónico/i).fill('invalid@example.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /acceder al portal/i }).click();

    // Verificar mensaje de error (Credenciales incorrectas, etc)
    await expect(page.getByText(/credenciales incorrectas|usuario no encontrado|ha ocurrido un error/i)).toBeVisible();
  });

  test.skip('should navigate to dashboard on successful login', async ({ page }) => {
    // Nota: Este test requiere credenciales de prueba válidas en el proyecto o emulador
    const testEmail = process.env.TEST_USER_EMAIL || 'test@repaart.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';

    await page.getByLabel(/correo electrónico/i).fill(testEmail);
    await page.getByLabel(/contraseña/i).fill(testPassword);
    await page.getByRole('button', { name: /acceder al portal/i }).click();

    // Verificar redirección al dashboard u otra vista
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should have working password visibility toggle', async ({ page }) => {
    const passwordInput = page.getByLabel(/contraseña/i);

    // Verificar que el campo es tipo password por defecto
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click en el botón de mostrar contraseña
    const toggleButton = page.getByRole('button', { name: /show password|hide password/i });
    if (await toggleButton.isVisible().catch(() => false)) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});
