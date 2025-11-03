import { test, expect } from '@playwright/test';

const darId = 'test-dar-id-123';

// Original record data from DAR
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
    target_path: 'metadata.titles',
    after_value: [{ titleText: 'The Core Title', titleType: 'MainTitle' }],
    before_value: [{ titleText: 'Original Test Dataset Title', titleType: 'MainTitle' }],
  },
];

test.describe('Edit Record Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock external-record API to return the ORIGINAL value from DAR
    await page.route(`**/api/external-record/${darId}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(originalRecordFromDar),
      });
    });

    // Mock rules API
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

    // Navigate to edit page
    await page.goto(`/harvested_records/${darId}/edit`);
  });

  test('should load and display record data', async ({ page }) => {
    await test.step('Check page header and info message', async () => {
      await expect(page.getByRole('heading', { name: 'Edit Record test-dar-id-123' })).toBeVisible({});
      await expect(page.getByText(/Rule Generation and Re-Harvest/i)).toBeVisible();
    });

    await test.step('Verify Titles section is loaded with original data and apply rule value', async () => {
      const titleField = page.getByRole('textbox', { name: 'Enter the title of the dataset' });
      await expect(titleField).toHaveValue('The Core Title');

      await titleField.fill('Title after rule application');
      await expect(titleField).toHaveValue('Title after rule application');
    });

    await test.step('Verify Creators section is loaded with correct data', async () => {
      const creatorsButton = page.getByRole('button', { name: /Creators/i });
      await creatorsButton.click();

      const givenNameField = page.getByRole('textbox', { name: 'First name' }).first();
      const familyNameField = page.getByRole('textbox', { name: 'Last name' });

      await expect(givenNameField).toHaveValue('Ian');
      await expect(familyNameField).toHaveValue('Novak');
    });

    await test.step('Verify Descriptions section is loaded with correct data', async () => {
      const descriptionsButton = page.getByRole('button', { name: /Descriptions/i });
      await descriptionsButton.click();

      const descriptionField = page.getByRole('textbox', { name: 'Enter the description' });
      await expect(descriptionField).toBeVisible();
      await expect(descriptionField).toHaveValue('This is a test dataset description.');
    });

    await test.step('Verify Keywords section is loaded with correct data', async () => {
      const keywordsButton = page.getByRole('button', { name: /Keywords/i });
      await keywordsButton.click();

      const keywordFields = page.getByRole('textbox', { name: 'Enter keyword or tag' });
      await expect(keywordFields.first()).toBeVisible();
      const count = await keywordFields.count();
      expect(count).toEqual(2);

      const firstKeyword = keywordFields.first();
      await expect(firstKeyword).toHaveValue('test');
    });
  });

  test('should display existing rules', async ({ page }) => {
    await test.step('Set form to show modified value for diff to work', async () => {
      const titleField = page.getByRole('textbox', { name: 'Enter the title of the dataset' });
      await titleField.fill('Title after rule application');

      const changesAccordion = page.getByText('Changes').first();
      await expect(changesAccordion).toBeVisible();

      const changesButton = page.getByText('Changes').first();
      await changesButton.click();

      const expandLines = page.getByRole('cell', { name: 'Expand' });
      if ((await expandLines.count()) > 0) {
        await expandLines.click();
      }
      expect(page.getByText('Original Test Dataset Title')).toBeVisible();
      expect(page.getByText('The Core Title')).toBeVisible();
    });
  });

  test('should allow editing title field', async ({ page }) => {
    await test.step('Find and edit the title field', async () => {
      const titleField = page.getByRole('textbox', { name: 'Enter the title of the dataset' });
      await expect(titleField).toBeVisible();

      await titleField.clear();
      await titleField.fill('Updated Test Dataset Title');
      await expect(titleField).toHaveValue('Updated Test Dataset Title');
    });

    await test.step('Verify title change persists', async () => {
      const titleField = page.getByRole('textbox', { name: 'Enter the title of the dataset' });
      await expect(titleField).toHaveValue('Updated Test Dataset Title');
    });
  });

  test('should allow editing description', async ({ page }) => {
    await test.step('Navigate to Descriptions group', async () => {
      const descriptionsButton = page.getByRole('button', { name: /Descriptions/i });
      await expect(descriptionsButton).toBeVisible();
      await descriptionsButton.click();
    });

    await test.step('Edit description text', async () => {
      const descriptionField = page.getByRole('textbox', { name: 'Enter the description' });
      await expect(descriptionField).toBeVisible();

      await descriptionField.clear();
      await descriptionField.fill('Updated description text');
      await expect(descriptionField).toHaveValue('Updated description text');
    });

    await test.step('Verify description change is visible', async () => {
      const descriptionField = page.getByRole('textbox', { name: 'Enter the description' });
      await expect(descriptionField).toHaveValue('Updated description text');
    });
  });

  test('should allow adding a new keyword', async ({ page }) => {
    await test.step('Navigate to Keywords group', async () => {
      const keywordsButton = page.getByRole('button', { name: /Keywords/i });
      await expect(keywordsButton).toBeVisible();
      await keywordsButton.click();
    });

    await test.step('Add a new keyword', async () => {
      const addKeywordButton = page.getByRole('button', { name: /Add Keyword/i });
      await expect(addKeywordButton).toBeVisible();
      await addKeywordButton.click();

      const keywordFields = page.getByRole('textbox', { name: 'Enter keyword or tag' });
      const lastKeywordField = keywordFields.last();
      await lastKeywordField.fill('new-keyword');
      await expect(lastKeywordField).toHaveValue('new-keyword');

      const count = await keywordFields.count();
      expect(count).toBeGreaterThan(2);
    });
  });

  test('should allow editing creator information', async ({ page }) => {
    await test.step('Navigate to Creators group', async () => {
      const creatorsButton = page.getByRole('button', { name: /Creators/i });
      await expect(creatorsButton).toBeVisible();
      await creatorsButton.click();
    });

    await test.step('Edit creator given name', async () => {
      const givenNameField = page.getByRole('textbox', { name: 'First name' }).first();
      await givenNameField.clear();
      await givenNameField.fill('Jane');
      await expect(givenNameField).toHaveValue('Jane');
    });

    await test.step('Edit creator family name', async () => {
      const familyNameField = page.getByRole('textbox', { name: 'Last name' }).first();
      await familyNameField.clear();
      await familyNameField.fill('Smith');
      await expect(familyNameField).toHaveValue('Smith');
    });
  });

  test('should navigate back to records list after successful save', async ({ page }) => {
    await page.route(`**/api/records/${darId}/rules`, (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Rules processed successfully.' }),
        });
      } else {
        route.continue();
      }
    });

    await test.step('Make an edit to the record', async () => {
      const titleField = page.getByRole('textbox', { name: 'Enter the title of the dataset' });
      await expect(titleField).toBeVisible();
      await titleField.clear();
      await titleField.fill('Changed Title for Navigation Test');
    });

    await test.step('Save and verify navigation', async () => {
      const saveButton = page.getByRole('button', { name: /Generate Rules|Trigger Re-Harvest/i });
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      await expect(page.getByRole('heading', { name: 'Harvested Records' })).toBeVisible();
    });
  });

  test('should navigate throughout different section and allow editing', async ({ page }) => {
    await test.step('Edit title in Titles group', async () => {
      const titleField = page.getByRole('textbox', { name: 'Enter the title of the dataset' });
      await expect(titleField).toBeVisible();
      await titleField.clear();
      await titleField.fill('Multi-Edit Test Title');
      await expect(titleField).toHaveValue('Multi-Edit Test Title');
    });

    await test.step('Navigate to Descriptions and edit', async () => {
      const descriptionsButton = page.getByRole('button', { name: /Descriptions/i });
      await descriptionsButton.click();

      const descriptionField = page.getByRole('textbox', { name: 'Enter the description' });
      await descriptionField.clear();
      await descriptionField.fill('Updated multi-edit description');
      await expect(descriptionField).toHaveValue('Updated multi-edit description');
    });

    await test.step('Navigate to Keywords and add keyword', async () => {
      const keywordsButton = page.getByRole('button', { name: /Keywords/i });
      await keywordsButton.click();

      const addKeywordButton = page.getByRole('button', { name: /Add Keyword/i });
      await addKeywordButton.click();

      const keywordFields = page.getByRole('textbox', { name: 'Enter keyword or tag' });
      const lastKeywordField = keywordFields.last();
      await lastKeywordField.fill('multi-edit-keyword');
      await expect(lastKeywordField).toHaveValue('multi-edit-keyword');
    });

    await test.step('Verify all changes are still visible', async () => {
      const titlesButton = page.getByRole('button', { name: 'Titles' });
      await titlesButton.click();

      const titleField = page.getByRole('textbox', { name: 'Enter the title of the dataset' });
      await expect(titleField).toHaveValue('Multi-Edit Test Title');
    });
  });
});
