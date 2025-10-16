import { Pool } from 'pg';
import { syncWithDar } from '../../../../src/services/jobs/syncDbWithRemote/localDarSync';
import { deleteDarRecordsByIds, fetchDarRecordsByRepository } from '../../../../src/services/clients/darApi';
import { RecordDao } from '../../../../src/store/dao/recordDao';
import { log } from '../../../../src/services/serviceLogging';
import { RepositoryType } from '../../../../src/store/commonStructure';

jest.mock('../../../../src/services/clients/darApi', () => ({
  fetchDarRecordsByRepository: jest.fn(),
  deleteDarRecordsByIds: jest.fn(),
}));

jest.mock('../../../../src/store/dao/recordDao');
jest.mock('../../../../src/services/serviceLogging');

const mockFetchDarRecords = fetchDarRecordsByRepository as jest.Mock;
const mockDeleteDarRecords = deleteDarRecordsByIds as jest.Mock;
const mockLog = log as jest.Mock;
const MockedRecordDao = RecordDao as jest.Mocked<typeof RecordDao>;

describe('syncWithDar', () => {
  let mockPool: Pool;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = {} as Pool;
  });

  it('should log an error and exit if fetching remote IDs fails', async () => {
    mockFetchDarRecords.mockRejectedValue(new Error('Network Error'));

    await syncWithDar('ZENODO' as RepositoryType, mockPool, true);

    expect(mockLog).toHaveBeenCalledWith('info', 'Error fetching DAR IDs: Error: Network Error');

    expect(MockedRecordDao.prototype.listRepositoryDarIds).not.toHaveBeenCalled();
    expect(mockDeleteDarRecords).not.toHaveBeenCalled();
  });
});
