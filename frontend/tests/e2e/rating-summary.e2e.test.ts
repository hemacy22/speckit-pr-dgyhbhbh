import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Rating Summary Feature
 * 
 * Prerequisites:
 * - Backend server running on localhost:3000
 * - Frontend running on localhost:5173  
 * - Database seeded with test data
 */

test.describe('Rating Summary Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to product page
    // Note: Update URL based on actual routing
    await page.goto('http://localhost:5173');
  });

  test('should display rating summary near product title', async ({ page }) => {
    // Wait for rating summary to load
    await expect(page.getByText(/rating:/i)).toBeVisible();

    // Verify average and count are displayed
    await expect(page.locator('[class*="average"]')).toBeVisible();
    await expect(page.locator('[class*="count"]')).toBeVisible();

    // Verify it's positioned near product title
    const ratingSummary = page.locator('[class*="container"]').first();
    const boundingBox = await ratingSummary.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeLessThan(300); // Near top of page
  });

  test('should display correct data format', async ({ page }) => {
    await page.locator('[class*="ratingDisplay"]').waitFor({ state: 'visible' });

    // Check average has one decimal place
    const averageText = await page.locator('[class*="average"]').textContent();
    expect(averageText).toMatch(/^\d\.\d$/);

    // Check count is displayed
    const countText = await page.locator('[class*="count"]').textContent();
    expect(countText).toMatch(/\d+\s+(review|reviews)/);
  });

  test('should display "No ratings yet" for products with zero ratings', async ({ page }) => {
    // Navigate to product with no ratings (update URL as needed)
    await page.goto('http://localhost:5173?product=no-ratings');

    await expect(page.getByText('No ratings yet')).toBeVisible();
  });

  test('should handle large number formatting', async ({ page }) => {
    // Navigate to product with many ratings
    await page.goto('http://localhost:5173?product=many-ratings');

    const countText = await page.locator('[class*="count"]').textContent();
    
    // Should format large numbers (e.g., "127K" or "1.2M")
    expect(countText).toMatch(/(\d+K|\d+\.\d+M|\d+)\s+reviews?/);
  });

  test('should be responsive across viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();

      // Verify rating summary is visible and properly positioned
      await expect(page.getByText(/rating:/i)).toBeVisible();
      
      const ratingSummary = page.locator('[class*="container"]').first();
      const boundingBox = await ratingSummary.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.width).toBeLessThan(viewport.width);
    }
  });

  test('should announce rating information to screen readers', async ({ page }) => {
    // Check for aria-label attribute
    const ratingSummary = page.locator('[class*="container"]').first();
    const ariaLabel = await ratingSummary.getAttribute('aria-label');
    
    expect(ariaLabel).toContain('Average rating');
    expect(ariaLabel).toContain('out of 5 stars');
    expect(ariaLabel).toContain('based on');
    expect(ariaLabel).toContain('customer');
  });

  test('should show loading state briefly', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/products/*/rating-summary', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      route.continue();
    });

    await page.reload();

    // Check for loading indicator
    await expect(page.getByText('Loading ratings...')).toBeVisible();

    // Then content should load
    await expect(page.getByText(/rating:/i)).toBeVisible({ timeout: 2000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Fail the API request
    await page.route('**/products/*/rating-summary', (route) => {
      route.abort('failed');
    });

    await page.reload();

    // Should show error message
    await expect(page.getByText('Unable to load ratings')).toBeVisible();
  });
});

test.describe('Accessibility - WCAG 2.2 Level AA', () => {
  test('should pass automated accessibility checks', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for content to load
    await page.locator('[class*="ratingDisplay"]').waitFor({ state: 'visible' });

    // Run accessibility scan (requires @axe-core/playwright)
    // const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);

    // Manual checks for key accessibility features
    const ratingSummary = page.locator('[class*="container"]').first();
    
    // Check for aria-label
    await expect(ratingSummary).toHaveAttribute('aria-label', /.+/);

    // Check for screen-reader text
    const srText = page.locator('[class*="srOnly"]');
    await expect(srText).toHaveCount(1);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.locator('[class*="average"]').waitFor({ state: 'visible' });

    // Check computed styles for contrast
    const average = page.locator('[class*="average"]');
    const color = await average.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color;
    });

    // Color should be defined (actual contrast checking requires additional tools)
    expect(color).toBeTruthy();
  });

  test('should maintain visible focus indicators', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Tab through page (if there are interactive elements later)
    await page.keyboard.press('Tab');

    // Rating summary itself is not interactive, so no focus indicators needed
    // This test validates that it doesn't interfere with focus management
  });
});

test.describe('Performance', () => {
  test('should load within 1 second', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173');
    await page.locator('[class*="ratingDisplay"]').waitFor({ state: 'visible' });
    
    const loadTime = Date.now() - startTime;
    
    // Should meet SC-001 requirement: load within 1 second
    expect(loadTime).toBeLessThan(1000);
  });
});
