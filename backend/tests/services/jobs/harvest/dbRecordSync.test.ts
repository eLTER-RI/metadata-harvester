import { dbRecordUpsert } from '../../../../src/services/jobs/harvest/dbRecordSync';
import { DbRecord, RecordDao } from '../../../../src/store/dao/recordDao';
import { log } from '../../../../src/services/serviceLogging';
import { RepositoryType } from '../../../../src/store/commonStructure';

jest.mock('../../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));
jest.mock('../../../../src/store/dao/recordDao');

const mockLog = log as jest.Mock;

describe('dbRecordUpsert', () => {
  let mockRecordDao: jest.Mocked<RecordDao>;
  const dbRecord: DbRecord = {
    source_url: 'http://example.com/record/1',
    source_repository: 'ZENODO',
    source_checksum: 'source-checksum-abc',
    dar_id: 'dar-id-123',
    dar_checksum: 'dar-checksum-def',
    status: 'in_progress',
    last_harvested: new Date('2025-12-31'),
    title: 'Test Record Title',
    site_references: [],
    habitat_references: [],
    dataset_type: null,
    keywords: [],
  };

  beforeEach(() => {
    mockLog.mockClear();
    mockRecordDao = new (RecordDao as any)();
    mockRecordDao.updateDarIdStatus = jest.fn().mockResolvedValue(undefined);
    mockRecordDao.getRecordBySourceUrl = jest.fn().mockResolvedValue([]);
    mockRecordDao.createRecord = jest.fn().mockResolvedValue(undefined);
    mockRecordDao.updateRecord = jest.fn().mockResolvedValue(undefined);
    mockRecordDao.updateRecordWithPrimaryKey = jest.fn().mockResolvedValue(undefined);
  });

  it('should update status to "failed" and return early if darId is null', async () => {
    await dbRecordUpsert(
      null,
      mockRecordDao,
      dbRecord.source_url,
      dbRecord.source_repository as RepositoryType,
      dbRecord.source_checksum,
      dbRecord.dar_checksum,
      undefined,
    );

    expect(mockRecordDao.updateDarIdStatus).toHaveBeenCalledWith(dbRecord.source_url, { status: 'failed' });
    expect(mockRecordDao.updateRecordWithPrimaryKey).not.toHaveBeenCalled();
    expect(mockRecordDao.getRecordBySourceUrl).not.toHaveBeenCalled();
    expect(mockRecordDao.createRecord).not.toHaveBeenCalled();
    expect(mockRecordDao.updateRecord).not.toHaveBeenCalled();
  });

  it('should update an existing record by old URL', async () => {
    const oldUrl = 'http://example.com/record/old-version';

    await dbRecordUpsert(
      dbRecord.dar_id,
      mockRecordDao,
      dbRecord.source_url,
      dbRecord.source_repository as RepositoryType,
      dbRecord.source_checksum,
      dbRecord.dar_checksum,
      undefined,
      oldUrl,
    );

    expect(mockRecordDao.updateRecordWithPrimaryKey).toHaveBeenCalledWith(oldUrl, {
      source_url: dbRecord.source_url,
      source_repository: dbRecord.source_repository,
      source_checksum: dbRecord.source_checksum,
      dar_id: dbRecord.dar_id,
      dar_checksum: dbRecord.dar_checksum,
      status: 'success',
      title: dbRecord.title,
    });
    expect(mockLog).toHaveBeenCalledWith(
      'info',
      `Record ${dbRecord.source_url} has an old version of ${oldUrl} in DAR with ${dbRecord.dar_id}`,
    );
    // Should not perform checks for the new URL
    expect(mockRecordDao.getRecordBySourceUrl).not.toHaveBeenCalled();
    expect(mockRecordDao.createRecord).not.toHaveBeenCalled();
    expect(mockRecordDao.updateRecord).not.toHaveBeenCalled();
  });

  it('should create a new record if no matching record found in db', async () => {
    mockRecordDao.getRecordBySourceUrl.mockResolvedValue([]);

    await dbRecordUpsert(
      dbRecord.dar_id,
      mockRecordDao,
      dbRecord.source_url,
      dbRecord.source_repository as RepositoryType,
      dbRecord.source_checksum,
      dbRecord.dar_checksum,
      dbRecord.title,
    );

    expect(mockRecordDao.getRecordBySourceUrl).toHaveBeenCalledWith(dbRecord.source_url);
    expect(mockRecordDao.createRecord).toHaveBeenCalledWith({
      source_url: dbRecord.source_url,
      source_repository: dbRecord.source_repository,
      source_checksum: dbRecord.source_checksum,
      dar_id: dbRecord.dar_id,
      dar_checksum: dbRecord.dar_checksum,
      status: 'success',
      title: dbRecord.title,
    });
    expect(mockRecordDao.updateRecord).not.toHaveBeenCalled();
  });

  it('should update an existing record if matching record found in db', async () => {
    mockRecordDao.getRecordBySourceUrl.mockResolvedValue([{} as any]);

    await dbRecordUpsert(
      dbRecord.dar_id,
      mockRecordDao,
      dbRecord.source_url,
      dbRecord.source_repository as RepositoryType,
      dbRecord.source_checksum,
      dbRecord.dar_checksum,
      dbRecord.title,
    );

    expect(mockRecordDao.getRecordBySourceUrl).toHaveBeenCalledWith(dbRecord.source_url);
    expect(mockRecordDao.updateRecord).toHaveBeenCalledWith(dbRecord.source_url, {
      source_url: dbRecord.source_url,
      source_repository: dbRecord.source_repository,
      source_checksum: dbRecord.source_checksum,
      dar_id: dbRecord.dar_id,
      dar_checksum: dbRecord.dar_checksum,
      status: 'success',
      title: dbRecord.title,
    });
    expect(mockRecordDao.createRecord).not.toHaveBeenCalled();
  });

  it('should handle errors of database and update status to "failed"', async () => {
    const dbError = new Error('Database connection lost');
    mockRecordDao.getRecordBySourceUrl.mockRejectedValue(dbError);

    await dbRecordUpsert(
      dbRecord.dar_id,
      mockRecordDao,
      dbRecord.source_url,
      dbRecord.source_repository as RepositoryType,
      dbRecord.source_checksum,
      dbRecord.dar_checksum,
      dbRecord.title,
    );

    expect(mockLog).toHaveBeenCalledWith(
      'error',
      expect.stringContaining(`Failed to upsert record for ${dbRecord.source_url}. Reason: ${dbError.message}`),
    );
    expect(mockRecordDao.updateDarIdStatus).toHaveBeenCalledWith(dbRecord.source_url, { status: 'failed' });
  });
});
