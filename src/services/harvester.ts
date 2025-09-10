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
import { DbRecord, RecordDao } from '../store/recordDao';
import { mapB2ShareToCommonDatasetMetadata } from '../store/b2shareParser';
import { mapDataRegistryToCommonDatasetMetadata } from '../store/dataregistryParser';
import { mapZenodoToCommonDatasetMetadata } from '../store/zenodoParser';
import { fieldSitesLimiter, zenodoLimiter } from './rateLimiterConcurrency';
import { dbValidationPhase } from './dbValidation';

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
 * Searches DAR for a record by its source URL.
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @returns {string | null} The ID of the matching record in DAR, null if no record found.
 */
async function findDarRecordBySourceURL(sourceUrl: string): Promise<string | null> {
  const response = await fetch(getUrlWithExternalSourceURIQuery(sourceUrl), {
    method: 'GET',
    headers: { Authorization: AUTH_TOKEN, Accept: 'application/json' },
  });

  const searchResult = (await response.json()) as any;
  if (searchResult?.hits?.hits?.length > 0 && searchResult.hits.hits[0]?.id) {
    return searchResult.hits.hits[0].id;
  }
  return null;
}

/**
 * CREATE or UPDATE of a record in the local database based on its existence and status of the synchronization.
 * It handles creating a new record, updating an old version of a record, or simply updating an existing record's status.
 * @param {string | null} darId The ID of the record in DAR. If set to null, it assumes record POST/PUT to dar was unsuccessful.
 * @param {boolean} missingInDb.
 * @param {RecordDao} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {RepositoryType} repositoryType The type of the repository (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 * @param {string} sourceChecksum The checksum of the current source data.
 * @param {string} darChecksum Source data checksum.
 * @param {string} oldUrl (Optional) The old URL of the record if there is a new version but we have an older version with different sourceUrl.
 */
async function dbRecordUpsert(
  darId: string | null,
  missingInDb: boolean,
  recordDao: RecordDao,
  sourceUrl: string,
  repositoryType: RepositoryType,
  sourceChecksum: string,
  darChecksum: string,
  oldUrl?: string,
) {
  if (!darId) {
    await recordDao.updateDarIdStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  if (missingInDb) {
    log('info', `Creating database record for ${sourceUrl}`);
    await recordDao.createRecord({
      source_url: sourceUrl,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: darId,
      dar_checksum: darChecksum,
      status: 'success',
    });
    return;
  }

  if (oldUrl) {
    log('info', `Record ${sourceUrl} has an old version of ${oldUrl} in DAR with ${darId}`);
    await recordDao.updateRecordWithPrimaryKey(oldUrl, {
      source_url: sourceUrl,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: darId,
      dar_checksum: darChecksum,
      status: 'updating',
    });
    return;
  }

  log('info', `Updating record in database for record ${sourceUrl}, dar id ${darId}`);
  await recordDao.updateRecord(sourceUrl, {
    source_url: sourceUrl,
    source_repository: repositoryType,
    source_checksum: sourceChecksum,
    dar_id: darId,
    dar_checksum: darChecksum,
    status: 'updating',
  });

  log('info', 'Record was up to date.');
  await recordDao.updateStatus(sourceUrl, {
    status: 'success',
  });
}

/**
 * Sends a POST request to the DAR API.
 * @param {Record} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {CommonDataset} dataset Source data after mapping.
 * @returns The ID of the newly created record in DAR, or null if the request fails.
 */
async function postToDar(recordDao: RecordDao, sourceUrl: string, dataset: CommonDataset): Promise<string | null> {
  log('info', `Posting ${sourceUrl} to Dar.`);
  const apiResponse = await fetch(API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

  if (!apiResponse) {
    log('error', `Posting ${sourceUrl} into dar failed`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      dar_id: '',
      status: 'failed',
    });
    return null;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `Posting ${sourceUrl} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      dar_id: '',
      status: 'failed',
    });
    return null;
  }
  const resp = await apiResponse.json();
  return resp.id;
}

/**
 * Sends a PUT request to the DAR API.
 * @param {string} darId The ID of the record in DAR.
 * @param {Record} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {CommonDataset} dataset Source data after mapping.
 */
async function putToDar(darId: string, recordDao: RecordDao, sourceUrl: string, dataset: CommonDataset) {
  log('info', `PUT ${sourceUrl} to Dar record with id ${darId}.`);
  const apiResponse = await fetch(`${API_URL}/${darId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

  if (!apiResponse) {
    log('error', `PUT request ${sourceUrl} into dar failed`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `PUT request ${sourceUrl} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  await recordDao.updateStatus(sourceUrl, {
    status: 'success',
  });
  return;
}

/**
 * Logs how record had changed, sends PUT request to DAR, and upserts database.
 * @param {DbRecord[]} dbMatches A list of records found in the local database matching the source URL.
 * @param {string} sourceChecksum The checksum of the current source data.
 * @param {string} sourceUrl The source URL of the record.
 * @param {string} darId The ID of the record in DAR. If set to null, it assumes record POST/PUT to dar was unsuccessful.
 * @param {RecordDao} recordDao
 * @param {RepositoryType} repositoryType The type of the repository to process (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 * @param {CommonDataset} dataset Source data after mapping.
 * @param {string} darChecksum Source data checksum.
 */
async function handleChangedRecord(
  dbMatches: DbRecord[],
  sourceChecksum: string,
  sourceUrl: string,
  darId: string,
  recordDao: RecordDao,
  repositoryType: RepositoryType,
  dataset: CommonDataset,
  darChecksum: string,
) {
  const isDbRecordMissing = dbMatches.length === 0;
  const isSourceChanged = dbMatches[0]?.source_checksum !== sourceChecksum;
  const isDarChecksumChanged = dbMatches[0]?.dar_checksum !== darChecksum;

  if (isDbRecordMissing) {
    log('info', `No database record for ${sourceUrl}. No checksum available, updating.`);
  } else if (isSourceChanged) {
    log(
      'info',
      `Source data changed for ${sourceUrl}, previous checksum: ${dbMatches[0].source_checksum}, current: ${sourceChecksum}.`,
    );
  } else if (isDarChecksumChanged) {
    log('info', `Implementation of mappers might have changed for ${sourceUrl}.`);
  }

  await putToDar(darId, recordDao, sourceUrl, dataset);
  await dbRecordUpsert(darId, isDbRecordMissing, recordDao, sourceUrl, repositoryType, sourceChecksum, darChecksum);
}

/**
 * Synchronization of the record from source url with the local database and DAR.
 * This function also handles missing record on both local DB side or DAR side.
 *
 * It handles the following scenarios:
 *
 * 1.  **New Version of an Existing Record**:
 *      - If an old version of the record is found, it updates the old record (also updates it's source url).
 * 2.  **New Record**:
 *      - If no matching record is found in DAR, the function posts the new record to DAR.
 *      - It then upserts the new record into the local database.
 * 3.  **Changed Record**:
 *      - If a matching record is found in DAR something has changed both DAR and local DB is updated.
 * 4.  **Up-to-date record**:
 *      - The function ignores the up-to-date record
 * @param {RecordDao} recordDao The data access object for interacting with the local database records table.
 * @param {string} url The source URL of the record.
 * @param {RepositoryType} repositoryType The type of the repository (e.g., 'ZENODO', 'SITES').
 * @param {string} sourceChecksum The checksum of the data from the external source.
 * @param {CommonDataset} dataset The common dataset object to be processed.
 */
async function synchronizeRecord(
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
  const isDbRecordMissing = dbMatches.length === 0;
  const isSourceChanged = dbMatches[0]?.source_checksum !== sourceChecksum;
  const isDarChecksumChanged = dbMatches[0]?.dar_checksum !== darChecksum;

  const oldVersions = dataset.metadata.relatedIdentifiers
    ?.filter((id) => id.relationType === 'IsNewVersionOf')
    .map((id) => id.relatedID);

  // Scenario 1: Handle records that are new versions of existing ones.
  if (oldVersions && oldVersions.length > 0) {
    oldVersions.forEach(async (oldUrl) => {
      const oldVersionsInDb = await recordDao.getRecordBySourceId(oldUrl);
      if (oldVersionsInDb.length > 0) {
        putToDar(oldVersionsInDb[0].dar_id, recordDao, url, dataset);
        dbRecordUpsert(
          oldVersionsInDb[0].dar_id,
          isDbRecordMissing,
          recordDao,
          url,
          repositoryType,
          sourceChecksum,
          darChecksum,
          oldUrl,
        );
        return;
      }
    });
  }

  if (!darMatches) {
    const darId = await postToDar(recordDao, url, dataset);
    await dbRecordUpsert(darId, isDbRecordMissing, recordDao, url, repositoryType, sourceChecksum, darChecksum);
    return;
  }

  if (isDbRecordMissing || isSourceChanged || isDarChecksumChanged) {
    await handleChangedRecord(
      dbMatches,
      sourceChecksum,
      url,
      darMatches,
      recordDao,
      repositoryType,
      dataset,
      darChecksum,
    );
    return;
  }

  await recordDao.updateStatus(url, {
    status: 'success',
  });
}

/**
 * Processes a single record from the SITES repository.
 * It fetches the record, maps it to the common dataset format, calculates a checksum,
 * and then calls the main synchronization function.
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {RecordDao} recordDao
 */
export const processOneSitesRecord = async (sourceUrl: string, recordDao: RecordDao) => {
  const dbRecord = await recordDao.getRecordBySourceId(sourceUrl);
  if (dbRecord && dbRecord[0].status === 'success') {
    return;
  }
  try {
    if (!sourceUrl) return null;
    const recordData = await fetchJson(sourceUrl);
    if (!recordData) return null;
    const matchedSites = getFieldSitesMatchedSites(recordData);
    const mappedDataset = await mapFieldSitesToCommonDatasetMetadata(sourceUrl, recordData, matchedSites);
    const newSourceChecksum = calculateChecksum(recordData);
    await synchronizeRecord(recordDao, sourceUrl, 'SITES', newSourceChecksum, mappedDataset);
  } catch (error) {
    log('error', `Failed to process record for SITES: ${error}`);
    await recordDao.updateStatus(sourceUrl, { status: 'failed' });
  }
};

/**
 * Manages harvesting process for SITES repository.
 * It fetches a list of records. For each record, calls a function to process it.
 * It uses hardcoded DEIMS sites.
 * @param {string[]} sourceUrls An array of field sites URLs.
 * @param {RecordDao} recordDao The data access object for interacting with the local records table.
 */
async function syncSitesRepository(sourceUrls: string[], recordDao: RecordDao) {
  const processingPromises = sourceUrls.map((datasetUrl: string) => {
    return fieldSitesLimiter.schedule(async () => {
      await processOneSitesRecord(datasetUrl, recordDao);
    });
  });
  await Promise.allSettled(processingPromises);
}

/**
 * The main function for harvesting and posting data from the SITES repository.
 * It sets up a database transaction, triggers harvesting, and commits/rollbacks.
 * @param {Pool} pool The PostgreSQL connection pool.
 * @param {string} url The URL of the repository's sitemap.
 */
export async function syncSitesRepositoryAll(url: string, recordDao: RecordDao) {
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

  await syncSitesRepository(urls, recordDao);
}

/**
 * Processes a single record from an API based repository.
 * It fetches the record data, uses mapping for the given repository type, and then calls a function to synchronize data.
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {RecordDao} recordDao
 * @param {SiteReference[]} sites A list of DEIMS sites for matching.
 * @param {RepositoryType} repositoryType The type of the repository to process (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 */
export const processOneRecordTask = async (
  sourceUrl: string,
  recordDao: RecordDao,
  sites: SiteReference[],
  repositoryType?: RepositoryType,
) => {
  let mappedDataset: CommonDataset;
  const dbRecord = await recordDao.getRecordBySourceId(sourceUrl);
  if (dbRecord && dbRecord[0].status === 'success') {
    return;
  }
  const recordData = await fetchJson(sourceUrl);
  if (!recordData) return null;

  switch (repositoryType) {
    case 'B2SHARE_EUDAT':
    case 'B2SHARE_JUELICH': {
      const matchedSites = await getB2ShareMatchedSites(recordData, sites);
      mappedDataset = await mapB2ShareToCommonDatasetMetadata(sourceUrl, recordData, matchedSites, repositoryType);
      break;
    }
    case 'DATAREGISTRY': {
      const matchedSites = await getDataRegistryMatchedSites(recordData);
      mappedDataset = await mapDataRegistryToCommonDatasetMetadata(sourceUrl, recordData, matchedSites);
      break;
    }
    case 'ZENODO':
    case 'ZENODO_IT': {
      const matchedSites = await getZenodoMatchedSites(recordData, sites);
      mappedDataset = await mapZenodoToCommonDatasetMetadata(sourceUrl, recordData, matchedSites);
      repositoryType = 'ZENODO';
      break;
    }
    default:
      throw new Error(`Unknown repository: ${repositoryType}.`);
  }
  const newSourceChecksum = calculateChecksum(recordData);
  const mappedSourceUrl = mappedDataset.metadata.externalSourceInformation.externalSourceURI || sourceUrl;
  await synchronizeRecord(recordDao, mappedSourceUrl, repositoryType, newSourceChecksum, mappedDataset);
};

/**
 * Scheduling processing of each individual record in one page of the repository's API results.
 * This function also extracts the "self" url of all records.
 * For given repositories, it uses a rate limiter to satisfy rate limits of different APIs.
 *
 * @param {string[]} hits An array of "hits" from the API response, where each hit represents a record.
 * @param {RecordDao} recordDao
 * @param {SiteReference[]} sites A list of DEIMS sites for matching.
 * @param {string} selfLinkKey Location of the direct link to the record.
 * @param {RepositoryType} repositoryType The type of the repository to process (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 */
async function processApiHits(
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

/**
 * Manages harvesting process for paginated API repositories.
 * It fetches all the pages of records. For each page, calls a function to process all the individual records.
 * @param {Pool} pool The PostgreSQL connection pool.
 * @param {RepositoryType} repositoryType The type of the repository to process (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 * @param repoConfig The configuration object for the repository.
 */
async function syncApiRepositoryAll(pool: Pool, repositoryType: RepositoryType, repoConfig: any) {
  let page = 1;
  const { apiUrl, pageSize, selfLinkKey, dataKey } = repoConfig;
  const recordDao = new RecordDao(pool);
  const sites = await fetchSites();
  while (pageSize) {
    const pageUrl = `${apiUrl}&size=${pageSize}&page=${page}`;
    log('info', `Fetching the dataset from: ${pageUrl}...`);
    const data = await fetchJson(pageUrl);
    const hits: string[] = dataKey ? getNestedValue(data, dataKey) || [] : [];
    log('info', `Found ${hits.length} self links. Fetching individual records...\n`);

    // // Process individual records using the parser
    await processApiHits(hits, recordDao, sites, selfLinkKey, repositoryType);

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

/**
 * Start the entire data harvesting and posting process for a specified repository type.
 * Calls the appropriate harvesting function based on repository type.
 * @param {Pool} pool The PostgreSQL connection pool.
 * @param {RepositoryType} repositoryType The type of the repository (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 */
export const startRepositorySync = async (pool: Pool, repositoryType: RepositoryType) => {
  log('info', `Starting harvesting job for repository: ${repositoryType}`);
  const repoConfig = CONFIG.REPOSITORIES[repositoryType];
  if (!repoConfig) {
    log('error', `Configuration for repository '${repositoryType}' not available.`);
    throw new Error(`Configuration for repository '${repositoryType}' not available.`);
  }
  const apiUrl = repoConfig.apiUrl;

  let client;
  try {
    const recordDao = new RecordDao(pool);
    client = await pool.connect();
    await client.query('BEGIN');

    // Phase 1: Local Database Validation
    await recordDao.updateRepositoryToInProgress(repositoryType);
    await dbValidationPhase(pool, repositoryType);
    log('info', `Phase 1 completed for ${repositoryType}. Proceeding with Phase 2.`);

    // Phase 2: Remote Synchronization
    if (repositoryType === 'SITES') {
      await syncSitesRepositoryAll(apiUrl, recordDao);
    } else {
      await syncApiRepositoryAll(pool, repositoryType, repoConfig);
    }
    log('info', `Phase 2 completed for ${repositoryType}.`);

    await client.query('COMMIT');
    log('info', `Harvesting for repository: ${repositoryType} finished successfully`);
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    log('error', `Harvesting for repository ${repositoryType} failed with error: ${e}`);
    console.error(e);
  } finally {
    if (client) client.release();
  }
};
