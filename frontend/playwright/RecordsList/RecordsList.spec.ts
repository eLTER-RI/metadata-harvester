import { test, expect } from '@playwright/test';

interface MockRecord {
  dar_id: string;
  title: string;
  source_url: string;
  is_resolved: boolean;
  source_repository: string;
}

const allMockRecords: MockRecord[] = [];
for (let i = 1; i <= 25; i++) {
  allMockRecords.push({
    dar_id: `test-dar-id-${i}`,
    title: `Test Record ${i}`,
    source_url: `https://example.com/record-${i}`,
    is_resolved: i % 3 === 0,
    source_repository: i % 2 === 0 ? 'ZENODO' : 'B2SHARE_EUDAT',
  });
}

const mockFilterValues = {
  repositories: [
    { source_repository: 'ZENODO', count: 12 },
    { source_repository: 'B2SHARE_EUDAT', count: 13 },
  ],
  resolved: [
    { resolved: true, count: 8 },
    { resolved: false, count: 17 },
  ],
};

test.describe('RecordsList', () => {
  test.beforeEach(async ({ page }) => {
    // Mock records API - will be customized per test
    await page.route('**/api/records**', async (route) => {
      const url = new URL(route.request().url());
      const pageParam = parseInt(url.searchParams.get('page') || '1');
      const sizeParam = parseInt(url.searchParams.get('size') || '10');
      const titleParam = url.searchParams.get('title');
      const resolvedParam = url.searchParams.get('resolved');
      // Handle both 'repositories[]' and 'repositories' formats
      const repositoriesParam =
        url.searchParams.getAll('repositories[]').length > 0
          ? url.searchParams.getAll('repositories[]')
          : url.searchParams.getAll('repositories');

      // Start with all mock records
      let filteredRecords = [...allMockRecords];

      if (titleParam) {
        filteredRecords = filteredRecords.filter((r) => r.title.toLowerCase().includes(titleParam.toLowerCase()));
      }

      if (resolvedParam !== null) {
        const isResolved = resolvedParam === 'true';
        filteredRecords = filteredRecords.filter((r) => r.is_resolved === isResolved);
      }

      if (repositoriesParam.length > 0) {
        filteredRecords = filteredRecords.filter((r) => repositoriesParam.includes(r.source_repository));
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
          totalPages,
        }),
      });
    });

    // Mock filter values API
    await page.route('**/api/repositories**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFilterValues.repositories),
      });
    });

    await page.route('**/api/resolved**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFilterValues.resolved),
      });
    });

    // Navigate to records list page
    await page.goto('/harvested_records');
  });

  test('should display records list with pagination', async ({ page }) => {
    await test.step('Verify page loads with records', async () => {
      await expect(page.getByRole('heading', { name: 'Harvested Records' })).toBeVisible();
      await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
      await expect(page.getByText('Test Record 10')).toBeVisible();
    });

    const paginationElement = page.getByLabel('Next item');
    await expect(paginationElement).toBeVisible();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 10')).toBeVisible();

    await page.getByText('2', { exact: true }).click();

    await expect(page.getByText('Test Record 11')).toBeVisible();
    await expect(page.getByText('Test Record 20')).toBeVisible();
  });

  test('should search records by title', async ({ page }) => {
    await page.getByText('1', { exact: true }).click();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();

    const searchInput = page.getByPlaceholder('Search by title.');
    await searchInput.fill('Test Record 1');

    const searchButton = page.getByRole('button');
    await searchButton.click();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();

    await searchInput.clear();
    await page.getByRole('button').click();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
  });

  test('should filter by resolved status', async ({ page }) => {
    const statusAccordion = page.getByText('Status').first();
    await statusAccordion.click();

    const resolvedCheckbox = page.getByText('Resolved (8)');
    await resolvedCheckbox.click();

    await expect(page.getByText('Test Record 3', { exact: true })).toBeVisible();

    const unresolvedCheckbox = page.getByText('Unresolved (17)');
    await unresolvedCheckbox.click();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 2', { exact: true })).toBeVisible();

    await unresolvedCheckbox.click();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
  });

  test('should filter by repository', async ({ page }) => {
    const repositoryAccordion = page.getByText('Repository').first();
    await repositoryAccordion.click();

    const zenodoCheckbox = page.getByText(/ZENODO/i).first();
    await zenodoCheckbox.click();

    await expect(page.getByText('Test Record 2', { exact: true })).toBeVisible();

    const b2shareCheckbox = page.getByText(/B2SHARE_EUDAT/i).first();
    await b2shareCheckbox.click();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 2', { exact: true })).toBeVisible();
  });

  test('should show resolved indicator for resolved records', async ({ page }) => {
    // check that "Unresolve" button appears in Actions for this record
    const actionsButton3 = page.getByText('Actions').nth(2);
    await actionsButton3.click();
    await expect(page.getByRole('option', { name: 'Unresolve' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should have correct Detail button URL', async ({ page }) => {
    const actionsButton = page.getByText('Actions').first();
    await actionsButton.click();

    const detailLink = page.getByRole('option', { name: 'Detail' });
    await expect(detailLink).toBeVisible();
    const href = await detailLink.getAttribute('href');
    expect(href).toContain('dar.elter-ri.eu');
    expect(href).toContain('test-dar-id-1');
  });

  test('should navigate to edit page when clicking Edit button', async ({ page }) => {
    const actionsButton = page.getByText('Actions').first();
    await actionsButton.click();

    await page.getByText('Edit').first().click();
    await page.waitForURL('**/harvested_records/test-dar-id-1/edit');
    expect(page.url()).toContain('/harvested_records/test-dar-id-1/edit');
  });

  test('should show Resolve/Unresolve button based on record status', async ({ page }) => {
    // Record 1 is unresolved - should show Resolve button
    const actionsButton1 = page.getByText('Actions').first();
    await actionsButton1.click();

    await expect(page.getByRole('option', { name: 'Resolve' })).toBeVisible();

    // Record 3 is resolved - should show Unresolve button
    await page.keyboard.press('Escape');
    const actionsButton3 = page.getByText('Actions').nth(2);
    await actionsButton3.click();

    await expect(page.getByRole('option', { name: 'Unresolve' })).toBeVisible();
  });

  test('should combine search and filter', async ({ page }) => {
    const repositoryAccordion = page.getByText('Repository').first();
    await repositoryAccordion.click();

    const zenodoCheckbox = page.getByText(/ZENODO/i).first();
    await zenodoCheckbox.click();

    const searchInput = page.getByPlaceholder('Search by title.');
    await searchInput.fill('Test Record 2');
    await page.getByRole('button').click();

    await expect(page.getByText('Test Record 2', { exact: true })).toBeVisible();
  });
});
