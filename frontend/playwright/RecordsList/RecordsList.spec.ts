import { test, expect } from '@playwright/test';

interface MockRecord {
  dar_id: string;
  title: string;
  source_url: string;
  is_resolved: boolean;
  source_repository: string;
  site_references?: any[];
  habitat_references?: any[];
  dataset_type?: any;
  keywords?: any[];
}

const allMockRecords: MockRecord[] = [];
for (let i = 1; i <= 25; i++) {
  allMockRecords.push({
    dar_id: `test-dar-id-${i}`,
    title: `Test Record ${i}`,
    source_url: `https://example.com/record-${i}`,
    is_resolved: i % 3 === 0,
    source_repository: i % 2 === 0 ? 'ZENODO' : 'B2SHARE_EUDAT',
    site_references: i % 5 === 0 ? [{ siteName: `Site ${i}`, siteID: `site-${i}` }] : [],
    keywords: i % 4 === 0 ? [{ keywordLabel: `keyword-${i}` }] : [],
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

test.describe('Records List', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/records**', async (route) => {
      const url = new URL(route.request().url());
      const pageParam = parseInt(url.searchParams.get('page') || '1');
      const sizeParam = parseInt(url.searchParams.get('size') || '10');
      const titleParam = url.searchParams.get('title');
      const resolvedParam = url.searchParams.get('resolved');
      const repositoriesParam =
        url.searchParams.getAll('repositories[]').length > 0
          ? url.searchParams.getAll('repositories[]')
          : url.searchParams.getAll('repositories');
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

    await page.goto('/harvested_records');
  });

  test('should display records list with search and filters', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Harvested Records' })).toBeVisible();

    const searchInput = page.getByPlaceholder('Search by title.');
    expect(searchInput).toBeVisible();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 10')).toBeVisible();

    const repositoryFilter = page.getByText('Repository').first();
    const statusFilter = page.getByText('Status').first();
    expect(repositoryFilter).toBeVisible();
    expect(statusFilter).toBeVisible();

    await searchInput.fill('Test Record 1');
    const searchButton = page.getByRole('button').filter({ hasText: /^$/ });
    await searchButton.click();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 10')).toBeVisible();
    await searchInput.clear();
    await searchButton.click();
    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();

    const statusAccordion = page.getByText('ASSET STATUS').first();
    await statusAccordion.click();

    const resolvedCheckbox = page.getByText('Resolved(8)');
    await resolvedCheckbox.click();
    await expect(page.getByText('Test Record 3', { exact: true })).toBeVisible();

    const unresolvedCheckbox = page.getByText('Unresolved(17)');
    await unresolvedCheckbox.click();
    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 2', { exact: true })).toBeVisible();

    const repositoryAccordion = page.getByText('ASSET REPOSITORY').first();
    await repositoryAccordion.click();

    const zenodoCheckbox = page.getByText(/ZENODO/i).first();
    await zenodoCheckbox.click();
    await expect(page.getByText('Test Record 2', { exact: true })).toBeVisible();

    const b2shareCheckbox = page.getByText(/B2SHARE_EUDAT/i).first();
    await b2shareCheckbox.click();
    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 2', { exact: true })).toBeVisible();

    const paginationElement = page.getByLabel('Next item');
    await expect(paginationElement).toBeVisible();

    await expect(page.getByText('Test Record 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Record 10')).toBeVisible();

    await page.getByText('2', { exact: true }).click();
    await expect(page.getByText('Test Record 16')).toBeVisible();
    await expect(page.getByText('Test Record 20')).toBeVisible();

    const resolveButton = page.getByRole('button', { name: /Resolve/i }).first();
    await expect(resolveButton).toBeVisible();

    await expect(page.getByRole('button', { name: 'Resolve' }).first()).toBeVisible();
    const actionsButton = page.getByText('Actions').first();
    await actionsButton.click();
    await expect(page.getByText('Re-Harvest').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Resolve' }).first()).toBeVisible();
  });
});
