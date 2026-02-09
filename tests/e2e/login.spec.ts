import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Verificar que el formulario de login está visible
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Llenar formulario con credenciales inválidas
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Verificar mensaje de error
    await expect(page.getByText(/credenciales inválidas|error/i)).toBeVisible();
  });

  test('should navigate to dashboard on successful login', async ({ page }) => {
    // Nota: Este test requiere credenciales de prueba válidas
    // Usar variables de entorno o mock en CI
    const testEmail = process.env.TEST_USER_EMAIL || 'test@repaart.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/contraseña/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.getByText(/bienvenido|dashboard/i)).toBeVisible();
  });

  test('should have working password visibility toggle', async ({ page }) => {
    const passwordInput = page.getByLabel(/contraseña/i);
    
    // Verificar que el campo es tipo password por defecto
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click en el botón de mostrar contraseña (si existe)
    const toggleButton = page.getByRole('button', { name: /mostrar|ocultar/i });
    if (await toggleButton.isVisible().catch(() => false)) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});
