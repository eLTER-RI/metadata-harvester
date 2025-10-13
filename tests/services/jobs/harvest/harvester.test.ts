import { Pool } from 'pg';
import { HarvesterContext } from '../../../../src/services/jobs/harvest/harvester';
import { RecordDao } from '../../../../src/store/dao/recordDao';
import { ResolvedRecordDao } from '../../../../src/store/dao/resolvedRecordsDao';
import { fetchSites } from '../../../../src/utilities/matchDeimsId';
import { mapB2ShareToCommonDatasetMetadata } from '../../../../src/store/parsers/b2shareParser';
import { mapDataRegistryToCommonDatasetMetadata } from '../../../../src/store/parsers/dataregistryParser';
import { mapZenodoToCommonDatasetMetadata } from '../../../../src/store/parsers/zenodoParser';
import { mapFieldSitesToCommonDatasetMetadata } from '../../../../src/store/parsers/fieldSitesParser';
import { RuleDao, RuleDbRecord } from '../../../../src/store/dao/rulesDao';
import * as rulesUtilities from '../../../../src/utilities/rules';
import { CommonDataset } from '../../../../src/store/commonStructure';
import { CONFIG } from '../../../../config';

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

// And finally, the darApi
jest.mock('../../../../api/darApi');

describe('Test harvester file', () => {
  let context: HarvesterContext;
  let mockPool: jest.Mocked<Pool>;
  let mockRecordDao: jest.Mocked<RecordDao>;
  let mockResolvedRecordsDao: jest.Mocked<ResolvedRecordDao>;
  let mockRuleDao: jest.Mocked<RuleDao>;

  beforeEach(() => {
    // before each test, we use different mocks to make it independent
    jest.clearAllMocks();

    mockPool = new (Pool as any)();
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

  describe('synchronizeRecord', () => {});
  describe('processOneRecordTask', () => {});
  describe('mapToCommonStructure', () => {});
  describe('applyRulesToRecord', () => {
    const mockRecord: CommonDataset = {
      metadata: {
        titles: [{ titleText: 'A Mock Title' }],
        assetType: 'Dataset',
        externalSourceInformation: {
          externalSourceURI: 'http://example.com/record/1',
          externalSourceName: 'ZENODO',
        },
      },
    };
    const darId = 'dar-123';

    // it('should correctly apply working rules to a record', async () => {
    //   const workingRule: RuleDbRecord = {
    //     id: darId,
    //     dar_id: 'some-dar-id',
    //     rule_type: 'REPLACE',
    //     target_path: 'first_name',
    //     orig_value: 'Thomas',
    //     new_value: 'Tomas',
    //   };
    //   mockRuleDao.getRulesForRecord.mockResolvedValue([workingRule]);
    //   mockedApplyRuleToRecord.mockReturnValue(true);
    //   await context.applyRulesToRecord(mockRecord, darId);

    //   expect(mockedApplyRuleToRecord).toHaveBeenCalledWith(mockRecord, workingRule);
    //   expect(mockRuleDao.deleteRuleForRecord).not.toHaveBeenCalled();
    // });

    it('should delete a rule if does not work', async () => {});

    it('should handle a combination of working and not working rules', async () => {});
  });
  describe('handleChangedRecord', () => {});
  describe('processApiHits', () => {
    it('should call process one record task with correct url', async () => {
      // fix
      const hits = [
        `
          links: {
            "self": "https://zenodo.org/api/records/10630263",
            "doi": "some url"
          },
          "title": "Elter record title",
      `,
      ];
      const rulesUtilitiesSpy = jest
        .spyOn(rulesUtilities, 'getNestedValue')
        .mockResolvedValueOnce('https://zenodo.org/api/records/10630263');
      const contextSpy = jest.spyOn(context, 'processOneRecordTask').mockResolvedValue(undefined);

      await context.processApiHits(hits);

      expect(rulesUtilitiesSpy).toHaveBeenCalledTimes(1);
      expect(rulesUtilitiesSpy).toHaveBeenCalledWith(
        `
          links: {
            "self": "https://zenodo.org/api/records/10630263",
            "doi": "some url"
          },
          "title": "Elter record title",
      `,
        context.repoConfig.selfLinkKey,
      );
      expect(contextSpy).toHaveBeenCalledTimes(1);
      expect(contextSpy).toHaveBeenCalledWith('https://zenodo.org/api/records/10630263');
    });
  });
  describe('syncApiRepositoryAll', () => {});
  describe('syncSitesRepository', () => {});
  describe('syncSitesRepositoryAll', () => {});
  describe('processOneSitesRecord', () => {});
  describe('startRepositorySync', () => {});
  describe('startRecordSync', () => {
    // todo: resolve clients
  });
});
