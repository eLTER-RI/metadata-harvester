import { CommonDataset, RepositoryType, SiteReference } from '../../../store/commonStructure';
import { log } from '../../serviceLogging';
import { CONFIG } from '../../../../config';
import { Pool } from 'pg';
import { mapFieldSitesToCommonDatasetMetadata } from '../../../store/parsers/fieldSitesParser';
import { fetchJson, fetchXml } from '../../../utilities/fetchJsonFromRemote';
import { applyRuleToRecord, getNestedValue } from '../../../utilities/rules';
import { calculateChecksum } from '../../../utilities/checksum';
import {
  fetchSites,
  getB2ShareMatchedSites,
  getDataRegistryMatchedSites,
  getFieldSitesMatchedSites,
  getZenodoMatchedSites,
} from '../../../utilities/matchDeimsId';
import { DbRecord, RecordDao } from '../../../store/dao/recordDao';
import { mapB2ShareToCommonDatasetMetadata } from '../../../store/parsers/b2shareParser';
import { mapDataRegistryToCommonDatasetMetadata } from '../../../store/parsers/dataregistryParser';
import { mapZenodoToCommonDatasetMetadata } from '../../../store/parsers/zenodoParser';
import { b2shareLimiter, fieldSitesLimiter, zenodoLimiter } from '../../rateLimiterConcurrency';
import { dbValidationPhase } from './dbValidation';
import { RuleDao } from '../../../store/dao/rulesDao';
import { postToDar, putToDar } from '../../../../api/darApi';
import { dbRecordUpsert } from './dbRecordSync';
import { ResolvedRecordDao } from '../../../store/dao/resolvedRecordsDao';

// Configurations
const currentEnv = process.env.NODE_ENV;
if (currentEnv !== 'prod' && currentEnv !== 'dev' && currentEnv !== 'test') {
  throw new Error(`NODE_ENV must be set to 'prod', 'dev', or 'test'`);
}

export const getApiUrl = () => {
  if (currentEnv === 'prod') return process.env.PROD_API_URL;
  if (currentEnv === 'dev') return process.env.DEV_API_URL;
  return 'http://mock-api-for-tests.com';
};

export const API_URL = getApiUrl();

export const AUTH_TOKEN =
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

export class HarvesterContext {
  constructor(
    public readonly pool: Pool,
    public readonly recordDao: RecordDao,
    public readonly ruleDao: RuleDao,
    public readonly resolvedRecordsDao: ResolvedRecordDao,
    public readonly sites: SiteReference[],
    public readonly repositoryType: RepositoryType,
    public readonly repoConfig: any,
    public readonly checkHarvestChanges: boolean,
  ) {}

  public static async create(
    pool: Pool,
    repositoryType: RepositoryType,
    checkHarvestChanges: boolean,
  ): Promise<HarvesterContext> {
    const recordDao = new RecordDao(pool);
    const ruleDao = new RuleDao(pool);
    const resolvedRecordsDao = new ResolvedRecordDao(pool);
    const sites = await fetchSites();
    const repoConfig = CONFIG.REPOSITORIES[repositoryType];
    return new HarvesterContext(
      pool,
      recordDao,
      ruleDao,
      resolvedRecordsDao,
      sites,
      repositoryType,
      repoConfig,
      checkHarvestChanges,
    );
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
   * @param {string} url The source URL of the record.
   * @param {string} sourceChecksum The checksum of the data from the external source.
   * @param {CommonDataset} dataset The common dataset object to be processed.
   */
  private async synchronizeRecord(url: string, sourceChecksum: string, dataset: CommonDataset) {
    const darChecksum = calculateChecksum(dataset);
    const darMatches = await findDarRecordBySourceURL(url);
    const dbMatches = await this.recordDao.getRecordBySourceId(url);
    const datasetTitle = dataset.metadata.titles ? dataset.metadata.titles[0].titleText : null;
    if (dbMatches.length > 1) {
      throw new Error('More than one existing records of one dataset in the local database.');
    }
    const rewriteRecord = dbMatches.length === 0 || dbMatches[0]?.dar_checksum !== darChecksum;
    const oldVersions = dataset.metadata.relatedIdentifiers
      ?.filter((id) => id.relationType === 'IsNewVersionOf')
      .map((id) => id.relatedID);

    // Scenario 1: Handle records that are new versions of existing ones.
    if (oldVersions && oldVersions.length > 0) {
      oldVersions.forEach(async (oldUrl) => {
        const oldVersionsInDb = await this.recordDao.getRecordBySourceId(oldUrl);
        if (oldVersionsInDb.length > 0) {
          log('warn', 'New version for record on url: ' + url + 'found: ' + oldVersionsInDb[0].dar_id);
          putToDar(oldVersionsInDb[0].dar_id, this.recordDao, url, dataset);
          dbRecordUpsert(
            oldVersionsInDb[0].dar_id,
            this.recordDao,
            url,
            this.repositoryType,
            sourceChecksum,
            darChecksum,
            datasetTitle,
            oldUrl,
          );
          return;
        }
      });
    }

    if (!darMatches) {
      const darId = await postToDar(this.recordDao, url, dataset);
      await dbRecordUpsert(darId, this.recordDao, url, this.repositoryType, sourceChecksum, darChecksum, datasetTitle);
      return;
    }

    if (rewriteRecord) {
      await this.resolvedRecordsDao.delete(darMatches);
      await this.handleChangedRecord(dbMatches, sourceChecksum, url, darMatches, dataset, darChecksum);
      return;
    }

    await this.recordDao.updateStatus(url, {
      status: 'success',
    });
  }

  /**
   * Processes a single record from an API based repository.
   * It fetches the record data, gets mapping for the given repository type, and then calls a function to synchronize data.
   * @param {string} sourceUrl The source URL of the record on the remote repository.
   */
  public async processOneRecordTask(sourceUrl: string) {
    let dbRecord = await this.recordDao.getRecordBySourceId(sourceUrl);
    if (dbRecord && dbRecord[0] && dbRecord[0].status === 'success') {
      return;
    }
    const recordData = await fetchJson(sourceUrl);
    if (!recordData) return;
    const newSourceChecksum = calculateChecksum(recordData);
    const isSourceChanged = dbRecord[0]?.source_checksum !== newSourceChecksum;
    if (!this.checkHarvestChanges && !isSourceChanged) return;

    const finalMappedDataset = await this.mapToCommonStructure(sourceUrl, recordData);
    const mappedSourceUrl = finalMappedDataset.metadata.externalSourceInformation.externalSourceURI || sourceUrl;
    dbRecord = await this.recordDao.getRecordBySourceId(mappedSourceUrl);
    if (dbRecord && dbRecord[0]) {
      const darId = dbRecord[0].dar_id;
      await this.applyRulesToRecord(finalMappedDataset, darId);
    }
    await this.synchronizeRecord(mappedSourceUrl, newSourceChecksum, finalMappedDataset);
  }

  /**
   * Maps the recordData expected to be fetched json into a CommonDataset.
   * @param {string} sourceUrl The source URL of the record on the remote repository.
   * @param {any} recordData
   */
  public async mapToCommonStructure(sourceUrl: string, recordData: any): Promise<CommonDataset> {
    let mappedDataset: CommonDataset;
    let repositoryType = this.repositoryType;
    switch (repositoryType) {
      case 'B2SHARE_EUDAT':
      case 'B2SHARE_JUELICH': {
        const matchedSites = await getB2ShareMatchedSites(recordData, this.sites);
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
        const matchedSites = await getZenodoMatchedSites(recordData, this.sites);
        mappedDataset = await mapZenodoToCommonDatasetMetadata(sourceUrl, recordData, matchedSites);
        repositoryType = 'ZENODO';
        break;
      }
      default:
        throw new Error(`Unknown repository: ${repositoryType}.`);
    }

    return mappedDataset;
  }

  /**
   * Checks rules for dataset, deletes the ones where original value has changed, and applies all other.
   * @param {CommonDataset} record The source URL of the record on the remote repository.
   * @param {string} darId
   */
  public async applyRulesToRecord(record: CommonDataset, darId: string): Promise<void> {
    const repoRules = await this.ruleDao.getRulesForRecord(darId);
    for (const rule of repoRules) {
      const ruleApplied = applyRuleToRecord(record, rule);
      if (!ruleApplied) {
        await this.ruleDao.deleteRule(rule.id);
      }
    }
  }

  /**
   * Logs how record had changed, sends PUT request to DAR, and upserts database.
   * @param {DbRecord[]} dbMatches A list of records found in the local database matching the source URL.
   * @param {string} sourceChecksum The checksum of the current source data.
   * @param {string} sourceUrl The source URL of the record.
   * @param {string} darId The ID of the record in DAR. If set to null, it assumes record POST/PUT to dar was unsuccessful.
   * @param {CommonDataset} dataset Source data after mapping.
   * @param {string} darChecksum Source data checksum.
   */
  private async handleChangedRecord(
    dbMatches: DbRecord[],
    sourceChecksum: string,
    sourceUrl: string,
    darId: string,
    dataset: CommonDataset,
    darChecksum: string,
  ) {
    const isDbRecordMissing = dbMatches.length === 0;
    const isSourceChanged = dbMatches[0]?.source_checksum !== sourceChecksum;
    const isDarChecksumChanged = dbMatches[0]?.dar_checksum !== darChecksum;
    const datasetTitle = dataset.metadata.titles ? dataset.metadata.titles[0].titleText : '';

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

    await putToDar(darId, this.recordDao, sourceUrl, dataset);
    await dbRecordUpsert(
      darId,
      this.recordDao,
      sourceUrl,
      this.repositoryType,
      sourceChecksum,
      darChecksum,
      datasetTitle,
    );
  }

  /**
   * Scheduling processing of each individual record in one page of the repository's API results.
   * This function also extracts the "self" url of all records.
   * For given repositories, it uses a rate limiter to satisfy rate limits of different APIs.
   *
   * @param {string[]} hits An array of "hits" from the API response, where each hit represents a record.
   */
  public async processApiHits(hits: any[]) {
    const { selfLinkKey } = this.repoConfig;
    await Promise.all(
      hits.map(async (hit: any) => {
        if (!hit) return null;
        const recordUrl = getNestedValue(hit, selfLinkKey);
        if (this.repositoryType === 'B2SHARE_EUDAT' || this.repositoryType === 'B2SHARE_JUELICH') {
          return b2shareLimiter.schedule(() => this.processOneRecordTask(recordUrl));
        }
        if (this.repositoryType === 'ZENODO' || this.repositoryType === 'ZENODO_IT') {
          return zenodoLimiter.schedule(() => this.processOneRecordTask(recordUrl));
        }
        return this.processOneRecordTask(recordUrl);
      }),
    );
  }

  /**
   * Manages harvesting process for paginated API repositories.
   */
  public async syncApiRepositoryAll() {
    let page = 1;
    const { apiUrl, pageSize, dataKey } = this.repoConfig;
    while (pageSize) {
      const pageUrl = `${apiUrl}&size=${pageSize}&page=${page}`;
      log('info', `Fetching the dataset from: ${pageUrl}...`);
      const data = await fetchJson(pageUrl);
      const hits: string[] = dataKey ? getNestedValue(data, dataKey) || [] : [];
      log('info', `Found ${hits.length} self links. Fetching individual records...\n`);

      // // Process individual records using the parser
      await this.processApiHits(hits);

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
   * Manages harvesting process for SITES repository.
   * It fetches a list of records. For each record, calls a function to process it.
   * It uses hardcoded DEIMS sites.
   * @param {string[]} sourceUrls An array of field sites URLs.
   */
  public async syncSitesRepository(sourceUrls: string[]) {
    const processingPromises = sourceUrls.map((datasetUrl: string) => {
      return fieldSitesLimiter.schedule(async () => {
        await this.processOneSitesRecord(datasetUrl);
      });
    });
    await Promise.allSettled(processingPromises);
  }

  /**
   * The main function for harvesting and posting data from the SITES repository.
   * It sets up a database transaction, triggers harvesting, and commits/rollbacks.
   * @param {string} url The URL of the repository's sitemap.
   */
  public async syncSitesRepositoryAll(url: string) {
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

    await this.syncSitesRepository(urls);
  }

  /**
   * Processes a single record from the SITES repository.
   * It fetches the record, maps it to the common dataset format, calculates a checksum,
   * and then calls the main synchronization function.
   * @param {string} sourceUrl The source URL of the record on the remote repository.
   * @param {RecordDao} recordDao
   */
  public async processOneSitesRecord(sourceUrl: string) {
    const dbRecord = await this.recordDao.getRecordBySourceId(sourceUrl);
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
      await this.synchronizeRecord(sourceUrl, newSourceChecksum, mappedDataset);
    } catch (error) {
      log('error', `Failed to process record for SITES: ${error}`);
      await this.recordDao.updateStatus(sourceUrl, { status: 'failed' });
    }
  }
}

/**
 * Start the entire data harvesting and posting process for a specified repository type.
 * Calls the appropriate harvesting function based on repository type.
 * @param {HarvesterContext} ctx
 */
export const startRepositorySync = async (ctx: HarvesterContext) => {
  log('info', `Starting harvesting job for repository: ${ctx.repositoryType}`);

  let client;
  try {
    if (!ctx.repoConfig) {
      log('error', `Configuration for repository '${ctx.repositoryType}' not available.`);
      throw new Error(`Configuration for repository '${ctx.repositoryType}' not available.`);
    }
    const apiUrl = ctx.repoConfig.apiUrl;
    client = await ctx.pool.connect();
    await client.query('BEGIN');

    // Phase 1: Local Database Validation
    await ctx.recordDao.updateRepositoryToInProgress(ctx.repositoryType);
    await dbValidationPhase(ctx);
    log('info', `Phase 1 completed for ${ctx.repositoryType}. Proceeding with Phase 2.`);

    // Phase 2: Remote Synchronization
    if (ctx.repositoryType === 'SITES') {
      await ctx.syncSitesRepositoryAll(apiUrl);
    } else {
      await ctx.syncApiRepositoryAll();
    }
    log('info', `Phase 2 completed for ${ctx.repositoryType}.`);

    await client.query('COMMIT');
    log('info', `Harvesting for repository: ${ctx.repositoryType} finished successfully`);
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    log('error', `Harvesting for repository ${ctx.repositoryType} failed with error: ${e}`);
    throw e;
  } finally {
    if (client) client.release();
  }
};

/**
 * Processes a single record from a repository..
 * @param {HarvesterContext} ctx
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 */
export const startRecordSync = async (ctx: HarvesterContext, sourceUrl: string) => {
  log('info', `Starting harvesting job for one record ${sourceUrl} from ${ctx.repositoryType}`);
  let client;
  try {
    client = await ctx.pool.connect();
    await client.query('BEGIN');
    // Process just one record
    if (ctx.repositoryType === 'SITES') {
      await ctx.processOneSitesRecord(sourceUrl);
    } else {
      const { selfLinkKey, singleRecordKey } = ctx.repoConfig;
      const recordData = await fetchJson(sourceUrl);
      if (!recordData) return null;
      const dataUnderKey = singleRecordKey ? getNestedValue(recordData, singleRecordKey) : recordData;
      const recordUrl = getNestedValue(dataUnderKey, selfLinkKey);
      if (recordUrl != sourceUrl) {
        log('info', `Found a different url: harvesting from ${recordUrl}`);
      }
      await ctx.recordDao.updateStatus(recordUrl, {
        status: 'in_progress',
      });
      await ctx.processOneRecordTask(recordUrl);
    }

    await client.query('COMMIT');
    log('info', `Harvesting for record ${sourceUrl} finished successfully.`);
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    log('error', `Harvesting for record ${sourceUrl} failed with error: ${e}`);
    throw e;
  } finally {
    if (client) client.release();
  }
};
