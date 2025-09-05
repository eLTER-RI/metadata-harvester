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
import { mapB2ShareToCommonDatasetMetadata } from '../store/b2shareParser';
import { mapDataRegistryToCommonDatasetMetadata } from '../store/dataregistryParser';
import { mapZenodoToCommonDatasetMetadata } from '../store/zenodoParser';
import { fieldSitesLimiter, zenodoLimiter } from './rateLimiterConcurrency';

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

/**
 * Constructs a search URL for the Data Registry (DAR) API to find a record by its external source URI.
 *
 * @param {string} externalSourceURI externalSourceURI used in the record's externalSourceInformation field in DAR.
 *
 * @returns {string} URL for querying for filtering based on externalSourceURI
 */
function getUrlWithExternalSourceURIQuery(externalSourceURI: string): string {
  const encodedURI = encodeURIComponent(externalSourceURI);
  return `${API_URL}?q=&metadata_externalSourceInformation_externalSourceURI=${encodedURI}`;
}

/**
 * CREATE or UPDATE of a record in the local database based on its existence and status of the synchronization.
 * It handles creating a new record, updating an old version of a record, or simply updating an existing record's status.
 * @param {string | null} darId The ID of the record in DAR. If set to null, it assumes record POST/PUT to dar was unsuccessful.
 * @param {boolean} missingInDb.
 * @param {RecordDao} recordDao
 * @param {string} url The source URL of the record on the remote repository.
 * @param {RepositoryType} repositoryType The type of the repository (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 * @param {string} sourceChecksum The checksum of the current source data.
 * @param {CommonDataset} dataset Source data after mapping.
 * @param {string} oldUrl (Optional) The old URL of the record if there is a new version but we have an older version with different sourceUrl.
 */
async function dbRecordUpsert(
  darId: string | null,
  missingInDb: boolean,
  recordDao: RecordDao,
  url: string,
  repositoryType: RepositoryType,
  sourceChecksum: string,
  dataset: CommonDataset,
  oldUrl?: string,
) {
  if (!darId) {
    await recordDao.updateDarIdStatus(url, {
      status: 'failed',
    });
    return;
  }

  const darChecksum = calculateChecksum(dataset);
  if (missingInDb) {
    log('info', `Creating database record for ${url}`);
    await recordDao.createRecord({
      source_url: url,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: darId,
      dar_checksum: darChecksum,
      status: 'success',
    });
    return;
  }

  if (oldUrl) {
    log('info', `Record ${url} has an old version of ${oldUrl} in DAR with ${darId}`);
    await recordDao.updateRecordWithPrimaryKey(oldUrl, {
      source_url: url,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: darId,
      dar_checksum: darChecksum,
      status: 'updating',
    });
    return;
  }

  log('info', `Updating record in database for record ${url}, dar id ${darId}`);
  await recordDao.updateRecord(url, {
    source_url: url,
    source_repository: repositoryType,
    source_checksum: sourceChecksum,
    dar_id: darId,
    dar_checksum: darChecksum,
    status: 'updating',
  });
}

/**
 * Sends a POST request to the DAR API.
 * @param {Record} recordDao
 * @param {string} url The source URL of the record on the remote repository.
 * @param {CommonDataset} dataset Source data after mapping.
 * @returns The ID of the newly created record in DAR, or null if the request fails.
 */
async function postToDar(recordDao: RecordDao, url: string, dataset: CommonDataset): Promise<string | null> {
  log('info', `Posting ${url} to Dar.`);
  const apiResponse = await fetch(API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

  if (!apiResponse) {
    log('error', `Posting ${url} into dar failed`);
    await recordDao.updateDarIdStatus(url, {
      dar_id: '',
      status: 'failed',
    });
    return null;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `Posting ${url} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateDarIdStatus(url, {
      dar_id: '',
      status: 'failed',
    });
    return null;
  }
  const resp = await apiResponse.json();
  return resp.id;
}

async function putToDar(darId: string | null, recordDao: RecordDao, url: string, dataset: CommonDataset) {
  log('info', `PUT ${url} to Dar record with id ${darId}.`);
  const apiResponse = await fetch(`${API_URL}/${darId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

  if (!apiResponse) {
    log('error', `PUT request ${url} into dar failed`);
    await recordDao.updateDarIdStatus(url, {
      status: 'failed',
    });
    return;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `PUT request ${url} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateDarIdStatus(url, {
      status: 'failed',
    });
    return;
  }

  await recordDao.updateStatus(url, {
    status: 'success',
  });
  return;
}

async function findDarRecordBySourceURL(url: string): Promise<string | null> {
  const response = await fetch(getUrlWithExternalSourceURIQuery(url), {
    method: 'GET',
    headers: { Authorization: AUTH_TOKEN, Accept: 'application/json' },
  });

  const searchResult = (await response.json()) as any;
  if (searchResult?.hits?.hits?.length > 0 && searchResult.hits.hits[0]?.id) {
    return searchResult.hits.hits[0].id;
  }
  return null;
}

async function updateDarBasedOnDB(
  recordDao: RecordDao,
  url: string,
  repositoryType: RepositoryType,
  sourceChecksum: string,
  dataset: CommonDataset,
) {
  const darChecksum = calculateChecksum(dataset);
  const darMatches = await findDarRecordBySourceURL(url);
  const dbMatches = await recordDao.getRecordBySourceId(url);
  if (dbMatches.length > 1) {
    throw new Error('More than one existing records of one dataset in the local database.');
  }
  const oldVersions = dataset.metadata.relatedIdentifiers
    ?.filter((id) => id.relationType === 'IsNewVersionOf')
    .map((id) => id.relatedID);

  if (oldVersions && oldVersions.length > 0) {
    // record missing in database or in dar
    oldVersions.forEach(async (oldUrl) => {
      const oldVersionsInDb = await recordDao.getRecordBySourceId(oldUrl);
      if (oldVersionsInDb.length > 0) {
        // there is a record in dar that is an old version of this record
        // we update the old record with our new data, and update our db record
        // with a new source url and other data
        putToDar(oldVersionsInDb[0].dar_id, recordDao, url, dataset);
        dbRecordUpsert(
          oldVersionsInDb[0].dar_id,
          dbMatches.length == 0,
          recordDao,
          url,
          repositoryType,
          sourceChecksum,
          dataset,
          oldUrl,
        );
        return;
      }
    });
  }

  if (!darMatches) {
    const darId = await postToDar(recordDao, url, dataset);
    await dbRecordUpsert(darId, dbMatches.length == 0, recordDao, url, repositoryType, sourceChecksum, dataset);
    return;
  }

  if (
    dbMatches.length == 0 ||
    dbMatches[0].source_checksum != sourceChecksum ||
    dbMatches[0].dar_checksum != darChecksum
  ) {
    // source data or mapping logic changed
    if (dbMatches.length == 0) {
      log('info', `No database record for the given dar record. No checksum available, updating.`);
    } else if (dbMatches[0].source_checksum != sourceChecksum) {
      log(
        'info',
        `Source data changed for ${url}, previous checksum: ${dbMatches[0].source_checksum}, current: ${sourceChecksum}.`,
      );
    } else {
      log('info', 'Implementation of mappers might have changed.');
    }
    await putToDar(darMatches, recordDao, url, dataset);
    await dbRecordUpsert(darMatches, dbMatches.length == 0, recordDao, url, repositoryType, sourceChecksum, dataset);
    return;
  }

  log('info', 'Record was up to date.');
  await recordDao.updateStatus(url, {
    status: 'success',
  });
}

async function processFieldSitesDatasetUrls(urls: string[], recordDao: RecordDao) {
  const processingPromises = urls.map((datasetUrl: string) => {
    return fieldSitesLimiter.schedule(async () => {
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
    });
  });
  await Promise.allSettled(processingPromises);
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
    const recordDao = new RecordDao(pool);
    await recordDao.updateRepositoryToInProgress('SITES');
    client = await pool.connect();
    await client.query('BEGIN');
    log('info', `Connected to database. Starting transaction.`);

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

const processOneRecordTask = async (
  recordUrl: string,
  recordDao: RecordDao,
  sites: SiteReference[],
  repositoryType?: RepositoryType,
) => {
  let mappedDataset: CommonDataset;

  const recordData = await fetchJson(recordUrl);
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
      const matchedSites = await getZenodoMatchedSites(recordData, sites);
      mappedDataset = await mapZenodoToCommonDatasetMetadata(recordUrl, recordData, matchedSites);
      break;
    }
    default:
      throw new Error(`Unknown repository: ${repositoryType}.`);
  }
  const newSourceChecksum = calculateChecksum(recordData);
  const sourceUrl = mappedDataset.metadata.externalSourceInformation.externalSourceURI || recordUrl;
  await updateDarBasedOnDB(recordDao, sourceUrl, repositoryType, newSourceChecksum, mappedDataset);
};

async function processApiPageDatasetUrls(
  hits: string[],
  recordDao: RecordDao,
  sites: SiteReference[],
  selfLinkKey: string,
  repositoryType?: RepositoryType,
) {
  await Promise.all(
    hits.map(async (hit: any) => {
      if (!hit) return null;
      const recordUrl = getNestedValue(hit, selfLinkKey);
      if (repositoryType === 'ZENODO' || repositoryType === 'ZENODO_IT') {
        return zenodoLimiter.schedule(() => processOneRecordTask(recordUrl, recordDao, sites, repositoryType));
      }
      return processOneRecordTask(recordUrl, recordDao, sites, repositoryType);
    }),
  );
}

async function harvestAndPostApiPageWithTransaction(
  pool: Pool,
  url: string,
  repositoryType: RepositoryType,
  repoConfig: any,
) {
  let page = 1;
  const { apiUrl, pageSize, selfLinkKey, dataKey } = repoConfig;
  const recordDao = new RecordDao(pool);
  await recordDao.updateRepositoryToInProgress(repositoryType);
  const sites = await fetchSites();
  while (pageSize) {
    const pageUrl = `${apiUrl}&size=${pageSize}&page=${page}`;
    log('info', `Fetching the dataset from: ${pageUrl}...`);
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
}

export async function harvestAndPostApiPage(pool: Pool, url: string, repositoryType: RepositoryType) {
  const repoConfig = CONFIG.REPOSITORIES[repositoryType];
  const selfLinkKey = repoConfig.selfLinkKey;
  if (!repoConfig) {
    log('error', `Configuration for repository '${repositoryType}' not available.`);
    throw new Error(`Configuration for repository '${repositoryType}' not available.`);
  }

  if (!selfLinkKey) {
    log('error', `Self link key not available.`);
    return;
  }

  log('info', `Fetching from ${repositoryType}...`);
  let client;
  try {
    client = await pool.connect();
    log('info', `Connected to database. Starting transaction.`);
    await client.query('BEGIN');
    await harvestAndPostApiPageWithTransaction(pool, url, repositoryType, repoConfig);
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
