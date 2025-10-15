import { DbRecord, RecordDao } from '../../../../src/store/dao/recordDao';
import { log } from '../../../../src/services/serviceLogging';

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
  };

  beforeEach(() => {
    mockLog.mockClear();
    mockRecordDao = new (RecordDao as any)();
    mockRecordDao.updateDarIdStatus = jest.fn().mockResolvedValue(undefined);
    mockRecordDao.getRecordBySourceId = jest.fn().mockResolvedValue([]);
    mockRecordDao.createRecord = jest.fn().mockResolvedValue(undefined);
    mockRecordDao.updateRecord = jest.fn().mockResolvedValue(undefined);
    mockRecordDao.updateRecordWithPrimaryKey = jest.fn().mockResolvedValue(undefined);
  });
});
