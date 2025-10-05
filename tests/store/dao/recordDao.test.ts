import { IMemoryDb } from 'pg-mem';
import { RecordDao, DbRecord } from '../../../src/store/dao/recordDao';
import { setupInMemoryDb } from '../../dbHelper';

describe('Tests for RecordDao', () => {
  let db: IMemoryDb;
  let recordDao: RecordDao;
  let backup: any;

  beforeEach(() => {
    db = setupInMemoryDb();
    backup = db.backup();

    const pool = new (db.adapters.createPg().Pool)();
    recordDao = new RecordDao(pool as any);
  });

  afterEach(() => {
    backup.restore(); // ensure clean state
  });

  // async updateDarIdStatus(source_url: string, record: Partial<DbRecord>): Promise<void> {
  //   async updateStatus(source_url: string, record: Partial<DbRecord>): Promise<void> {
  // async listRepositoryDarIds(repositoryType: RepositoryType): Promise<string[]> {
  // async listRecordsByRepository(repositoryType: RepositoryType): Promise<DbRecord[]> {
  //   async listRecords(options?: {
  //     async listRepositoriesWithCount(options?: {
  //       async updateDarId(source_url: string, record: Partial<DbRecord>): Promise<void> {
  //         async updateRecordWithPrimaryKey(source_url: string, record: Partial<DbRecord>): Promise<void> {
  // async updateRepositoryToInProgress(repositoryType: RepositoryType): Promise<void> {
  //   async getRecordByDarId(darId: string): Promise<DbRecord | null> {
  //     async deleteRecord(sourceId: string): Promise<void> {

  it('creates a record', async () => {
    const source_url = 'http://repostiory.com/uuid';
    const newRecord: Omit<DbRecord, 'last_harvested'> = {
      source_url: source_url,
      source_repository: 'GITHUB',
      source_checksum: 'source_checksum123',
      dar_id: 'uuid-uuid',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'Record for Testing',
    };

    await recordDao.createRecord(newRecord);
    const result = await recordDao.getRecordBySourceId(source_url);

    expect(result).toHaveLength(1);
    expect(result[0].source_repository).toBe('GITHUB');
    expect(result[0].source_checksum).toBe('source_checksum123');
    expect(result[0].dar_id).toBe('uuid-uuid');
    expect(result[0].dar_checksum).toBe('dar_checksum123');
    expect(result[0].status).toBe('success');
    expect(result[0].title).toBe('Record for Testing');
  });

  it('updates a record', async () => {
    const source_url = 'http://repostiory.com/uuid';
    const newRecord: Omit<DbRecord, 'last_harvested'> = {
      source_url: source_url,
      source_repository: 'GITHUB',
      source_checksum: 'source_checksum123',
      dar_id: 'uuid-uuid',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'Record for Testing',
    };

    await recordDao.createRecord(newRecord);
    const result = await recordDao.getRecordBySourceId(source_url);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Record for Testing');

    newRecord.dar_checksum = 'dar_checksum456';
    newRecord.source_checksum = 'source_checksum456';
    await recordDao.updateRecord(source_url, newRecord);
    const updated = await recordDao.getRecordBySourceId(source_url);
    expect(updated[0].dar_checksum).toBe('dar_checksum456');
    expect(updated[0].source_checksum).toBe('source_checksum456');
    expect(updated[0].status).toBe('success');
  });

  it('updates a record status', async () => {
    const source_url = 'http://repostiory.com/status-testing';
    const newRecord: Omit<DbRecord, 'last_harvested'> = {
      source_url: source_url,
      source_repository: 'GITHUB',
      source_checksum: 'source_checksum123',
      dar_id: 'uuid-uuid',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'Record for status testing',
    };

    await recordDao.createRecord(newRecord);
    const result = await recordDao.getRecordBySourceId(source_url);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Record for status testing');

    await recordDao.updateStatus(source_url, {
      status: 'in_progress',
    });
    const updated = await recordDao.getRecordBySourceId(source_url);
    expect(result).toHaveLength(1);
    expect(updated[0].status).toBe('in_progress');
    expect(updated[0].dar_id).toBe('uuid-uuid');

    await recordDao.updateDarIdStatus(source_url, {
      dar_id: 'new-darid',
      status: 'deprecated',
    });
    const updated2 = await recordDao.getRecordBySourceId(source_url);
    expect(result).toHaveLength(1);
    expect(updated2[0].status).toBe('deprecated');
    expect(updated2[0].dar_id).toBe('new-darid');
  });
});
