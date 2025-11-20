import { Pool, PoolClient } from 'pg';
import {
  HarvesterContext,
  startRecordSync,
  startRepositorySync,
} from '../../../../src/services/jobs/harvest/harvester';
import { DbRecord, RecordDao } from '../../../../src/store/dao/recordDao';
import { ResolvedRecordDao } from '../../../../src/store/dao/resolvedRecordsDao';
import {
  fetchSites,
  getB2ShareMatchedSites,
  getDataRegistryMatchedSites,
} from '../../../../src/utilities/matchDeimsId';
import { mapB2ShareToCommonDatasetMetadata } from '../../../../src/mappers/b2shareMapper';
import { mapDataRegistryToCommonDatasetMetadata } from '../../../../src/mappers/dataregistryMapper';
import { mapZenodoToCommonDatasetMetadata } from '../../../../src/mappers/zenodoMapper';
import { mapFieldSitesToCommonDatasetMetadata } from '../../../../src/mappers/fieldSitesMapper';
import { RuleDao, RuleDbRecord } from '../../../../src/store/dao/rulesDao';
import * as rulesUtilities from '../../../../src/utilities/rules';
import * as fetchers from '../../../../src/utilities/fetchJsonFromRemote';
import * as checksumUtils from '../../../../src/utilities/checksum';
import * as darApi from '../../../../src/services/clients/darApi';
import * as dbRecordSync from '../../../../src/services/jobs/harvest/dbRecordSync';
import { CONFIG } from '../../../../src/config/config';
import { dbValidationPhase } from '../../../../src/services/jobs/harvest/dbValidation';
import { CommonDataset, IdentifierType } from '../../../../src/models/commonStructure';
import { getZenodoMatchedSites } from '../../../../src/utilities/matchDeimsId';
import { fieldSitesLimiter } from '../../../../src/services/rateLimiterConcurrency';
import { log } from '../../../../src/services/serviceLogging';

// To isolate all other layers, we need to isolate the following:
// those should be tested separately
jest.mock('pg');

// API
jest.mock('../../../../src/services/clients/darApi', () => ({
  findDarRecordBySourceURL: jest.fn(),
  postToDar: jest.fn(),
  putToDar: jest.fn(),
}));

// DAO
jest.mock('../../../../src/store/dao/recordDao');
jest.mock('../../../../src/store/dao/rulesDao');
jest.mock('../../../../src/store/dao/resolvedRecordsDao');

// utilities
jest.mock('../../../../src/utilities/fetchJsonFromRemote');
jest.mock('../../../../src/utilities/checksum');
jest.mock('../../../../src/utilities/matchDeimsId');
jest.mock('../../../../src/utilities/rules', () => ({
  // this is here because we use getNested for our tests
  ...jest.requireActual('../../../../src/utilities/rules'), // keep all original functions
  applyRuleToRecord: jest.fn(), // override only the function we want to mock
}));
const mockedFetchSites = fetchSites as jest.Mock;
const mockedApplyRuleToRecord = rulesUtilities.applyRuleToRecord as jest.Mock;
const mockedFetchJson = fetchers.fetchJson as jest.Mock;
const mockedFetchXml = fetchers.fetchXml as jest.Mock;
const mockedCalculateChecksum = checksumUtils.calculateChecksum as jest.Mock;
const mockedPutToDar = darApi.putToDar as jest.Mock;
const mockedPostToDar = darApi.postToDar as jest.Mock;
const mockedFindDar = darApi.findDarRecordBySourceURL as jest.Mock;
const mockedDbRecordUpsert = dbRecordSync.dbRecordUpsert as jest.Mock;

// mappers
jest.mock('../../../../src/mappers/b2shareMapper');
jest.mock('../../../../src/mappers/dataregistryMapper');
jest.mock('../../../../src/mappers/zenodoMapper');
jest.mock('../../../../src/mappers/fieldSitesMapper');

// services
jest.mock('../../../../src/services/jobs/harvest/dbValidation');
jest.mock('../../../../src/services/jobs/harvest/dbRecordSync');
jest.mock('../../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));

describe('Test harvester file', () => {
  let context: HarvesterContext;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;
  let mockRecordDao: jest.Mocked<RecordDao>;
  let mockResolvedRecordsDao: jest.Mocked<ResolvedRecordDao>;
  let mockRuleDao: jest.Mocked<RuleDao>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
    } as any;
    mockPool = new (Pool as any)();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    mockRecordDao = new (RecordDao as any)(mockPool);
    mockResolvedRecordsDao = new (ResolvedRecordDao as any)(mockPool);
    mockRuleDao = new (RuleDao as any)(mockPool);
    context = new HarvesterContext(
      mockPool,
      mockRecordDao,
      mockRuleDao,
      mockResolvedRecordsDao,
      [{ siteID: 'deims-1', siteName: 'Test Site' }],
      'ZENODO',
      CONFIG.REPOSITORIES.ZENODO,
      true,
    );

    // Mock DAO method returns
    mockRecordDao.getRecordBySourceUrl.mockResolvedValue([]);
    mockRecordDao.listRecordsByRepository.mockResolvedValue([]);
    mockRuleDao.getRulesForRecord.mockResolvedValue([]);
    mockRecordDao.updateStatus.mockResolvedValue(undefined);
    mockRecordDao.deleteUnseenRecords.mockResolvedValue([]);
    mockResolvedRecordsDao.delete.mockResolvedValue(undefined);

    mockedFetchSites.mockResolvedValue([{ siteID: 'deims-1', siteName: 'Test Site' }]);
  });

  describe('Tests HarvesterContext', () => {
    it('should have correct properties based on repository types', async () => {
      const zenodoContext = await HarvesterContext.create(mockPool, 'ZENODO', true);
      expect(fetchSites).toHaveBeenCalled();
      expect(zenodoContext.repositoryType).toBe('ZENODO');
      expect(zenodoContext.sites).toHaveLength(1);
      expect(zenodoContext.repoConfig.processFunction).toBe('processApiPage');
      expect(zenodoContext.repoConfig.selfLinkKey).toBe('links.self');
      expect(zenodoContext.repoConfig.dataKey).toBe('hits.hits');

      const b2shareContext = await HarvesterContext.create(mockPool, 'B2SHARE_EUDAT', true);
      expect(fetchSites).toHaveBeenCalled();
      expect(b2shareContext.repositoryType).toBe('B2SHARE_EUDAT');
      expect(b2shareContext.sites).toHaveLength(1);
      expect(b2shareContext.repoConfig.processFunction).toBe('processApiPage');
      expect(b2shareContext.repoConfig.selfLinkKey).toBe('links.self');
      expect(b2shareContext.repoConfig.dataKey).toBe('hits.hits');

      const dataregistryContext = await HarvesterContext.create(mockPool, 'DATAREGISTRY', true);
      expect(fetchSites).toHaveBeenCalled();
      expect(dataregistryContext.repositoryType).toBe('DATAREGISTRY');
      expect(dataregistryContext.sites).toHaveLength(1);
      expect(dataregistryContext.repoConfig.processFunction).toBe('processApiPage');
      expect(dataregistryContext.repoConfig.selfLinkKey).toBe('link');
      expect(dataregistryContext.repoConfig.dataKey).toBe('resources');
      expect(dataregistryContext.repoConfig.singleRecordKey).toBe('resource');

      const fieldSitesContext = await HarvesterContext.create(mockPool, 'SITES', true);
      expect(fetchSites).toHaveBeenCalled();
      expect(fieldSitesContext.repositoryType).toBe('SITES');
      expect(fieldSitesContext.sites).toHaveLength(1);
      expect(fieldSitesContext.repoConfig.processFunction).toBe('processFieldSitesPage');
      expect(fieldSitesContext.repoConfig.selfLinkKey).toBeUndefined();
      expect(fieldSitesContext.repoConfig.dataKey).toBeUndefined();
    });

    it('should call the correct mapper based on repositoryType', async () => {
      (mapB2ShareToCommonDatasetMetadata as jest.Mock).mockResolvedValue({});
      (mapZenodoToCommonDatasetMetadata as jest.Mock).mockResolvedValue({});
      (mapDataRegistryToCommonDatasetMetadata as jest.Mock).mockResolvedValue({});
      (mapFieldSitesToCommonDatasetMetadata as jest.Mock).mockResolvedValue({});

      const b2shareRecord = { id: 'b2share1' };
      const b2shareContext = await HarvesterContext.create(mockPool, 'B2SHARE_EUDAT', true);
      await b2shareContext.mapToCommonStructure('http://example.com/b2share/1', b2shareRecord);
      expect(mapB2ShareToCommonDatasetMetadata).toHaveBeenCalled();

      const zenodoRecord = { id: 'zenodo1' };
      const zenodoContext = await HarvesterContext.create(mockPool, 'ZENODO', true);
      await zenodoContext.mapToCommonStructure('http://example.com/zenodo/1', zenodoRecord);
      expect(mapZenodoToCommonDatasetMetadata).toHaveBeenCalled();

      const dataregistryRecord = { id: 'dataregistry1' };
      const dataregistryContext = await HarvesterContext.create(mockPool, 'DATAREGISTRY', true);
      await dataregistryContext.mapToCommonStructure('http://example.com/dataregistry/1', dataregistryRecord);
      expect(mapDataRegistryToCommonDatasetMetadata).toHaveBeenCalled();
    });
  });
  describe('synchronizeRecord', () => {
    beforeEach(() => {
      // we do not need any results of fetch,
      // but it gets called by findDarRecordBySourceUrl
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hits: { hits: [] } }),
      });
    });

    it('should handle new versions of existing records', async () => {
      const oldUrl = 'http://zenodo.org/old';
      const newUrl = 'http://zenodo.org/new';
      const oldDbRecord: DbRecord = {
        source_url: oldUrl,
        source_repository: 'ZENODO',
        source_checksum: 'matching-checksum',
        dar_id: 'dar-id-old',
        dar_checksum: 'matching-checksum',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
        site_references: [],
        habitat_references: [],
        dataset_type: null,
        keywords: [],
      };
      const newDataset: CommonDataset = {
        metadata: {
          assetType: 'Dataset',
          titles: [{ titleText: 'New Version' }],
          relatedIdentifiers: [
            { relationType: 'IsNewVersionOf', relatedID: oldUrl, relatedIDType: 'URL', relatedResourceType: 'Dataset' },
          ],
          externalSourceInformation: { externalSourceURI: newUrl },
        },
      };

      mockedCalculateChecksum.mockReturnValue('mocked-dar-checksum');
      mockRecordDao.getRecordBySourceUrl.mockImplementation((url) => {
        if (url === oldUrl) return Promise.resolve([oldDbRecord]);
        return Promise.resolve([]);
      });
      mockedPutToDar.mockResolvedValue(true);
      mockedDbRecordUpsert.mockResolvedValue(undefined);

      await (context as any).synchronizeRecord(newUrl, 'new-checksum', newDataset);

      expect(mockRecordDao.getRecordBySourceUrl).toHaveBeenCalledWith(oldUrl);
      expect(mockedPutToDar).toHaveBeenCalledWith('dar-id-old', mockRecordDao, newUrl, newDataset);
      expect(mockedDbRecordUpsert).toHaveBeenCalledWith(
        'dar-id-old',
        mockRecordDao,
        newUrl,
        context.repositoryType,
        'new-checksum',
        'mocked-dar-checksum',
        newDataset,
        oldUrl,
      );
    });

    it('should POST a new record if no match in DAR', async () => {
      const sourceUrl = 'http://zenodo.org/new';
      const newDataset: CommonDataset = {
        metadata: {
          assetType: 'Dataset',
          titles: [{ titleText: 'New Record' }],
          externalSourceInformation: {},
        },
      };

      // no record found in DAR
      mockedFindDar.mockResolvedValue(null);
      mockedPostToDar.mockResolvedValue('new-id-from-dar');

      await (context as any).synchronizeRecord(sourceUrl, 'source-checksum', newDataset);

      expect(mockedPostToDar).toHaveBeenCalledWith(mockRecordDao, sourceUrl, newDataset);
      expect(mockedDbRecordUpsert).toHaveBeenCalledWith(
        'new-id-from-dar',
        mockRecordDao,
        sourceUrl,
        context.repositoryType,
        'source-checksum',
        'mocked-dar-checksum',
        newDataset,
      );
      expect(mockedPutToDar).not.toHaveBeenCalled();
    });

    it('should call handleChangedRecord when records changes', async () => {
      const sourceUrl = 'http://zenodo.org/changed';
      const changedDataset: CommonDataset = {
        metadata: {
          assetType: 'Dataset',
          titles: [{ titleText: 'Changed record' }],
          externalSourceInformation: {},
        },
      };

      // faking a different checksum in the DB to execute 'rewriteRecord'
      mockedFindDar.mockResolvedValue('existing-dar-id');
      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([{ dar_checksum: 'old-dar-checksum' }] as any);

      const handleChangedSpy = jest.spyOn(context as any, 'handleChangedRecord');

      await (context as any).synchronizeRecord(sourceUrl, 'source-checksum', changedDataset);

      expect(handleChangedSpy).toHaveBeenCalled();
      expect(mockedPostToDar).not.toHaveBeenCalled();
    });

    it('should update record to "success" status for an up-to-date record', async () => {
      const sourceUrl = 'http://example.com/up-to-date-record';
      const upToDateDataset = { metadata: { titles: [{ titleText: 'Up To Date' }], externalSourceInformation: {} } };

      mockedFindDar.mockResolvedValue('existing-dar-id');
      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([
        {
          dar_checksum: 'mocked-dar-checksum',
          source_checksum: 'source-checksum',
          dar_id: null,
          site_references: [],
          habitat_references: [],
          dataset_type: null,
          keywords: [],
        },
      ] as any);

      await (context as any).synchronizeRecord(sourceUrl, 'source-checksum', upToDateDataset);

      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'success' });
      expect(mockedPostToDar).not.toHaveBeenCalled();
      expect(mockedPutToDar).not.toHaveBeenCalled();
      expect(mockedDbRecordUpsert).not.toHaveBeenCalled();
    });
  });
  describe('processOneRecordTask', () => {
    const sourceUrl = 'http://example.com/record/1';
    const apiData = { id: 1, title: 'API Data' };
    const mappedData = {
      metadata: { externalSourceInformation: { externalSourceURI: sourceUrl }, relatedIdentifiers: [] },
    };

    beforeEach(() => {
      mockedFetchJson.mockResolvedValue(apiData);
      mockedCalculateChecksum.mockReturnValue('a checksum value');
      (context.mapToCommonStructure as jest.Mock) = jest.fn().mockResolvedValue(mappedData);
      (context as any).synchronizeRecord = jest.fn().mockResolvedValue(undefined);
    });

    it('should process a record that is not in the database', async () => {
      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([]);
      await context.processOneRecordTask(sourceUrl);
      expect(mockedFetchJson).toHaveBeenCalledWith(sourceUrl);
      expect(context.mapToCommonStructure).toHaveBeenCalledWith(sourceUrl, apiData);
    });

    it('should not process a if checkHarvestChanges false and checksums match', async () => {
      context = new HarvesterContext(
        mockPool,
        mockRecordDao,
        mockRuleDao,
        mockResolvedRecordsDao,
        [{ siteID: 'deims-1', siteName: 'Test Site' }],
        'ZENODO',
        CONFIG.REPOSITORIES.ZENODO,
        false,
      );
      const existingDbRecord: DbRecord = {
        source_url: sourceUrl,
        source_repository: 'ZENODO',
        source_checksum: 'matching-checksum',
        dar_id: 'aaa',
        dar_checksum: 'matching-checksum',
        status: 'success',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
        site_references: [],
        habitat_references: [],
        dataset_type: null,
        keywords: [],
      };
      const mapSpy = jest.spyOn(context, 'mapToCommonStructure');
      const syncSpy = jest.spyOn(context as any, 'synchronizeRecord');

      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([existingDbRecord]);
      mockRuleDao.getRulesForRecord.mockResolvedValue([]);
      mockedCalculateChecksum.mockReturnValue('matching-checksum');

      await context.processOneRecordTask(sourceUrl);

      expect(mockedFetchJson).not.toHaveBeenCalled();
      expect(mapSpy).not.toHaveBeenCalled();
      expect(syncSpy).not.toHaveBeenCalled();
      expect(mockRecordDao.updateLastSeen).toHaveBeenCalledWith(sourceUrl);
    });

    it('should apply rules if a record already exists in the DB', async () => {
      const mockMappedData = {
        metadata: {
          titles: [{ titleText: 'A title of a record' }],
          assetType: 'Dataset',
          externalSourceInformation: {},
        },
      };
      const existingDbRecord: DbRecord = {
        source_url: sourceUrl,
        source_repository: 'ZENODO',
        source_checksum: 'matching-checksum',
        dar_id: 'bbb',
        dar_checksum: 'matching-checksum',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
        site_references: [],
        habitat_references: [],
        dataset_type: null,
        keywords: [],
      };
      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([existingDbRecord]);
      mockRuleDao.getRulesForRecord.mockResolvedValue([
        { id: '1', dar_id: 'bbb', target_path: 'test', before_value: null, after_value: null },
      ]);
      (context.mapToCommonStructure as jest.Mock).mockResolvedValue(mockMappedData);
      context.applyRulesToRecord = jest.fn();

      await context.processOneRecordTask(sourceUrl);

      expect(context.applyRulesToRecord).toHaveBeenCalledWith(mockMappedData, existingDbRecord.dar_id);
    });

    it('should stop processing if status success', async () => {
      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([
        {
          status: 'success',
          dar_id: null,
          site_references: [],
          habitat_references: [],
          dataset_type: null,
          keywords: [],
        },
      ] as any);

      await context.processOneRecordTask(sourceUrl);

      expect(mockedFetchJson).not.toHaveBeenCalled();
      expect(mockedCalculateChecksum).not.toHaveBeenCalled();
      expect(context.mapToCommonStructure as jest.Mock).not.toHaveBeenCalled();
      expect((context as any).synchronizeRecord).not.toHaveBeenCalled();
    });
  });
  describe('mapToCommonStructure', () => {
    it('should call the correct mapper for the ZENODO repository type', async () => {
      const zenodoContext = await HarvesterContext.create(mockPool, 'ZENODO', true);
      const sourceUrl = 'http://zenodo.org/record/1';
      const recordData = { id: 'zenodo-1', title: 'Test Data' };
      const expectedMappedDataset = { metadata: { assetType: 'Dataset' } };

      (getZenodoMatchedSites as jest.Mock).mockResolvedValue([]);
      (mapZenodoToCommonDatasetMetadata as jest.Mock).mockResolvedValue(expectedMappedDataset);

      await zenodoContext.mapToCommonStructure(sourceUrl, recordData);

      expect(getZenodoMatchedSites).toHaveBeenCalledWith(recordData, zenodoContext.sites);
      expect(mapZenodoToCommonDatasetMetadata).toHaveBeenCalledWith(sourceUrl, recordData, []);
    });

    it('should call the correct mapper for the B2SHARE repository type', async () => {
      const b2shareContext = await HarvesterContext.create(mockPool, 'B2SHARE_EUDAT', true);
      const sourceUrl = 'http://b2shareEudat.org/record/1';
      const recordData = { id: 'b2share-1', title: 'Test Data' };
      const expectedMappedDataset = { metadata: { assetType: 'Dataset' } };

      (getB2ShareMatchedSites as jest.Mock).mockResolvedValue([]);
      (mapB2ShareToCommonDatasetMetadata as jest.Mock).mockResolvedValue(expectedMappedDataset);

      await b2shareContext.mapToCommonStructure(sourceUrl, recordData);

      expect(getB2ShareMatchedSites).toHaveBeenCalledWith(recordData, b2shareContext.sites);
      expect(mapB2ShareToCommonDatasetMetadata).toHaveBeenCalledWith(sourceUrl, recordData, [], 'B2SHARE_EUDAT');
    });

    it('should call the correct mapper for the Dataregistry repository type', async () => {
      const dataregistryCtx = await HarvesterContext.create(mockPool, 'DATAREGISTRY', true);
      const sourceUrl = 'https://dataregistry.lteritalia.it/.org/record/1';
      const recordData = { id: 'dataregistry-1', title: 'Test Data' };
      const expectedMappedDataset = { metadata: { assetType: 'Dataset' } };

      (getDataRegistryMatchedSites as jest.Mock).mockResolvedValue([]);
      (mapDataRegistryToCommonDatasetMetadata as jest.Mock).mockResolvedValue(expectedMappedDataset);

      await dataregistryCtx.mapToCommonStructure(sourceUrl, recordData);

      expect(getDataRegistryMatchedSites).toHaveBeenCalledWith(recordData);
      expect(mapDataRegistryToCommonDatasetMetadata).toHaveBeenCalledWith(sourceUrl, recordData, []);
    });
  });
  describe('applyRulesToRecord', () => {
    const mockRecord = {
      metadata: {
        assetType: 'Dataset' as IdentifierType,
        titles: [{ titleText: 'Some title of a record from remote repository' }],
        descriptions: [
          {
            descriptionText: 'Description text.',
            descriptionType: 'Abstract',
          },
        ],
        externalSourceInformation: {
          externalSourceName: 'Zenodo',
        },
      },
    };
    const darId = 'dar-123';

    const workingRule: RuleDbRecord = {
      id: '1',
      dar_id: 'abc-def',
      target_path: 'metadata.keywords',
      before_value: undefined,
      after_value: { keywordLabel: 'First Keyword' },
    };

    const brokenRule: RuleDbRecord = {
      id: '2',
      dar_id: 'ghi-jkl',
      target_path: 'metadata.keywords',
      before_value: undefined,
      after_value: [{ notExistingFieldName: 'Second Keyword' }],
    };

    it('should apply a rule that works and not delete it', async () => {
      mockRuleDao.getRulesForRecord.mockResolvedValue([workingRule]);
      mockedApplyRuleToRecord.mockReturnValue(true);

      await context.applyRulesToRecord(mockRecord, darId);

      expect(mockRuleDao.getRulesForRecord).toHaveBeenCalledWith(darId);
      expect(mockedApplyRuleToRecord).toHaveBeenCalledWith(mockRecord, workingRule);
      expect(mockRuleDao.deleteRuleForRecord).not.toHaveBeenCalled();
    });

    it('should delete a rule that fails to apply', async () => {
      mockRuleDao.getRulesForRecord.mockResolvedValue([brokenRule]);
      mockedApplyRuleToRecord.mockReturnValue(false);

      await context.applyRulesToRecord(mockRecord, darId);

      expect(mockedApplyRuleToRecord).toHaveBeenCalledWith(mockRecord, brokenRule);
      expect(mockRuleDao.deleteRule).toHaveBeenCalledTimes(1);
      expect(mockRuleDao.deleteRule).toHaveBeenCalledWith(brokenRule.id);
    });

    it('should handle a combination of working and not working rules', async () => {
      const workingRule2: RuleDbRecord = {
        id: '3',
        dar_id: 'ccc-ddd',
        target_path: 'metadata.descriptions[0].descriptionType',
        before_value: 'Abstract',
        after_value: 'Other',
      };
      mockRuleDao.getRulesForRecord.mockResolvedValue([workingRule, brokenRule, workingRule2]);

      mockedApplyRuleToRecord.mockImplementation((record, rule) => {
        return rule.id !== '2';
      });

      await context.applyRulesToRecord(mockRecord, darId);

      expect(mockedApplyRuleToRecord).toHaveBeenCalledTimes(3);
      expect(mockRuleDao.deleteRule).toHaveBeenCalledTimes(1);
      expect(mockRuleDao.deleteRule).toHaveBeenCalledWith('2');
    });
  });
  describe('handleChangedRecord - tests only logging', () => {
    const sourceUrl = 'http://dataregistry.com/changed-record';
    const darId = 'dar-id-123';
    const dataset: CommonDataset = {
      metadata: {
        assetType: 'Dataset',
        titles: [{ titleText: 'Test Title' }],
        externalSourceInformation: {},
      },
    };
    let handleChangedSpy: jest.SpyInstance;

    beforeEach(() => {
      handleChangedSpy = jest.spyOn(context as any, 'handleChangedRecord');
      mockedPutToDar.mockResolvedValue(true);
      mockedDbRecordUpsert.mockResolvedValue(undefined);
      mockedFindDar.mockResolvedValue(darId);

      // calling function uses fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hits: { hits: [{ id: darId }] } }),
      });
    });

    it('should log "No database record" when the local record is missing', async () => {
      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([]); // No DB matches
      mockRuleDao.getRulesForRecord.mockResolvedValue([]);
      mockedCalculateChecksum.mockReturnValue('new-checksum');

      (context.mapToCommonStructure as jest.Mock) = jest.fn().mockResolvedValue({
        metadata: {
          titles: [{ titleText: 'Test Title' }],
          externalSourceInformation: { externalSourceURI: sourceUrl },
        },
      });
      await context.processOneRecordTask(sourceUrl);

      expect(handleChangedSpy).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('info', expect.stringContaining('No database record'));
      expect(mockedPutToDar).toHaveBeenCalledTimes(1);
      expect(mockedDbRecordUpsert).toHaveBeenCalledTimes(1);
    });

    it('should log "Source data changed" when source checksum differs', async () => {
      const dbRecord: DbRecord = {
        source_url: 'sites.org',
        source_repository: 'SITES',
        source_checksum: 'old-source-hecksum',
        dar_id: 'dar-id-',
        dar_checksum: 'dar-checksum',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
        site_references: [],
        habitat_references: [],
        dataset_type: null,
        keywords: [],
      };

      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([dbRecord]);
      mockRuleDao.getRulesForRecord.mockResolvedValue([]);
      // DAR checksum same
      mockedCalculateChecksum.mockReturnValue('dar-checksum');

      // different source checksum
      await (context as any).synchronizeRecord(sourceUrl, 'new-source-checksum', dataset);

      expect(handleChangedSpy).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('info', expect.stringContaining('Source data changed'));
      expect(mockedPutToDar).toHaveBeenCalledTimes(1);
      expect(mockedDbRecordUpsert).toHaveBeenCalledTimes(1);
    });

    it('should log "Implementation of mappers might have changed" when DAR checksum differs', async () => {
      const dbRecord: DbRecord = {
        source_url: 'sites.org',
        source_repository: 'SITES',
        source_checksum: 'source-checksum',
        dar_id: 'dar-id',
        dar_checksum: 'old-dar-checksum',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
        site_references: [],
        habitat_references: [],
        dataset_type: null,
        keywords: [],
      };

      mockRecordDao.getRecordBySourceUrl.mockResolvedValue([dbRecord]);
      mockRuleDao.getRulesForRecord.mockResolvedValue([]);
      mockedCalculateChecksum.mockReturnValue('new-dar-checksum');

      // source checksum same
      await (context as any).synchronizeRecord(sourceUrl, 'source-checksum', dataset);

      expect(handleChangedSpy).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('info', expect.stringContaining('Implementation of mappers might have changed'));
      expect(mockedPutToDar).toHaveBeenCalledTimes(1);
      expect(mockedDbRecordUpsert).toHaveBeenCalledTimes(1);
    });
  });
  describe('processApiHits', () => {
    it('should call process one record task with correct url', async () => {
      const contextSpy = jest.spyOn(context, 'processOneRecordTask').mockResolvedValue(undefined);
      const hits = [
        {
          links: {
            self: 'https://zenodo.org/api/records/10630263',
          },
        },
        {
          links: {
            self: 'https://zenodo.org/api/records/99999999',
          },
        },
      ];
      await context.processApiHits(hits);
      expect(contextSpy).toHaveBeenCalledTimes(2);
      expect(contextSpy).toHaveBeenCalledWith('https://zenodo.org/api/records/10630263');
      expect(contextSpy).toHaveBeenCalledWith('https://zenodo.org/api/records/99999999');
    });
  });
  describe('syncApiRepositoryAll', () => {
    it('should fetch pages until a partial or empty page is found', async () => {
      context.repoConfig.pageSize = 2;
      context.repoConfig.dataKey = 'hits';
      context.repoConfig.apiUrl = 'http://b2share.eudat.eu/api/records?q=test';

      mockedFetchJson.mockResolvedValueOnce({ hits: ['hit1', 'hit2'] }).mockResolvedValueOnce({ hits: ['hit3'] });

      const processApiHitsSpy = jest.spyOn(context, 'processApiHits').mockResolvedValue(undefined);

      await context.syncApiRepositoryAll();

      expect(mockedFetchJson).toHaveBeenCalledTimes(2);
      expect(mockedFetchJson).toHaveBeenCalledWith('http://b2share.eudat.eu/api/records?q=test&size=2&page=1');
      expect(mockedFetchJson).toHaveBeenCalledWith('http://b2share.eudat.eu/api/records?q=test&size=2&page=2');

      expect(processApiHitsSpy).toHaveBeenCalledTimes(2);
      expect(processApiHitsSpy).toHaveBeenCalledWith(['hit1', 'hit2']);
      expect(processApiHitsSpy).toHaveBeenCalledWith(['hit3']);
    });

    it('should not start if first page is empty', async () => {
      context.repoConfig.pageSize = 2;
      context.repoConfig.dataKey = 'hits';
      mockedFetchJson.mockResolvedValueOnce({ hits: [] });
      const processApiHitsSpy = jest.spyOn(context, 'processApiHits');

      await context.syncApiRepositoryAll();

      expect(mockedFetchJson).toHaveBeenCalledTimes(1);
      expect(processApiHitsSpy).not.toHaveBeenCalled();
    });
  });
  describe('syncSitesRepository', () => {
    it('schedules processing for each URL', async () => {
      const urls = ['http://meta.fieldsites.se/records/1', 'http://meta.fieldsites.se/records/2'];
      const processSpy = jest.spyOn(context, 'processOneRecordTask').mockResolvedValue(undefined);
      const scheduleSpy = jest.spyOn(fieldSitesLimiter, 'schedule');

      await context.syncSitesRepository(urls);

      expect(scheduleSpy).toHaveBeenCalledTimes(2);
      expect(processSpy).toHaveBeenCalledTimes(2);
      expect(processSpy).toHaveBeenCalledWith('http://meta.fieldsites.se/records/1');
      expect(processSpy).toHaveBeenCalledWith('http://meta.fieldsites.se/records/2');
    });
  });
  describe('syncSitesRepositoryAll', () => {
    it('fetches XML sitemap, parses URLs, and syncSitesRepository', async () => {
      const mockDocument = {
        getElementsByTagName: () => [
          { textContent: 'http://meta.fieldsites.se/records/1' },
          { textContent: 'http://meta.fieldsites.se/records/2' },
        ],
      };
      mockedFetchXml.mockResolvedValue(mockDocument as any);

      const syncSitesRepoSpy = jest.spyOn(context, 'syncSitesRepository').mockResolvedValue(undefined);

      await context.syncSitesRepositoryAll('http://sitemap.xml');

      expect(mockedFetchXml).toHaveBeenCalledWith('http://sitemap.xml');

      expect(syncSitesRepoSpy).toHaveBeenCalledWith([
        'http://meta.fieldsites.se/records/1',
        'http://meta.fieldsites.se/records/2',
      ]);
    });

    it('should not call syncSitesRepository if fetching the sitemap fails', async () => {
      mockedFetchXml.mockResolvedValue(null);
      const syncSitesRepoSpy = jest.spyOn(context, 'syncSitesRepository');

      await context.syncSitesRepositoryAll('http://sitemap.xml');

      expect(mockedFetchXml).toHaveBeenCalledWith('http://sitemap.xml');
      expect(syncSitesRepoSpy).not.toHaveBeenCalled();
    });
  });

  describe('startRepositorySync transaction test', () => {
    it('startRepositorySync should COMMIT on success', async () => {
      const context = await HarvesterContext.create(mockPool, 'ZENODO', true);
      context.syncApiRepositoryAll = jest.fn().mockResolvedValue(undefined);
      context.recordDao.deleteUnseenRecords = jest.fn().mockResolvedValue([]);

      await startRepositorySync(context);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(dbValidationPhase).toHaveBeenCalledWith(context);
      expect(context.syncApiRepositoryAll).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('startRepositorySync should ROLLBACK on failure', async () => {
      const context = await HarvesterContext.create(mockPool, 'ZENODO', true);
      const testError = new Error('Sync Failed!');
      context.syncApiRepositoryAll = jest.fn().mockRejectedValue(testError);

      await expect(startRepositorySync(context)).rejects.toThrow(testError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
  describe('Transaction tests for startRepositorySync and startRecordSync', () => {
    it('startRecordSync should COMMIT on success', async () => {
      const context = await HarvesterContext.create(mockPool, 'SITES', true);
      context.processOneRecordTask = jest.fn().mockResolvedValue(undefined);

      await startRecordSync(context, 'http://test.com/site/1');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(context.processOneRecordTask).toHaveBeenCalledWith('http://test.com/site/1');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
    it('startRecordSync should ROLLBACK on failure', async () => {
      const context = await HarvesterContext.create(mockPool, 'SITES', true);
      const testError = new Error('Sync Failed!');
      context.processOneRecordTask = jest.fn().mockRejectedValue(testError);

      await expect(startRecordSync(context, 'http://test.com/site/1')).rejects.toThrow(testError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
