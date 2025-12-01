import { test, expect } from '@playwright/test';

const darId = 'test-dar-id-123';

const originalRecordFromDar = {
  metadata: {
    assetType: 'Dataset',
    datasetType: 'Dataset',
    titles: [
      {
        titleText: 'The Core Title',
        titleType: 'MainTitle',
      },
    ],
    creators: [
      {
        creatorGivenName: 'Ian',
        creatorFamilyName: 'Novak',
        creatorNameIdentifier: '',
        creatorAffiliation: 'Masaryk University',
      },
    ],
    descriptions: [
      {
        descriptionText: 'This is a test dataset description.',
        descriptionType: 'abstract',
      },
    ],
    keywords: [
      {
        keywordLabel: 'test',
        keywordType: 'subject',
      },
      {
        keywordLabel: 'example',
        keywordType: 'subject',
      },
    ],
    publicationDate: '2024-01-01',
    externalSourceInformation: {
      externalSourceName: 'ZENODO',
      externalSourceURI: 'https://example.com/record',
      externalSourceInfo: '',
    },
  },
};

const sampleRules = [
  {
    id: 'rule-1',
    dar_id: darId,
    target_path: 'metadata.keywords',
    after_value: [
      { keywordLabel: 'test', keywordType: 'subject' },
      { keywordLabel: 'example', keywordType: 'subject' },
    ],
    before_value: [{ keywordLabel: 'old-keyword', keywordType: 'subject' }],
  },
  {
    id: 'rule-2',
    dar_id: darId,
    target_path: 'metadata.datasetType',
    after_value: { datasetTypeCode: 'Dataset' },
    before_value: { datasetTypeCode: 'Other' },
  },
];

test.describe('Edit Record Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/external-record/${darId}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(originalRecordFromDar),
      });
    });

    await page.route(`**/api/records/${darId}/rules`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sampleRules),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Rules processed successfully.' }),
        });
      }
    });

    await page.route(`**/api/records/${darId}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dar_id: darId,
          title: 'The Core Title',
          source_url: 'https://example.com/record',
          source_repository: 'ZENODO',
        }),
      });
    });

    await page.route('**/api/oar**', (route) => {
      const url = new URL(route.request().url());
      const darAssetId = url.searchParams.get('darAssetId');

      if (route.request().method() === 'GET' && darAssetId) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
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

    await page.goto(`/${darId}/edit`);
  });

  test('should display record form and show rules', async ({ page }) => {
    await expect(page.getByRole('heading', { name: `Edit Record ${darId}` })).toBeVisible();
    await expect(page.getByText(/Rule Generation and Re-Harvest/i)).toBeVisible();

    const changesDetected = page.getByText('Changes Detected').nth(1);
    await expect(changesDetected).toBeVisible();
    await changesDetected.click();
    const oldKeyword = page.getByText('old-keyword');
    await expect(oldKeyword).toBeVisible();

    const datasetTypeChanges = page.getByText('Changes Detected');
    const datasetTypeChangesCount = await datasetTypeChanges.count();
    expect(datasetTypeChangesCount).toBeGreaterThan(0);

    const keywordFields = page.getByRole('textbox', { name: 'Enter keyword or tag' });
    await expect(keywordFields.first()).toBeVisible();
    const count = await keywordFields.count();
    expect(count).toEqual(2);
    await expect(keywordFields.first()).toHaveValue('test');

    await keywordFields.first().fill('modified-keyword');
    await expect(keywordFields.first()).toHaveValue('modified-keyword');

    await keywordFields.first().fill('Changed Keyword');

    const apiCallPromise = page.waitForResponse(
      (response) => response.url().includes(`/api/records/${darId}/rules`) && response.request().method() === 'POST',
    );

    const saveButton = page.getByRole('button', { name: /Save Changes/i });
    await saveButton.click();

    const response = await apiCallPromise;
    expect(response.status()).toBe(201);

    await expect(page.getByRole('heading', { name: 'Harvested Records' })).toBeVisible();
  });
});
