import { Pool } from 'pg';
import { syncWithDar } from '../../../../src/services/jobs/syncDbWithRemote/localDarSync';
import { deleteDarRecordsByIds, fetchDarRecordsByRepository } from '../../../../src/services/clients/darApi';
import { log } from '../../../../src/services/serviceLogging';
import { RepositoryType } from '../../../../src/models/commonStructure';

jest.mock('../../../../src/services/clients/darApi', () => ({
  fetchDarRecordsByRepository: jest.fn(),
  deleteDarRecordsByIds: jest.fn(),
}));

jest.mock('../../../../src/store/dao/recordDao');
jest.mock('../../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));
jest.mock('../../../../src/store/dao/recordDao', () => {
  return {
    RecordDao: jest.fn().mockImplementation(() => {
      return {
        listRepositoryDarIds: mockListRepositoryDarIds,
      };
    }),
  };
});
const mockFetchDarRecords = fetchDarRecordsByRepository as jest.Mock;
const mockDeleteDarRecords = deleteDarRecordsByIds as jest.Mock;
const mockListRepositoryDarIds = jest.fn();

describe('syncWithDar', () => {
  let mockPool: Pool;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = {} as Pool;
  });

  it('should log an error and exit if fetching remote IDs fails', async () => {
    mockFetchDarRecords.mockRejectedValue(new Error('Network Error'));

    await syncWithDar('ZENODO' as RepositoryType, mockPool, true);

    expect(log).toHaveBeenCalledWith('info', 'Error fetching DAR IDs: Error: Network Error');

    expect(mockListRepositoryDarIds).not.toHaveBeenCalled();
    expect(mockDeleteDarRecords).not.toHaveBeenCalled();
  });

  it('should log empty arrays and not delete if local and remote records in sync', async () => {
    const identicalIds = ['id1', 'id2', 'id3'];
    mockFetchDarRecords.mockResolvedValue(identicalIds);
    mockListRepositoryDarIds.mockResolvedValue(identicalIds);

    await syncWithDar('ZENODO' as RepositoryType, mockPool, true);

    expect(log).toHaveBeenCalledWith('warn', 'Extra on remote: []');
    expect(log).toHaveBeenCalledWith('warn', 'Extra in local: []');

    expect(mockDeleteDarRecords).not.toHaveBeenCalled();
  });

  it('should log diffs in records but not delete them when darCleanup false', async () => {
    const remoteIds = ['id1', 'id2', 'extra-remote'];
    const localIds = ['id1', 'id2', 'extra-local'];
    mockFetchDarRecords.mockResolvedValue(remoteIds);
    mockListRepositoryDarIds.mockResolvedValue(localIds);

    await syncWithDar('ZENODO' as RepositoryType, mockPool, false);

    expect(mockFetchDarRecords).toHaveBeenCalledWith('ZENODO');
    expect(mockListRepositoryDarIds).toHaveBeenCalledWith('ZENODO');

    expect(log).toHaveBeenCalledWith('warn', 'Extra on remote: [\n  "extra-remote"\n]');
    expect(log).toHaveBeenCalledWith('warn', 'Extra in local: [\n  "extra-local"\n]');

    expect(mockDeleteDarRecords).not.toHaveBeenCalled();
  });

  it('should delete extra records from dar when darCleanup is true', async () => {
    const remoteIds = ['id1', 'id2', 'extra-remote'];
    const localIds = ['id1', 'id2', 'extra-local'];
    mockFetchDarRecords.mockResolvedValue(remoteIds);
    mockListRepositoryDarIds.mockResolvedValue(localIds);

    await syncWithDar('ZENODO' as RepositoryType, mockPool, true);

    expect(log).toHaveBeenCalledWith('warn', 'Extra on remote: [\n  "extra-remote"\n]');
    expect(log).toHaveBeenCalledWith('warn', 'Extra in local: [\n  "extra-local"\n]');
    expect(log).toHaveBeenCalledWith('warn', 'Deleting all extra resources from Dar.');
    expect(mockDeleteDarRecords).toHaveBeenCalledTimes(1);
    expect(mockDeleteDarRecords).toHaveBeenCalledWith(['extra-remote']);
  });
});
