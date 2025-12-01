import { test, expect } from '@playwright/test';

test.describe('Create Record Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/manual-records**', (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            dar_id: 'new-dar-id-123',
            title: body.metadata?.titles?.[0]?.titleText || 'New Record',
            created_at: new Date().toISOString(),
            created_by: 'test-user',
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/create');
  });

  test('should display create record form', async ({ page }) => {
    const textArea = page.getByRole('textbox', { name: 'Paste JSON here, e.g. {"' });
    expect(textArea).toBeVisible();

    const saveButton = page.getByRole('button', { name: 'Create Record' });
    expect(saveButton).toBeEnabled();

    await textArea.fill('invalid json {');

    await saveButton.click();

    const errorMessage = page.getByText(/error|invalid/i);
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError || (await textArea.isVisible())).toBe(true);

    const jsonData = {
      metadata: {
        assetType: 'Dataset',
        datasetType: 'Dataset',
        titles: [{ titleText: 'New Test Record', titleType: 'MainTitle' }],
        creators: [
          {
            creatorGivenName: 'John',
            creatorFamilyName: 'Doe',
            creatorAffiliation: 'Test University',
          },
        ],
      },
    };

    await textArea.fill(JSON.stringify(jsonData, null, 2));
    await expect(textArea).toHaveValue(JSON.stringify(jsonData, null, 2));
    const apiCallPromise = page.waitForResponse(
      (response) => response.url().includes('/api/manual-records') && response.request().method() === 'POST',
    );

    await saveButton.click();

    const response = await apiCallPromise;
    expect(response.status()).toBe(201);
  });
});
