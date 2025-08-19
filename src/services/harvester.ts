import { CommonDataset, RepositoryType } from '../store/commonStructure';
import { log } from './serviceLogging';
import { CONFIG } from '../../config';
import { Pool } from 'pg';
import { mapFieldSitesToCommonDatasetMetadata } from '../store/sitesParser';
import { fetchJson, fetchXml } from './pullAllData';
import { calculateChecksum } from '../utilities/checksum';
import { getFieldSitesMatchedSites } from '../utilities/matchDeimsId';
import { RecordDao } from '../store/recordDao';

// Configurations
const currentEnv = process.env.NODE_ENV;
if (currentEnv !== 'prod' && currentEnv !== 'dev') {
  throw new Error(`NODE_ENV must be set to 'prod' or 'dev'`);
}

const API_URL = currentEnv === 'prod' ? process.env.PROD_API_URL : process.env.DEV_API_URL;

const AUTH_TOKEN =
  currentEnv === 'prod' ? 'Bearer ' + process.env.PROD_AUTH_TOKEN : 'Bearer ' + process.env.DEV_AUTH_TOKEN;

if (!API_URL || !AUTH_TOKEN) {
  throw new Error(
    `API_URL or AUTH_TOKEN undefined, env: '${currentEnv}'.
    Check the .env file and set environments correctly.`,
  );
}

async function updateDarBasedOnDB(
  recordDao: RecordDao,
  url: string,
  repositoryType: RepositoryType,
  sourceChecksum: string,
  dataset: CommonDataset,
) {
  const existingRecord = await recordDao.getRecordBySourceId(url);
  const darChecksum = calculateChecksum(dataset);
  if (existingRecord.length > 1) {
    throw new Error(
      `API_URL or AUTH_TOKEN undefined, env: '${currentEnv}'.
      Check the .env file and set environments correctly.`,
    );
  }

  if (existingRecord.length == 0) {
    const oldVersions = dataset.metadata.relatedIdentifiers
      ?.filter((id) => id.relationType === 'IsNewVersionOf')
      .map((id) => id.relatedID);
    let hasOldVersionInDar = false;
    if (oldVersions && oldVersions.length > 0) {
      oldVersions.forEach(async (oldUrl) => {
        const rows = await recordDao.getRecordBySourceId(oldUrl);
        if (rows.length > 0) {
          hasOldVersionInDar = true;
          await recordDao.updateRecordWithPrimaryKey(oldUrl, {
            source_url: url,
            source_repository: repositoryType,
            source_checksum: sourceChecksum,
            dar_id: rows[0].dar_id,
            dar_checksum: darChecksum,
            status: 'updating',
          });
          // update dar
          await recordDao.updateStatus(url, {
            status: 'success',
          });
          return;
        }
      });
    }
    if (hasOldVersionInDar) return;

    await recordDao.createRecord({
      source_url: url,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: '',
      dar_checksum: darChecksum,
      status: 'creating',
    });
    // post
    await recordDao.updateDarIdStatus(url, {
      dar_id: '', // add response url
      status: 'success',
    });
    return;
  }

  if (existingRecord[0].source_checksum != sourceChecksum || existingRecord[0].dar_checksum != darChecksum) {
    await recordDao.updateRecord(url, {
      source_url: url,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: existingRecord[0].dar_id,
      dar_checksum: darChecksum,
      status: 'updating',
    });
    // update dar
    await recordDao.updateStatus(url, {
      status: 'success',
    });
  }
}

export async function harvestAndPostFieldSitesPage(pool: Pool, url: string) {
  if (!API_URL || !AUTH_TOKEN) {
    throw new Error(
      `API_URL or AUTH_TOKEN undefined, env: '${currentEnv}'.
      Check the .env file and set environments correctly.`,
    );
  }

  log('info', `Fetching the dataset from: ${url}...`);

  const data = await fetchXml(url);
  if (!data) {
    log('error', 'Failed to fetch or parse sitemap XML.');
    return [];
  }
  const locElements = data.getElementsByTagName('loc');
  const urls: string[] = [];
  for (let i = 0; i < locElements.length; i++) {
    urls.push(locElements[i].textContent || '');
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    log('info', `Connected to database. Starting transaction.`);
    const recordDao = new RecordDao(pool);
    await recordDao.updateRepositoryToInProgress('SITES');

    log('info', `Found ${urls.length} URLs. Fetching individual records...\n`);

    // // Process individual records using the parser
    await Promise.all(
      urls.map(async (datasetUrl: any) => {
        if (!datasetUrl) return null;
        const recordData = await fetchJson(datasetUrl);
        if (!recordData) return null;
        const matchedSites = getFieldSitesMatchedSites(recordData);
        const mappedDataset = await mapFieldSitesToCommonDatasetMetadata(datasetUrl, recordData, matchedSites);
        const newSourceChecksum = calculateChecksum(recordData);
        updateDarBasedOnDB(recordDao, datasetUrl, 'SITES', newSourceChecksum, mappedDataset);
      }),
    );
  } catch (error) {
    log('error', `Error during harvesting and posting fieldsites page: ` + error);
  }
}

export const harvestAndPost = async (pool: Pool, repositoryType: RepositoryType) => {
  log('info', `Starting harvesting job for repository: ${repositoryType}`);
  const repoConfig = CONFIG.REPOSITORIES[repositoryType];
  if (!repoConfig) {
    log('error', `Configuration for repository '${repositoryType}' not available.`);
    throw new Error(`Configuration for repository '${repositoryType}' not available.`);
  }

  const pageSize = repoConfig.pageSize;
  const apiUrl = repoConfig.apiUrl;
  if (!pageSize && repositoryType === 'SITES') {
    harvestAndPostFieldSitesPage(pool, apiUrl);
    return;
  }
};
