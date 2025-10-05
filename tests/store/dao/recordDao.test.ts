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

  it('creates and deletes a record', async () => {
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

    await recordDao.deleteRecord(source_url);
    const getAfterDelete = await recordDao.getRecordBySourceId(source_url);
    expect(getAfterDelete).toHaveLength(0);
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

  it('creates, lists and updates records by repositories', async () => {
    const record1: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://zenodo.com/repositories-testing1',
      source_repository: 'ZENODO',
      source_checksum: 'source_checksum_zenodo123',
      dar_id: 'zenodo1-zenodo1',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'First Record for Repositories Testing',
    };
    await recordDao.createRecord(record1);
    const record2: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://zenodo.com/repositories-testing2',
      source_repository: 'ZENODO',
      source_checksum: 'source_checksum_zenodo456',
      dar_id: 'zenodo2-zenodo2',
      dar_checksum: 'dar_checksum456',
      status: 'success',
      title: 'Second Record for Repositories Testing',
    };
    await recordDao.createRecord(record2);
    const record3: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://zenodo.com/repositories-testing3',
      source_repository: 'ZENODO',
      source_checksum: 'source_checksum_zenodo789',
      dar_id: 'zenodo3-zenodo3',
      dar_checksum: 'dar_checksum789',
      status: 'success',
      title: 'Third Record for Repositories Testing',
    };
    await recordDao.createRecord(record3);
    const record4: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://b2share.com/repositories-testing',
      source_repository: 'B2SHARE_JUELICH',
      source_checksum: 'source_checksum_b2share123',
      dar_id: 'b2share1-b2share1',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'First B2SHARE Record for Repositories Testing',
    };
    await recordDao.createRecord(record4);

    const zenodoRecords = await recordDao.listRecordsByRepository('ZENODO');
    expect(zenodoRecords).toHaveLength(3);
    expect(zenodoRecords[0].status).toBe('success');
    expect(zenodoRecords[1].status).toBe('success');
    expect(zenodoRecords[2].status).toBe('success');

    const b2shareRecords = await recordDao.listRecordsByRepository('B2SHARE_JUELICH');
    expect(b2shareRecords).toHaveLength(1);
    const sitesRecords = await recordDao.listRecordsByRepository('SITES');
    expect(sitesRecords).toHaveLength(0);

    const darIdsZenodo = await recordDao.listRepositoryDarIds('ZENODO');
    expect(darIdsZenodo).toHaveLength(3);
    expect(darIdsZenodo[0]).toBe('zenodo1-zenodo1');
    expect(darIdsZenodo[1]).toBe('zenodo2-zenodo2');
    expect(darIdsZenodo[2]).toBe('zenodo3-zenodo3');

    const reposCount = await recordDao.listRepositoriesWithCount();
    expect(reposCount[0].source_repository).toBe('ZENODO');
    expect(reposCount[0].count).toBe(3);
    expect(reposCount[1].source_repository).toBe('B2SHARE_JUELICH');
    expect(reposCount[1].count).toBe(1);

    await recordDao.updateRepositoryToInProgress('ZENODO');
    const zenodoRecords2 = await recordDao.listRecordsByRepository('ZENODO');
    expect(zenodoRecords2).toHaveLength(3);
    expect(zenodoRecords2[0].status).toBe('in_progress');
    expect(zenodoRecords2[1].status).toBe('in_progress');
    expect(zenodoRecords2[2].status).toBe('in_progress');

    const allRecords = await recordDao.listRecords();
    expect(allRecords.records).toHaveLength(4);
    expect(allRecords.totalCount).toBe(4);
    expect(allRecords.records[0].dar_id).toBe('b2share1-b2share1');
    expect(allRecords.records[1].dar_id).toBe('zenodo3-zenodo3');
    expect(allRecords.records[2].dar_id).toBe('zenodo2-zenodo2');
    expect(allRecords.records[3].dar_id).toBe('zenodo1-zenodo1');

    const queriesRecordsTitle = await recordDao.listRecords({
      title: 'First',
      resolved: false,
    });
    expect(queriesRecordsTitle.records).toHaveLength(2);

    const queriesRecords = await recordDao.listRecords({
      repositories: ['ZENODO'],
      title: 'Third',
    });
    expect(queriesRecords.records).toHaveLength(1);
  });

  it('creates, updates and deletes a record', async () => {
    const source_url = 'http://repostiory.com/crud';
    const newRecord: Omit<DbRecord, 'last_harvested'> = {
      source_url: source_url,
      source_repository: 'SITES',
      source_checksum: 'source_checksum123',
      dar_id: 'sites1-sites1',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'Record for CRUD testing',
    };

    await recordDao.createRecord(newRecord);
    const result1 = await recordDao.getRecordBySourceId(source_url);
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toBe('Record for CRUD testing');

    const result2 = await recordDao.getRecordByDarId('sites1-sites1');
    expect(result2?.title).toBe('Record for CRUD testing');
    const shouldBeEmpty1 = await recordDao.getRecordByDarId('sites2-sites2');
    expect(shouldBeEmpty1).toBeNull();

    await recordDao.updateDarId(source_url, {
      dar_id: 'sites2-sites2',
    });
    const result3 = await recordDao.getRecordByDarId('sites2-sites2');
    expect(result3?.title).toBe('Record for CRUD testing');
    const shouldBeEmpty2 = await recordDao.getRecordByDarId('sites1-sites1');
    expect(shouldBeEmpty2).toBeNull();

    await recordDao.updateRecordWithPrimaryKey(source_url, {
      source_url: source_url + '/new-url',
      source_repository: 'SITES',
      source_checksum: 'source_checksum456',
      dar_id: 'sites10-sites10',
      dar_checksum: 'dar_checksum456',
      status: 'success',
      title: 'Record for CRUD testing updated with primary key',
    });
    const oldUrlResult = await recordDao.getRecordBySourceId(source_url);
    expect(oldUrlResult).toHaveLength(0);
    const newUrlResult = await recordDao.getRecordBySourceId(source_url + '/new-url');
    expect(newUrlResult).toHaveLength(1);
  });
});
