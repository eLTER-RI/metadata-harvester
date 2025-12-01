import { test, expect } from '@playwright/test';

test.describe('Harvest Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/harvest/**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Harvest started successfully' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/harvest');
  });

  test('should display page header and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Data Harvesting/i })).toBeVisible();
    await expect(page.getByText(/Harvest metadata from multiple repositories/i)).toBeVisible();

    const harvestAllButton = page.getByRole('button', { name: /Harvest All Repositories/i });
    await expect(harvestAllButton).toBeVisible();

    const viewHistoryButton = page.getByRole('button', { name: 'View History' });
    await expect(viewHistoryButton).toBeEnabled();

    const harvestButtons = page.getByRole('button', { name: /Start Harvest/i });
    expect(await harvestButtons.count()).toBeGreaterThanOrEqual(5);

    const firstHarvestButton = page.getByRole('button', { name: /Start Harvest/i }).first();
    await firstHarvestButton.click();
    await harvestAllButton.click();
    await expect(page.getByText(/European research data repository/i)).toBeVisible();
    await expect(page.getByText(/Juelich research data repository/i)).toBeVisible();
    await expect(page.getByText(/Zenodo eLTER community/i)).toBeVisible();
  });
});
