import { test, expect } from '@playwright/test';

const darId = 'test-dar-id-oar';

const mockOarAssets = [
  {
    id: 'oar-asset-1',
    onlineUrl: 'https://spatialportal.elter-ri.eu/geoserver',
    serviceType: 'geoserver',
    state: 'active',
  },
  {
    id: 'oar-asset-2',
    onlineUrl: 'https://example.com/wms',
    serviceType: 'wms',
    state: 'active',
  },
];

test.describe('OAR Form Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/oar**`, (route) => {
      const url = new URL(route.request().url());
      const darAssetId = url.searchParams.get('darAssetId');

      if (route.request().method() === 'GET' && darAssetId) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOarAssets),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'oar-asset-new',
            onlineUrl: JSON.parse(route.request().postData() || '{}').url,
            serviceType: 'geoserver',
            state: 'active',
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Asset deleted' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`/${darId}/oar/create`);
  });

  test('should show, create and delete OAR services', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/https:\/\/example.com\/geoserver/i);
    expect(urlInput).toBeVisible();

    const createButton = page.getByRole('button', { name: /Create/i });
    expect(createButton).toBeVisible();

    await expect(page.getByText('https://spatialportal.elter-ri.eu/geoserver')).toBeVisible();
    await expect(page.getByText('geoserveractive')).toBeVisible();

    const testUrl = 'https://new-service.example.com/geoserver';
    await urlInput.fill(testUrl);

    const apiCallPromise = page.waitForResponse(
      (response) => response.url().includes('/api/oar') && response.request().method() === 'POST',
    );
    await createButton.click();
    const response = await apiCallPromise;
    expect(response.status()).toBe(201);
    await expect(page.getByText(/created successfully/i)).toBeVisible();

    const deleteApiCallPromise = page.waitForResponse(
      (response) => response.url().includes('/api/oar') && response.request().method() === 'DELETE',
    );
    const deleteButton = page
      .getByRole('listitem')
      .filter({ hasText: 'https://spatialportal.elter-' })
      .getByRole('button')
      .first();
    await deleteButton.click();
    const deleteResponse = await deleteApiCallPromise;
    expect(deleteResponse.status()).toBe(200);
    await expect(page.getByText(/deleted/i)).toBeVisible();

    await page.route(`**/api/oar**`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        route.continue();
      }
    });

    await page.reload();
    await expect(page.getByText(/No online services found/i)).toBeVisible();
  });
});
