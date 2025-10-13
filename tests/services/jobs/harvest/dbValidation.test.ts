import { dbValidationPhase } from '../../../../src/services/jobs/harvest/dbValidation';
import { HarvesterContext } from '../../../../src/services/jobs/harvest/harvester';
import { RecordDao } from '../../../../src/store/dao/recordDao';
import { DbRecord } from '../../../../src/store/dao/recordDao';

jest.mock('../../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));

jest.mock('../../../../src/services/rateLimiterConcurrency', () => ({
  fieldSitesLimiter: { schedule: jest.fn((task) => task()) },
  zenodoLimiter: { schedule: jest.fn((task) => task()) },
}));

describe('dbValidationPhase', () => {
  let baseMockContext: Partial<HarvesterContext>;
  let mockRecordDao: jest.Mocked<RecordDao>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRecordDao = {
      listRecordsByRepository: jest.fn(),
    } as any;

    baseMockContext = {
      recordDao: mockRecordDao,
      processOneRecordTask: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should call processOneRecordTask for each ZENODO record', async () => {
    const dbRecords: DbRecord[] = [
      {
        source_url: 'http://zenodo.org/record/1',
        source_repository: 'ZENODO',
        source_checksum: 'aaabb',
        dar_id: 'aaa',
        dar_checksum: 'matching-checksum',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
      },
      {
        source_url: 'http://zenodo.ord/record/2',
        source_repository: 'ZENODO',
        source_checksum: 'bbccdcd',
        dar_id: 'aaa',
        dar_checksum: 'afww-fdfd',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
      },
    ];
    mockRecordDao.listRecordsByRepository.mockResolvedValue(dbRecords);

    const zenodoContext = {
      ...baseMockContext,
      repositoryType: 'ZENODO',
    } as HarvesterContext;

    await dbValidationPhase(zenodoContext);

    expect(mockRecordDao.listRecordsByRepository).toHaveBeenCalledWith('ZENODO');
    expect(zenodoContext.processOneRecordTask).toHaveBeenCalledTimes(2);
    expect(zenodoContext.processOneRecordTask).toHaveBeenCalledWith('http://zenodo.org/record/1');
    expect(zenodoContext.processOneRecordTask).toHaveBeenCalledWith('http://zenodo.ord/record/2');
  });

  it('should call processOneSitesRecord for each SITES record', async () => {
    const dbRecords: DbRecord[] = [
      {
        source_url: 'http://sites.se/record/1',
        source_repository: 'SITES',
        source_checksum: 'aaabb',
        dar_id: 'aaa',
        dar_checksum: 'matching-checksum',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
      },
      {
        source_url: 'http://sites.se/record/2',
        source_repository: 'SITES',
        source_checksum: 'bbccdcd',
        dar_id: 'aaa',
        dar_checksum: 'afww-fdfd',
        status: 'in_progress',
        last_harvested: new Date('2025-12-31'),
        title: 'A title of a record',
      },
    ];
    mockRecordDao.listRecordsByRepository.mockResolvedValue(dbRecords);

    const sitesContext = {
      ...baseMockContext,
      repositoryType: 'SITES',
    } as HarvesterContext;

    await dbValidationPhase(sitesContext);

    expect(mockRecordDao.listRecordsByRepository).toHaveBeenCalledWith('SITES');
    expect(sitesContext.processOneRecordTask).toHaveBeenCalledTimes(2);
    expect(sitesContext.processOneRecordTask).toHaveBeenCalledWith('http://sites.se/record/1');
    expect(sitesContext.processOneRecordTask).toHaveBeenCalledWith('http://sites.se/record/2');
  });

  it('early return for B2SHARE dbValidation phase', async () => {
    const b2shareContext = {
      ...baseMockContext,
      repositoryType: 'B2SHARE_EUDAT',
    } as HarvesterContext;

    await dbValidationPhase(b2shareContext);

    expect(mockRecordDao.listRecordsByRepository).not.toHaveBeenCalled();
    expect(b2shareContext.processOneRecordTask).not.toHaveBeenCalled();
  });
});
