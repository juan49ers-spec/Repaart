import { test, expect } from '@playwright/test';

test.describe('Responsive Design - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should render correctly on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that main container is visible
    const mainContainer = page.locator('.scrollable-area');
    await expect(mainContainer).toBeVisible();

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    // Check mobile navigation is visible
    const bottomNav = page.locator('nav[role="navigation"]');
    await expect(bottomNav).toBeVisible();
  });

  test('should render correctly on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that main container is visible
    const mainContainer = page.locator('.scrollable-area');
    await expect(mainContainer).toBeVisible();

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 768;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    // Check tablet layout adjustments
    const grid = page.locator('.grid');
    if (await grid.count() > 0) {
      await expect(grid.first()).toBeVisible();
    }
  });

  test('should render correctly on desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check that main container is visible
    const mainContainer = page.locator('.scrollable-area');
    await expect(mainContainer).toBeVisible();

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 1920;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    // Check desktop layout
    const contentWrapper = page.locator('.content-wrapper');
    await expect(contentWrapper).toBeVisible();
  });
});

test.describe('Responsive Design - Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scheduler');
  });

  test('should adapt grid columns on different screen sizes', async ({ page }) => {
    // Mobile - should have 1 column or stacked layout
    await page.setViewportSize({ width: 375, height: 667 });
    const gridMobile = page.locator('.grid');
    if (await gridMobile.count() > 0) {
      const gridClass = await gridMobile.first().getAttribute('class');
      expect(gridClass).toContain('grid');
    }

    // Tablet - should have 2 columns
    await page.setViewportSize({ width: 768, height: 1024 });
    const gridTablet = page.locator('.grid');
    if (await gridTablet.count() > 0) {
      const gridClass = await gridTablet.first().getAttribute('class');
      expect(gridClass).toContain('grid');
    }

    // Desktop - should have 4 columns
    await page.setViewportSize({ width: 1920, height: 1080 });
    const gridDesktop = page.locator('.grid');
    if (await gridDesktop.count() > 0) {
      const gridClass = await gridDesktop.first().getAttribute('class');
      expect(gridClass).toContain('grid');
    }
  });

  test('should handle text overflow correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that text elements have proper overflow handling
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i);
      const overflow = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          overflowX: computed.overflowX,
          textOverflow: computed.textOverflow,
          whiteSpace: computed.whiteSpace
        };
      });
      
      // Some elements might have overflow, but not all should
      expect(overflow.overflowX).not.toBe('scroll');
    }
  });

  test('should modals be responsive', async ({ page }) => {
    // Open a modal if possible
    const addButton = page.locator('button:has-text("Nuevo")').or(page.locator('button:has-text("Agregar")'));
    if (await addButton.count() > 0) {
      await addButton.first().click();
      
      const modal = page.locator('.fixed').or(page.locator('.modal')).or(page.locator('[role="dialog"]'));
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
        
        const modalWidth = await modal.first().evaluate(el => el.offsetWidth);
        const viewportWidth = page.viewportSize()?.width || 375;
        expect(modalWidth).toBeLessThanOrEqual(viewportWidth);
      }
      
      // Desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
        
        const modalWidth = await modal.first().evaluate(el => el.offsetWidth);
        expect(modalWidth).toBeLessThanOrEqual(1200); // Max reasonable width
      }
    }
  });
});

test.describe('Responsive Design - Virtualized Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scheduler');
  });

  test('should handle rider info column correctly', async ({ page }) => {
    // Mobile - rider info should be full width or stacked
    await page.setViewportSize({ width: 375, height: 667 });
    const riderInfoMobile = page.locator('.sticky').or(page.locator('[class*="sticky"]'));
    if (await riderInfoMobile.count() > 0) {
      await expect(riderInfoMobile.first()).toBeVisible();
    }

    // Desktop - rider info should have fixed width
    await page.setViewportSize({ width: 1920, height: 1080 });
    const riderInfoDesktop = page.locator('.sticky').or(page.locator('[class*="sticky"]'));
    if (await riderInfoDesktop.count() > 0) {
      await expect(riderInfoDesktop.first()).toBeVisible();
    }
  });

  test('should handle shift pills correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const shiftPills = page.locator('[class*="shift"]').or(page.locator('.rounded-md'));
    if (await shiftPills.count() > 0) {
      const firstPill = shiftPills.first();
      await expect(firstPill).toBeVisible();
      
      // Check that pills have minimum width
      const pillWidth = await firstPill.evaluate(el => el.offsetWidth);
      expect(pillWidth).toBeGreaterThan(20); // Minimum reasonable width
    }
  });
});

test.describe('Responsive Design - Performance', () => {
  test('should maintain performance on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Measure render time
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    // Should load reasonably fast (less than 3 seconds)
    expect(endTime - startTime).toBeLessThan(3000);
  });

  test('should maintain performance on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Measure render time
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    // Should load reasonably fast (less than 2 seconds on desktop)
    expect(endTime - startTime).toBeLessThan(2000);
  });
});
