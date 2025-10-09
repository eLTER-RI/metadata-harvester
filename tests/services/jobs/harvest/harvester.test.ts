import { Pool } from 'pg';
import { RecordDao } from '../../../../src/store/dao/recordDao';
import { ResolvedRecordDao } from '../../../../src/store/dao/resolvedRecordsDao';
import { fetchSites } from '../../../../src/utilities/matchDeimsId';

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
});
