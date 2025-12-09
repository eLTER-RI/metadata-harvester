import { IMemoryDb } from 'pg-mem';
import { ManualRecordDao } from '../../../src/store/dao/manualRecordDao';
import { setupInMemoryDb } from '../../dbHelper';

describe('Tests for ManualRecordDao', () => {
  let db: IMemoryDb;
  let manualRecordDao: ManualRecordDao;
  let backup: any;

  beforeEach(() => {
    db = setupInMemoryDb();
    backup = db.backup();

    const pool = new (db.adapters.createPg().Pool)();
    manualRecordDao = new ManualRecordDao(pool as any);
  });

  afterEach(() => {
    backup.restore(); // ensure clean state
  });

  it('creates and retrieves a manual record', async () => {
    const record = await manualRecordDao.createRecord({
      dar_id: 'dar-123',
      title: 'Test Manual Record',
      created_by: 'user1',
    });

    expect(record).not.toBeNull();
    expect(record?.dar_id).toBe('dar-123');
    expect(record?.title).toBe('Test Manual Record');
    expect(record?.created_by).toBe('user1');
    expect(record?.id).toBeDefined();
    expect(record?.created_at).toBeDefined();

    const getRecord = await manualRecordDao.getRecordByDarId('dar-123');
    expect(getRecord).not.toBeNull();
    expect(getRecord?.dar_id).toBe('dar-123');
    expect(getRecord?.title).toBe('Test Manual Record');
  });

  it('creates a manual record without optional fields and updates title', async () => {
    const record = await manualRecordDao.createRecord({
      dar_id: 'dar-789',
    });

    expect(record).not.toBeNull();
    expect(record?.dar_id).toBe('dar-789');
    expect(record?.title).toBeNull();
    expect(record?.created_by).toBeNull();

    const updated = await manualRecordDao.updateTitle('dar-789', 'New Title');

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('New Title');
    expect(updated?.dar_id).toBe('dar-789');
  });

  it('returns null when record not found', async () => {
    const record = await manualRecordDao.getRecordByDarId('non-existent');
    expect(record).toBeNull();
  });

  it('updates title to null', async () => {
    await manualRecordDao.createRecord({
      dar_id: 'dar-123',
      title: 'Old Title',
    });

    const updated = await manualRecordDao.updateTitle('dar-123', null);

    expect(updated).not.toBeNull();
    expect(updated?.title).toBeNull();
  });

  it('returns null when updating non-existent record', async () => {
    const updated = await manualRecordDao.updateTitle('non-existent', 'New Title');
    expect(updated).toBeNull();
  });

  it('lists records regular', async () => {
    await manualRecordDao.createRecord({ dar_id: 'dar-1', title: 'Record 1' });
    await manualRecordDao.createRecord({ dar_id: 'dar-2', title: 'Record 2' });
    await manualRecordDao.createRecord({ dar_id: 'dar-3', title: 'Record 3' });

    const result = await manualRecordDao.listRecords();

    expect(result.records).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.records[0].dar_id).toBe('dar-3');
  });

  it('lists records with pagination', async () => {
    await manualRecordDao.createRecord({ dar_id: 'dar-1', title: 'Record 1' });
    await manualRecordDao.createRecord({ dar_id: 'dar-2', title: 'Record 2' });
    await manualRecordDao.createRecord({ dar_id: 'dar-3', title: 'Record 3' });
    await manualRecordDao.createRecord({ dar_id: 'dar-4', title: 'Record 4' });
    await manualRecordDao.createRecord({ dar_id: 'dar-5', title: 'Record 5' });

    const result = await manualRecordDao.listRecords({ size: 2, offset: 0 });

    expect(result.records).toHaveLength(2);
    expect(result.totalCount).toBe(5);
  });

  it('lists records with offset', async () => {
    await manualRecordDao.createRecord({ dar_id: 'dar-1', title: 'Record 1' });
    await manualRecordDao.createRecord({ dar_id: 'dar-2', title: 'Record 2' });
    await manualRecordDao.createRecord({ dar_id: 'dar-3', title: 'Record 3' });

    const result = await manualRecordDao.listRecords({ size: 2, offset: 2 });

    expect(result.records).toHaveLength(1);
    expect(result.totalCount).toBe(3);
  });

  it('filters records by title', async () => {
    await manualRecordDao.createRecord({ dar_id: 'dar-1', title: 'Test Record One' });
    await manualRecordDao.createRecord({ dar_id: 'dar-2', title: 'Test Record Two' });
    await manualRecordDao.createRecord({ dar_id: 'dar-3', title: 'Other Record' });

    const result = await manualRecordDao.listRecords({ title: 'Test' });

    expect(result.records.length).toBe(2);
    expect(result.totalCount).toBe(2);
    result.records.forEach((record) => {
      expect(record.title?.toLowerCase()).toContain('test');
    });

    await manualRecordDao.createRecord({ dar_id: 'dar-4', title: 'TEST Record' });
    const resultCaseIns = await manualRecordDao.listRecords({ title: 'test' });
    expect(resultCaseIns.totalCount).toBe(3);
  });

  it('combines title filter with pagination', async () => {
    await manualRecordDao.createRecord({ dar_id: 'dar-1', title: 'Test Record 1' });
    await manualRecordDao.createRecord({ dar_id: 'dar-2', title: 'Test Record 2' });
    await manualRecordDao.createRecord({ dar_id: 'dar-3', title: 'Test Record 3' });
    await manualRecordDao.createRecord({ dar_id: 'dar-4', title: 'Other Record' });

    const result = await manualRecordDao.listRecords({ title: 'Test', size: 2, offset: 0 });

    expect(result.records.length).toBeLessThanOrEqual(2);
    expect(result.totalCount).toBe(3);
  });

  it('deletes a record', async () => {
    const record = await manualRecordDao.createRecord({
      dar_id: 'dar-123',
      title: 'To Be Deleted',
    });

    expect(record).not.toBeNull();
    const recordId = record!.id;

    await manualRecordDao.deleteRecord(recordId);

    const deleted = await manualRecordDao.getRecordByDarId('dar-123');
    expect(deleted).toBeNull();
  });

  it('handles deletion of non-existent record', async () => {
    await expect(manualRecordDao.deleteRecord(99999)).resolves.not.toThrow();
  });
});
