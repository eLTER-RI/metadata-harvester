import { Pool } from 'pg';
import { HarvesterContext } from '../../../../src/services/jobs/harvest/harvester';
import { RecordDao } from '../../../../src/store/dao/recordDao';
import { ResolvedRecordDao } from '../../../../src/store/dao/resolvedRecordsDao';
import { fetchSites } from '../../../../src/utilities/matchDeimsId';
import { mapB2ShareToCommonDatasetMetadata } from '../../../../src/store/parsers/b2shareParser';
import { mapDataRegistryToCommonDatasetMetadata } from '../../../../src/store/parsers/dataregistryParser';
import { mapZenodoToCommonDatasetMetadata } from '../../../../src/store/parsers/zenodoParser';
import { mapFieldSitesToCommonDatasetMetadata } from '../../../../src/store/parsers/fieldSitesParser';

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
  let mockPool: jest.Mocked<Pool>;
  let mockRecordDao: jest.Mocked<RecordDao>;
  let mockResolvedRecordsDao: jest.Mocked<ResolvedRecordDao>;

  beforeEach(() => {
    // before each test, we use different mocks to make it independent
    jest.clearAllMocks();

    mockPool = new (Pool as any)();
    mockRecordDao = new (RecordDao as any)(mockPool);
    mockResolvedRecordsDao = new (ResolvedRecordDao as any)(mockPool);

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
});
