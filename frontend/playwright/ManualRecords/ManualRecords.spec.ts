import { test, expect } from '@playwright/test';

interface MockManualRecord {
  id: number;
  dar_id: string;
  title: string;
  created_at: string;
  created_by: string | null;
}

const mockManualRecords: MockManualRecord[] = [];
for (let i = 1; i <= 15; i++) {
  mockManualRecords.push({
    id: i,
    dar_id: `manual-dar-id-${i}`,
    title: `Manual Record ${i}`,
    created_at: new Date(2024, 0, i).toISOString(),
    created_by: `user${i % 3}`,
  });
}

test.describe('Manual Records Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/manual-records**', async (route) => {
      const url = new URL(route.request().url());
      const pageParam = parseInt(url.searchParams.get('page') || '1');
      const sizeParam = parseInt(url.searchParams.get('size') || '10');
      const titleParam = url.searchParams.get('title') || '';

      let filteredRecords = [...mockManualRecords];

      if (titleParam) {
        filteredRecords = filteredRecords.filter((r) => r.title.toLowerCase().includes(titleParam.toLowerCase()));
      }

      const totalCount = filteredRecords.length;
      const totalPages = Math.ceil(totalCount / sizeParam);
      const paginatedRecords = filteredRecords.slice((pageParam - 1) * sizeParam, pageParam * sizeParam);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: paginatedRecords,
          totalCount,
          currentPage: pageParam,
          totalPages,
        }),
      });
    });

    await page.goto('/manual_records');
  });

  test('should display page header and create button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Manual Records/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Record/i })).toBeVisible();

    const oarAssetsButtons = page.getByRole('button', { name: 'Manage OAR Assets' }).first();
    const count = await oarAssetsButtons.count();
    expect(count).toBeGreaterThan(0);

    await expect(page.getByText('Manual Record 1').first()).toBeVisible();

    const searchInput = page.getByPlaceholder(/Search by title/i);
    await searchInput.fill('Manual Record 1');
    const searchButton = page.getByRole('button').filter({ hasText: /^$/ });
    await searchButton.click();
    await expect(page.getByText('Manual Record 1').first()).toBeVisible();
    await expect(page.getByText('Manual Record 10')).toBeVisible();

    const editButton = page.getByRole('button', { name: /Edit/i }).first();
    await editButton.click();

    await page.waitForURL(/\/manual-dar-id-\d+\/edit/);
    expect(page.url()).toMatch(/\/manual-dar-id-\d+\/edit/);
    await page.goto('/manual_records');

    const oarButton = page.getByRole('button', { name: /Manage OAR Assets/i }).first();
    await oarButton.click();
    await expect(page.getByText('Online services and data')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    await searchInput.fill('aaaaaaaaaa');
    await searchButton.click();
    await expect(page.getByText('Manual Record 1')).not.toBeVisible();
  });
});
