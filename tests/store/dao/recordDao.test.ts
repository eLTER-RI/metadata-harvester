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
});
