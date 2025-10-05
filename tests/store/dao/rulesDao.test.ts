import { IMemoryDb } from 'pg-mem';
import { RuleDao, RuleDbRecord } from '../../../src/store/dao/rulesDao';
import { setupInMemoryDb } from '../../dbHelper';
import { DbRecord, RecordDao } from '../../../src/store/dao/recordDao';

describe('Tests for RulesDao', () => {
  let db: IMemoryDb;
  let recordDao: RecordDao;
  let ruleDao: RuleDao;
  let backup: any;

  beforeEach(() => {
    db = setupInMemoryDb();
    backup = db.backup();

    const pool = new (db.adapters.createPg().Pool)();
    recordDao = new RecordDao(pool as any);
    ruleDao = new RuleDao(pool as any);
  });

  afterEach(() => {
    backup.restore(); // ensure clean state
  });

  it('creates, list and deletes rules', async () => {
    const newRecord: Omit<DbRecord, 'last_harvested'> = {
      source_url: 'http://repostiory.com/uuid',
      source_repository: 'GITHUB',
      source_checksum: 'source_checksum123',
      dar_id: 'uuid-uuid',
      dar_checksum: 'dar_checksum123',
      status: 'success',
      title: 'Record for Testing',
    };
    await recordDao.createRecord(newRecord);

    const newRule1: Partial<RuleDbRecord> = {
      dar_id: 'uuid-uuid',
      rule_type: 'REPLACE',
      target_path: 'metadata.creators[0].creatorGivenName',
      orig_value: 'Ian',
      new_value: 'Jan',
    };
    const newRule2: Partial<RuleDbRecord> = {
      dar_id: 'uuid-uuid',
      rule_type: 'REPLACE',
      target_path: 'metadata.creators[0].creatorEmail',
      orig_value: 'iannovak@google.com',
      new_value: 'jannovak@google.com',
    };
    const newRule3: Partial<RuleDbRecord> = {
      dar_id: 'uuid-uuid',
      rule_type: 'REPLACE',
      target_path: 'metadata.keywords[0].keywordLabel',
      orig_value: 'aqua',
      new_value: 'water',
    };
    await ruleDao.createRules('uuid-uuid', [newRule1, newRule2, newRule3]);
    const rulesForRecord = await ruleDao.getRulesForRecord('uuid-uuid');
    expect(rulesForRecord).toHaveLength(3);

    await ruleDao.deleteRule(rulesForRecord[0].id);
    const rulesForRecord2 = await ruleDao.getRulesForRecord('uuid-uuid');
    expect(rulesForRecord2).toHaveLength(2);
    await ruleDao.deleteRuleForRecord(rulesForRecord[0].dar_id);
    const rulesForRecord3 = await ruleDao.getRulesForRecord('uuid-uuid');
    expect(rulesForRecord3).toHaveLength(0);
  });
});
