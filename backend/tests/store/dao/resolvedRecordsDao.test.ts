import { IMemoryDb } from 'pg-mem';
import { setupInMemoryDb } from '../../dbHelper';
import { DbRecord, RecordDao } from '../../../src/store/dao/recordDao';
import { ResolvedRecordDao } from '../../../src/store/dao/resolvedRecordsDao';

describe('Tests for RulesDao', () => {
  let db: IMemoryDb;
  let recordDao: RecordDao;
  let resolvedDao: ResolvedRecordDao;
  let backup: any;

  beforeEach(() => {
    db = setupInMemoryDb();
    backup = db.backup();

    const pool = new (db.adapters.createPg().Pool)();
    recordDao = new RecordDao(pool as any);
    resolvedDao = new ResolvedRecordDao(pool as any);
  });

  afterEach(() => {
    backup.restore(); // ensure clean state
  });

  it('creates records ', async () => {
    const record1: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://zenodo.com/resolved-testing1',
      source_repository: 'ZENODO',
      source_checksum: 'source_checksum_zenodo123',
      dar_id: 'zenodo1-zenodo1',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'First Record for Repositories Testing',
      site_references: [],
      habitat_references: [],
      dataset_type: null,
      keywords: [],
    };
    await recordDao.createRecord(record1);
    const record2: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://zenodo.com/resolved-testing2',
      source_repository: 'ZENODO',
      source_checksum: 'source_checksum_zenodo456',
      dar_id: 'zenodo2-zenodo2',
      dar_checksum: 'dar_checksum456',
      status: 'success',
      title: 'Second Record for Repositories Testing',
      site_references: [],
      habitat_references: [],
      dataset_type: null,
      keywords: [],
    };
    await recordDao.createRecord(record2);
    const record3: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://b2share.com/resolved-testing1',
      source_repository: 'B2SHARE_JUELICH',
      source_checksum: 'source_checksum_b2share123',
      dar_id: 'b2share1-b2share1',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'First B2SHARE Record for Repositories Testing',
      site_references: [],
      habitat_references: [],
      dataset_type: null,
      keywords: [],
    };
    await recordDao.createRecord(record3);
    const record4: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://b2share.com/resolved-testing2',
      source_repository: 'B2SHARE_JUELICH',
      source_checksum: 'source_checksum_b2share456',
      dar_id: 'b2share2-b2share2',
      dar_checksum: 'dar_checksum456',
      status: 'success',
      title: 'Second B2SHARE Record for Repositories Testing',
      site_references: [],
      habitat_references: [],
      dataset_type: null,
      keywords: [],
    };
    await recordDao.createRecord(record4);
    const record5: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://sites.com/resolved-testing1',
      source_repository: 'SITES',
      source_checksum: 'source_checksum_b2share123',
      dar_id: 'sites1-sites1',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'First SITES Record for Repositories Testing',
      site_references: [],
      habitat_references: [],
      dataset_type: null,
      keywords: [],
    };
    await recordDao.createRecord(record5);
    const record6: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://sites.com/resolved-testing2',
      source_repository: 'SITES',
      source_checksum: 'source_checksum_b2share456',
      dar_id: 'sites2-sites2',
      dar_checksum: 'dar_checksum456',
      status: 'success',
      title: 'Second SITES Record for Repositories Testing',
      site_references: [],
      habitat_references: [],
      dataset_type: null,
      keywords: [],
    };
    await recordDao.createRecord(record6);

    const resolvedCount = await resolvedDao.listResolvedUnresolvedCount();
    expect(resolvedCount[0].resolved).toBe(false);
    expect(resolvedCount[0].count).toBe(6);
    expect(resolvedCount[1].resolved).toBe(true);
    expect(resolvedCount[1].count).toBe(0);

    await resolvedDao.create('sites1-sites1', 'Anna');
    const resolvedCount2 = await resolvedDao.listResolvedUnresolvedCount();
    expect(resolvedCount2).toHaveLength(2);
    expect(resolvedCount2[0].resolved).toBe(false);
    expect(resolvedCount2[0].count).toBe(5);
    expect(resolvedCount2[1].resolved).toBe(true);
    expect(resolvedCount2[1].count).toBe(1);

    await resolvedDao.create('sites2-sites2', 'Julia');
    const resolvedCount3 = await resolvedDao.listResolvedUnresolvedCount({
      resolved: false,
    });
    expect(resolvedCount3).toHaveLength(2);
    expect(resolvedCount3[0].resolved).toBe(false);
    expect(resolvedCount3[0].count).toBe(4);
    expect(resolvedCount3[1].resolved).toBe(true);
    expect(resolvedCount3[1].count).toBe(0);

    await resolvedDao.create('b2share1-b2share1', 'Ian');
    await resolvedDao.create('b2share2-b2share2', 'Peter');
    const resolvedCount4 = await resolvedDao.listResolvedUnresolvedCount();
    expect(resolvedCount4).toHaveLength(2);
    expect(resolvedCount4[0].resolved).toBe(false);
    expect(resolvedCount4[0].count).toBe(2);
    expect(resolvedCount4[1].resolved).toBe(true);
    expect(resolvedCount4[1].count).toBe(4);

    const resolvedB2shareCount = await resolvedDao.listResolvedUnresolvedCount({
      repositories: ['B2SHARE_JUELICH'],
    });
    expect(resolvedB2shareCount).toHaveLength(2);
    expect(resolvedB2shareCount[0].resolved).toBe(false);
    expect(resolvedB2shareCount[0].count).toBe(0);
    expect(resolvedB2shareCount[1].resolved).toBe(true);
    expect(resolvedB2shareCount[1].count).toBe(2);

    const resolvedTitle = await resolvedDao.listResolvedUnresolvedCount({
      title: 'Second',
    });
    expect(resolvedTitle).toHaveLength(2);
    expect(resolvedTitle[0].resolved).toBe(false);
    expect(resolvedTitle[0].count).toBe(1);
    expect(resolvedTitle[1].resolved).toBe(true);
    expect(resolvedTitle[1].count).toBe(2);

    resolvedDao.delete('sites1-sites1');
    const resolvedAfterDelete = await resolvedDao.listResolvedUnresolvedCount();
    expect(resolvedAfterDelete).toHaveLength(2);
    expect(resolvedAfterDelete[0].resolved).toBe(false);
    expect(resolvedAfterDelete[0].count).toBe(3);
    expect(resolvedAfterDelete[1].resolved).toBe(true);
    expect(resolvedAfterDelete[1].count).toBe(3);

    resolvedDao.delete('b2share2-b2share2');
    const resolvedAfterDelete2 = await resolvedDao.listResolvedUnresolvedCount();
    expect(resolvedAfterDelete2).toHaveLength(2);
    expect(resolvedAfterDelete2[0].resolved).toBe(false);
    expect(resolvedAfterDelete2[0].count).toBe(4);
    expect(resolvedAfterDelete2[1].resolved).toBe(true);
    expect(resolvedAfterDelete2[1].count).toBe(2);
  });
});
