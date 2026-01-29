import { test, expect } from '@playwright/test';

test.describe('Academy - Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Go to academy page
    await page.goto('/academy');
  });

  test('should display modules list', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that modules are displayed
    const modulesContainer = page.locator('.grid');
    await expect(modulesContainer).toBeVisible();

    // Check that module cards exist
    const moduleCards = page.locator('button:has-text("Comenzar")').or(page.locator('button:has-text("Continuar")'));
    
    if (await moduleCards.count() > 0) {
      await expect(moduleCards.first()).toBeVisible();
      await expect(moduleCards.first()).toContainText(/Comenzar|Continuar/);
    }
  });

  test('should navigate to module detail', async ({ page }) => {
    // Find first module card
    const moduleCard = page.locator('button:has-text("Comenzar")').or(page.locator('button:has-text("Continuar")'));
    
    if (await moduleCard.count() > 0) {
      await moduleCard.first().click();
      
      // Wait for navigation
      await page.waitForURL(/\/academy\/[a-zA-Z0-9]+/);
      
      // Check that lessons grid is displayed
      const lessonsGrid = page.locator('.grid');
      await expect(lessonsGrid).toBeVisible();
    }
  });

  test('should display lesson cards', async ({ page }) => {
    // Navigate to first module
    const moduleCard = page.locator('button:has-text("Comenzar")').or(page.locator('button:has-text("Continuar")'));
    
    if (await moduleCard.count() > 0) {
      await moduleCard.first().click();
      await page.waitForLoadState('networkidle');

      // Check for lesson cards
      const lessonCards = page.locator('.aspect-video').or(page.locator('[class*="aspect"]'));
      
      if (await lessonCards.count() > 0) {
        await expect(lessonCards.first()).toBeVisible();
      }
    }
  });

  test('should open lesson detail', async ({ page }) => {
    // Navigate to first module
    const moduleCard = page.locator('button:has-text("Comenzar")').or(page.locator('button:has-text("Continuar")'));
    
    if (await moduleCard.count() > 0) {
      await moduleCard.first().click();
      await page.waitForLoadState('networkidle');

      // Click on first lesson
      const lessonCard = page.locator('button').filter({ hasText: /Video|Texto/ }).first();
      
      if (await lessonCard.count() > 0) {
        await lessonCard.click();
        await page.waitForLoadState('networkidle');

        // Check that lesson detail is displayed
        const videoPlayer = page.locator('iframe[src*="youtube"]').or(page.locator('[class*="video-container"]'));
        const contentSection = page.locator('[class*="academy-content-section"]').or(page.locator('.prose'));
        
        const hasVideo = await videoPlayer.count() > 0;
        const hasContent = await contentSection.count() > 0;
        
        expect(hasVideo || hasContent).toBeTruthy();
      }
    }
  });

  test('should handle mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/academy');
    await page.waitForLoadState('networkidle');

    // Check mobile header
    const mobileHeader = page.locator('.lg\\:hidden');
    await expect(mobileHeader).toBeVisible();

    // Check that sidebar is hidden on mobile
    const sidebar = page.locator('.hidden.lg\\:flex');
    await expect(sidebar).toHaveCount(0);

    // Check that main content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should handle tablet view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/academy');
    await page.waitForLoadState('networkidle');

    // Check that content adapts
    const grid = page.locator('.grid');
    if (await grid.count() > 0) {
      await expect(grid.first()).toBeVisible();
    }

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 768;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('should handle dark mode', async ({ page }) => {
    // Toggle dark mode via system preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/academy');
    await page.waitForLoadState('networkidle');

    // Check that dark mode classes are applied
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
  });
});

test.describe('Academy Admin - Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Go to admin academy page
    await page.goto('/admin/academy');
  });

  test('should display overview stats', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for stats cards
    const statCards = page.locator('.bg-white').or(page.locator('[class*="bg-slate"]'));
    await expect(statCards.first()).toBeVisible();

    // Check for "Gestionar Módulos" button
    const manageButton = page.locator('button:has-text("Gestionar Módulos")');
    if (await manageButton.count() > 0) {
      await expect(manageButton).toBeVisible();
    }
  });

  test('should display modules grid', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on "Gestionar Módulos" if available
    const manageButton = page.locator('button:has-text("Gestionar Módulos")');
    if (await manageButton.count() > 0) {
      await manageButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Check for modules grid
    const modulesGrid = page.locator('.grid');
    await expect(modulesGrid).toBeVisible();

    // Check for module cards
    const moduleCards = page.locator('button');
    if (await moduleCards.count() > 0) {
      await expect(moduleCards.first()).toBeVisible();
    }
  });

  test('should create new module', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Navigate to modules view
    const manageButton = page.locator('button:has-text("Gestionar Módulos")');
    if (await manageButton.count() > 0) {
      await manageButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Check for "Nuevo módulo" or similar button
    const createButton = page.locator('button:has-text("Nuevo")').or(page.locator('button:has-text("Crear")'));
    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible();
      // Note: We don't actually create the module to avoid modifying data
    }
  });

  test('should display lessons list for module', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first module card and click it
    const moduleCard = page.locator('button').first();
    
    if (await moduleCard.count() > 0) {
      await moduleCard.click();
      await page.waitForLoadState('networkidle');

      // Check for lessons section
      const lessonsSection = page.locator('[class*="lesson"]').or(page.locator('.space-y'));
      if (await lessonsSection.count() > 0) {
        await expect(lessonsSection.first()).toBeVisible();
      }
    }
  });

  test('should handle responsive admin layout', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    const bodyWidthDesktop = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidthDesktop = page.viewportSize()?.width || 1920;
    expect(bodyWidthDesktop).toBeLessThanOrEqual(viewportWidthDesktop);
  });
});

test.describe('Academy - Performance', () => {
  test('should load academy page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/academy');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    // Should load in less than 3 seconds
    expect(endTime - startTime).toBeLessThan(3000);
  });

  test('should load admin academy page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin/academy');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    // Should load in less than 3 seconds
    expect(endTime - startTime).toBeLessThan(3000);
  });
});
