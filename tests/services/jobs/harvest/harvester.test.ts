import { Pool, PoolClient } from 'pg';
import {
  HarvesterContext,
  startRecordSync,
  startRepositorySync,
} from '../../../../src/services/jobs/harvest/harvester';
import { RecordDao } from '../../../../src/store/dao/recordDao';
import { ResolvedRecordDao } from '../../../../src/store/dao/resolvedRecordsDao';
import { fetchSites } from '../../../../src/utilities/matchDeimsId';
import { mapB2ShareToCommonDatasetMetadata } from '../../../../src/store/parsers/b2shareParser';
import { mapDataRegistryToCommonDatasetMetadata } from '../../../../src/store/parsers/dataregistryParser';
import { mapZenodoToCommonDatasetMetadata } from '../../../../src/store/parsers/zenodoParser';
import { mapFieldSitesToCommonDatasetMetadata } from '../../../../src/store/parsers/fieldSitesParser';
import { RuleDao } from '../../../../src/store/dao/rulesDao';
import * as rulesUtilities from '../../../../src/utilities/rules';
import { CONFIG } from '../../../../config';
import { dbValidationPhase } from '../../../../src/services/jobs/harvest/dbValidation';

// To isolate all other layers, we need to isolate the following:
// those should be tested separately
jest.mock('pg');
// DAO
jest.mock('../../../../src/store/dao/recordDao');
jest.mock('../../../../src/store/dao/rulesDao');
jest.mock('../../../../src/store/dao/resolvedRecordsDao');

// utilities
jest.mock('../../../../src/utilities/fetchJsonFromRemote');
jest.mock('../../../../src/utilities/checksum');
jest.mock('../../../../src/utilities/matchDeimsId');
const mockedFetchSites = fetchSites as jest.Mock;

// parsers
jest.mock('../../../../src/store/parsers/b2shareParser');
jest.mock('../../../../src/store/parsers/dataregistryParser');
jest.mock('../../../../src/store/parsers/zenodoParser');
jest.mock('../../../../src/store/parsers/fieldSitesParser');
jest.mock('../../../../src/services/jobs/harvest/dbValidation');

// services
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
    mockRecordDao.getRecordBySourceId.mockResolvedValue([]);
    mockRecordDao.updateStatus.mockResolvedValue(undefined);
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

  describe('getUrlWithExternalSourceURIQuery', () => {});
  describe('findDarRecordBySourceURL', () => {});
  describe('synchronizeRecord', () => {});
  describe('processOneRecordTask', () => {});
  describe('mapToCommonStructure', () => {});
  describe('applyRulesToRecord', () => {
    it('should delete a rule if does not work', async () => {});

    it('should handle a combination of working and not working rules', async () => {});
  });
  describe('handleChangedRecord', () => {});
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
  describe('syncApiRepositoryAll', () => {});
  describe('syncSitesRepository', () => {});
  describe('syncSitesRepositoryAll', () => {});
  describe('processOneSitesRecord', () => {});
  describe('startRepositorySync transaction test', () => {
    it('startRepositorySync should COMMIT on success', async () => {
      const context = await HarvesterContext.create(mockPool, 'ZENODO', true);
      context.syncApiRepositoryAll = jest.fn().mockResolvedValue(undefined);

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
      context.processOneSitesRecord = jest.fn().mockResolvedValue(undefined);

      await startRecordSync(context, 'http://test.com/site/1');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(context.processOneSitesRecord).toHaveBeenCalledWith('http://test.com/site/1');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
    it('startRecordSync should ROLLBACK on failure', async () => {
      const context = await HarvesterContext.create(mockPool, 'SITES', true);
      const testError = new Error('Sync Failed!');
      context.processOneSitesRecord = jest.fn().mockRejectedValue(testError);

      await expect(startRecordSync(context, 'http://test.com/site/1')).rejects.toThrow(testError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
