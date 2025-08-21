import { CommonDataset, RepositoryType, SiteReference } from '../store/commonStructure';
import { log } from './serviceLogging';
import { CONFIG } from '../../config';
import { Pool } from 'pg';
import { mapFieldSitesToCommonDatasetMetadata } from '../store/sitesParser';
import { fetchJson, fetchXml, getNestedValue } from './pullAllData';
import { calculateChecksum } from '../utilities/checksum';
import {
  fetchSites,
  getB2ShareMatchedSites,
  getDataRegistryMatchedSites,
  getFieldSitesMatchedSites,
  getZenodoMatchedSites,
} from '../utilities/matchDeimsId';
import { RecordDao } from '../store/recordDao';
import { RateLimiter } from './rateLimiter';
import { mapB2ShareToCommonDatasetMetadata } from '../store/b2shareParser';
import { mapDataRegistryToCommonDatasetMetadata } from '../store/dataregistryParser';
import { mapZenodoToCommonDatasetMetadata } from '../store/zenodoParser';

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
    if (oldVersions && oldVersions.length > 0) {
      oldVersions.forEach(async (oldUrl) => {
        const rows = await recordDao.getRecordBySourceId(oldUrl);
        if (rows.length > 0) {
          log('info', `Record ${url} has an old version in DAR with ${existingRecord[0].dar_id}`);
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
    return;
  } else {
    await recordDao.updateStatus(url, {
      status: 'success',
    });
    return;
  }
}

async function processFieldSitesDatasetUrls(urls: string[], recordDao: RecordDao) {
  await Promise.all(
    urls.map(async (datasetUrl: any) => {
      try {
        if (!datasetUrl) return null;
        const recordData = await fetchJson(datasetUrl);
        if (!recordData) return null;
        const matchedSites = getFieldSitesMatchedSites(recordData);
        const mappedDataset = await mapFieldSitesToCommonDatasetMetadata(datasetUrl, recordData, matchedSites);
        const newSourceChecksum = calculateChecksum(recordData);
        await updateDarBasedOnDB(recordDao, datasetUrl, 'SITES', newSourceChecksum, mappedDataset);
      } catch (error) {
        log('error', `Failed to process record for ${'SITES'}: ${error}`);
        await recordDao.updateStatus(datasetUrl, { status: 'failed' });
      }
    }),
  );
}

export async function harvestAndPostFieldSitesPage(pool: Pool, url: string) {
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
    await processFieldSitesDatasetUrls(urls, recordDao);

    await client.query('COMMIT');
    log('info', `Transaction for SITES committed successfully.`);
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    log('error', `Harvesting process failed: ${e}`);
  } finally {
    if (client) client.release();
  }
}

async function processApiPageDatasetUrls(
  hits: string[],
  recordDao: RecordDao,
  sites: SiteReference[],
  selfLinkKey: string,
  repositoryType?: RepositoryType,
) {
  let rateLimiter: RateLimiter;
  if (repositoryType === 'ZENODO' || repositoryType === 'ZENODO_IT') {
    rateLimiter = new RateLimiter(100);
  }
  let mappedDataset: CommonDataset;
  await Promise.all(
    hits.map(async (hit: any) => {
      if (!hit) return null;
      const recordUrl = getNestedValue(hit, selfLinkKey);
      const recordData = recordUrl ? await fetchJson(recordUrl) : hit;
      if (!recordData) return null;

      switch (repositoryType) {
        case 'B2SHARE_EUDAT':
        case 'B2SHARE_JUELICH': {
          const matchedSites = await getB2ShareMatchedSites(recordData, sites);
          mappedDataset = await mapB2ShareToCommonDatasetMetadata(recordUrl, recordData, matchedSites, repositoryType);
          break;
        }
        case 'DATAREGISTRY': {
          const matchedSites = await getDataRegistryMatchedSites(recordData);
          mappedDataset = await mapDataRegistryToCommonDatasetMetadata(recordUrl, recordData, matchedSites);
          break;
        }
        case 'ZENODO':
        case 'ZENODO_IT': {
          await rateLimiter.waitForRequest();
          const matchedSites = await getZenodoMatchedSites(recordData, sites);
          mappedDataset = await mapZenodoToCommonDatasetMetadata(recordUrl, recordData, matchedSites);
          break;
        }
        default:
          throw new Error(`Unknown repository: ${repositoryType}.`);
      }
      const newSourceChecksum = calculateChecksum(recordData);
      await updateDarBasedOnDB(recordDao, recordUrl, repositoryType, newSourceChecksum, mappedDataset);
    }),
  );
}
export async function harvestAndPostApiPage(pool: Pool, url: string, repositoryType: RepositoryType) {
  const repoConfig = CONFIG.REPOSITORIES[repositoryType];
  const apiUrl = repoConfig.apiUrl;
  const pageSize = repoConfig.pageSize;
  const selfLinkKey = repoConfig.selfLinkKey;
  const dataKey = repoConfig.dataKey;
  if (!repoConfig) {
    log('error', `Configuration for repository '${repositoryType}' not available.`);
    throw new Error(`Configuration for repository '${repositoryType}' not available.`);
  }

  if (!selfLinkKey) {
    log('error', `Self link key not available.`);
    return;
  }

  log('info', `Fetching from ${repositoryType}...`);
  let page = 1;
  let client;
  try {
    client = await pool.connect();
    log('info', `Connected to database. Starting transaction.`);
    await client.query('BEGIN');
    const recordDao = new RecordDao(pool);
    await recordDao.updateRepositoryToInProgress(repositoryType);
    while (pageSize) {
      const pageUrl = `${apiUrl}&size=${pageSize}&page=${page}`;
      log('info', `Fetching the dataset from: ${pageUrl}...`);
      // const deimsDao = new DeimsDao(pool);
      // const sites = await deimsDao.getSitesForLookup();
      const sites = await fetchSites();

      const data = await fetchJson(pageUrl);
      const hits: string[] = dataKey ? getNestedValue(data, dataKey) || [] : [];
      log('info', `Found ${hits.length} self links. Fetching individual records...\n`);

      // // Process individual records using the parser
      await processApiPageDatasetUrls(hits, recordDao, sites, selfLinkKey, repositoryType);

      if (hits.length === 0) {
        log('warn', `No records found on page ${page}. Stopping.`);
        break;
      }

      if (hits.length < pageSize) {
        log('info', 'Last page reached.');
        break;
      }
      page++;
    }
    await client.query('COMMIT');
    log('info', `Transaction for SITES committed successfully.`);
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    log('error', `Harvesting process failed: ${e}`);
  } finally {
    if (client) client.release();
  }
}

export const harvestAndPost = async (pool: Pool, repositoryType: RepositoryType) => {
  log('info', `Starting harvesting job for repository: ${repositoryType}`);
  const repoConfig = CONFIG.REPOSITORIES[repositoryType];
  if (!repoConfig) {
    log('error', `Configuration for repository '${repositoryType}' not available.`);
    throw new Error(`Configuration for repository '${repositoryType}' not available.`);
  }

  const apiUrl = repoConfig.apiUrl;
  if (repositoryType === 'SITES') {
    await harvestAndPostFieldSitesPage(pool, apiUrl);
    log('info', `Harvesting for repository: ${repositoryType} finished`);
    return;
  }

  await harvestAndPostApiPage(pool, apiUrl, repositoryType);
  log('info', `Harvesting for repository: ${repositoryType} finished`);
};
