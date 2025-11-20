import request from 'supertest';
import app, { server } from '../src/app';
import { HarvesterContext, startRecordSync, startRepositorySync } from '../src/services/jobs/harvest/harvester';
import { syncDeimsSites } from '../src/services/jobs/deimsSync/syncDeimsSites';
import { syncWithDar } from '../src/services/jobs/syncDbWithRemote/localDarSync';
import { log } from '../src/services/serviceLogging';
import { createRulesForRecord, deleteRuleForRecord, getRulesForRecord } from '../src/services/rulesService';

// dao
const mockListRecords = jest.fn();
const mockListReposWithCount = jest.fn();
const mockGetRecordByDarId = jest.fn();
jest.mock('../src/store/dao/recordDao', () => ({
  RecordDao: jest.fn().mockImplementation(() => ({
    listRecords: mockListRecords,
    listRepositoriesWithCount: mockListReposWithCount,
    getRecordByDarId: mockGetRecordByDarId,
  })),
}));
const mockListResolvedCount = jest.fn();
const mockCreateResolved = jest.fn();
const mockDeleteResolved = jest.fn();
jest.mock('../src/store/dao/resolvedRecordsDao', () => ({
  ResolvedRecordDao: jest.fn().mockImplementation(() => ({
    listResolvedUnresolvedCount: mockListResolvedCount,
    create: mockCreateResolved,
    delete: mockDeleteResolved,
  })),
}));
const mockGetRules = jest.fn();
const mockCreateRules = jest.fn();
const mockCreateOrUpdateRule = jest.fn();
const mockDeleteRule = jest.fn();
jest.mock('../src/store/dao/rulesDao', () => ({
  RuleDao: jest.fn().mockImplementation(() => ({
    getRulesForRecord: mockGetRules,
    createRules: mockCreateRules,
    createOrUpdateRule: mockCreateOrUpdateRule,
    deleteRule: mockDeleteRule,
  })),
}));
// jobs
jest.mock('../src/services/jobs/harvest/harvester');
jest.mock('../src/services/jobs/deimsSync/syncDeimsSites');
jest.mock('../src/services/jobs/syncDbWithRemote/localDarSync');
const mockStartRepoSync = startRepositorySync as jest.Mock;
const mockStartRecordSync = startRecordSync as jest.Mock;
const mockSyncDeims = syncDeimsSites as jest.Mock;
const mockSyncDar = syncWithDar as jest.Mock;
const mockHarvesterContextCreate = HarvesterContext.create as jest.Mock;

// services
jest.mock('../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));
const mockCreateRulesForRecord = createRulesForRecord as jest.Mock;
const mockDeleteRuleForRecord = deleteRuleForRecord as jest.Mock;
const mockGetRulesForRecord = getRulesForRecord as jest.Mock;
jest.mock('../src/services/rulesService', () => ({
  createRulesForRecord: jest.fn(),
  deleteRuleForRecord: jest.fn(),
  getRulesForRecord: jest.fn(),
}));

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
  })),
}));

describe('Harvester Service API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll((done) => {
    if (server && server.listening) {
      server.close(() => {
        done();
      });
    } else {
      done();
    }
  });

  describe('GET /api/records', () => {
    it('should return a paginated list of records', async () => {
      const mockData = { records: [{ id: 1, title: 'Test API' }], totalCount: 1 };
      mockListRecords.mockResolvedValue(mockData);

      const response = await request(app).get(
        '/api/records?page=1&size=10&resolved=true&repositories[]=ZENODO&title=test',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        records: mockData.records,
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
      });
      expect(mockListRecords).toHaveBeenCalledWith({
        resolved: true,
        repositories: ['ZENODO'],
        title: 'test',
        size: 10,
        offset: 0,
      });
    });

    it('should return 500 if the DAO fails', async () => {
      const dbError = new Error('DB Error');
      mockListRecords.mockRejectedValue(dbError);

      const response = await request(app).get('/api/records');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve records.');
      expect(log).toHaveBeenCalledWith('error', 'Failed to retrieve records: Error: DB Error');
    });
  });
  describe('GET /api/repositories', () => {
    it('should return a list of repositories with counts', async () => {
      const mockData = [{ repository: 'ZENODO', count: 10 }];
      mockListReposWithCount.mockResolvedValue(mockData);

      const response = await request(app).get('/api/repositories?resolved=false&title=search');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
      expect(mockListReposWithCount).toHaveBeenCalledWith({
        resolved: false,
        title: 'search',
      });
    });

    it('should return 500 if the DAO fails', async () => {
      const dbError = new Error('DB Error');
      mockListReposWithCount.mockRejectedValue(dbError);

      const response = await request(app).get('/api/repositories');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve repositories.');
      expect(log).toHaveBeenCalledWith('error', 'Failed to retrieve repositories: Error: DB Error');
    });
  });

  describe('GET /api/resolved', () => {
    it('should return resolved/unresolved counts', async () => {
      const mockData = [{ status: 'resolved', count: 5 }];
      mockListResolvedCount.mockResolvedValue(mockData);

      const response = await request(app).get('/api/resolved?repositories[]=ZENODO');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
      expect(mockListResolvedCount).toHaveBeenCalledWith(
        expect.objectContaining({
          repositories: ['ZENODO'],
        }),
      );
    });

    it('should return 500 if the DAO fails', async () => {
      const dbError = new Error('DB Error');
      mockListResolvedCount.mockRejectedValue(dbError);

      const response = await request(app).get('/api/resolved?repositories[]=ZENODO');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve resolved/unresolved counts.');
      expect(log).toHaveBeenCalledWith('error', 'Failed to retrieve resolved/unresolved counts: Error: DB Error');
    });
  });

  describe('PATCH /api/records/:darId/status', () => {
    it('should set status to "resolved"', async () => {
      mockCreateResolved.mockResolvedValue(undefined);
      const response = await request(app)
        .patch('/api/records/123/status')
        .send({ status: 'resolved', resolvedBy: 'user' });
      expect(response.status).toBe(200);
      expect(mockCreateResolved).toHaveBeenCalledWith('123', 'user');
      expect(mockDeleteResolved).not.toHaveBeenCalled();
    });

    it('should set status to "unresolved"', async () => {
      mockDeleteResolved.mockResolvedValue(undefined);
      const response = await request(app).patch('/api/records/123/status').send({ status: 'unresolved' });
      expect(response.status).toBe(200);
      expect(mockDeleteResolved).toHaveBeenCalledWith('123');
      expect(mockCreateResolved).not.toHaveBeenCalled();
    });

    it('should return 400 for missing status', async () => {
      const response = await request(app).patch('/api/records/123/status').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields.');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app).patch('/api/records/123/status').send({ status: 'aaaa' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status value');
    });
  });

  describe('GET /api/records/:darId/rules', () => {
    it('should return rules for a record', async () => {
      const mockData = [{ id: 'firstRule', field: 'metadata.name' }];
      mockGetRulesForRecord.mockResolvedValue({
        success: true,
        rules: mockData,
      });
      const response = await request(app).get('/api/records/123/rules');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
      expect(mockGetRulesForRecord).toHaveBeenCalledWith(expect.anything(), '123');
    });
  });

  describe('POST /api/records/:darId/rules', () => {
    it('should create rules and trigger a re-harvest', async () => {
      const mockRules = [
        {
          target_path: 'metadata.titles[0].titleText',
          before_value: 'Old Title',
          after_value: 'New Title',
        },
      ];
      mockCreateRulesForRecord.mockResolvedValue({
        success: true,
        processedCount: 1,
        processedPaths: ['metadata.titles[0].titleText'],
        message: '1 rules processed successfully.',
      });
      const response = await request(app).post('/api/records/123/rules').send(mockRules);
      expect(response.status).toBe(201);
      expect(mockCreateRulesForRecord).toHaveBeenCalledWith(expect.anything(), '123', mockRules);
      expect(response.body.message).toBe('1 rules processed successfully.');
    });

    it('should return 400 if rules are not an array', async () => {
      mockCreateRulesForRecord.mockResolvedValue({
        success: false,
        error: 'Invalid rules data. Expected non-empty array.',
        statusCode: 400,
      });
      const response = await request(app).post('/api/records/123/rules').send({ not: 'an array' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rules data. Expected non-empty array.');
    });

    it('should return 400 if rules array is empty', async () => {
      mockCreateRulesForRecord.mockResolvedValue({
        success: false,
        error: 'Invalid rules data. Expected non-empty array.',
        statusCode: 400,
      });
      const response = await request(app).post('/api/records/123/rules').send([]);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rules data. Expected non-empty array.');
    });

    it('should return 404 if record not found', async () => {
      const mockRules = [
        {
          target_path: 'metadata.titles[0].titleText',
          before_value: 'Old Title',
          after_value: 'New Title',
        },
      ];
      mockCreateRulesForRecord.mockResolvedValue({
        success: false,
        error: 'Record with dar id 123 not found',
        statusCode: 404,
      });
      const response = await request(app).post('/api/records/123/rules').send(mockRules);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record with dar id 123 not found');
    });

    it('should return 200 if no rules needed', async () => {
      const mockRules = [
        {
          target_path: 'metadata.titles[0].titleText',
          before_value: 'Old Title',
          after_value: 'Old Title',
        },
      ];
      mockCreateRulesForRecord.mockResolvedValue({
        success: true,
        processedCount: 0,
        processedPaths: [],
        message: 'No rules needed - all values are unchanged.',
      });
      const response = await request(app).post('/api/records/123/rules').send(mockRules);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('No rules needed - all values are unchanged.');
    });
  });

  describe('DELETE /api/records/:darId/rules/:ruleId', () => {
    it('should delete a rule', async () => {
      mockDeleteRuleForRecord.mockResolvedValue({
        success: true,
      });
      const response = await request(app).delete('/api/records/123/rules/abc');
      expect(response.status).toBe(204);
      expect(mockDeleteRuleForRecord).toHaveBeenCalledWith(expect.anything(), '123', 'abc');
    });
  });

  describe('jobs: POST /api/harvest', () => {
    it('should start a repository harvest', async () => {
      mockHarvesterContextCreate.mockResolvedValue({});
      mockStartRepoSync.mockResolvedValue(undefined);
      const response = await request(app).post('/api/harvest').send({ repository: 'ZENODO' });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Harvesting job completed.');
      expect(mockHarvesterContextCreate).toHaveBeenCalledWith(expect.any(Object), 'ZENODO', true);
      expect(mockStartRepoSync).toHaveBeenCalled();
    });

    it('should return 400 for a missing repository', async () => {
      const response = await request(app).post('/api/harvest').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required field: 'repository'.");
    });

    it('should return 400 for an invalid repository', async () => {
      const response = await request(app).post('/api/harvest').send({ repository: 'FAKE_REPO' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid repository: 'FAKE_REPO'.");
    });

    it('should return 400 for an invalid check flag', async () => {
      const response = await request(app)
        .post('/api/harvest')
        .send({ repository: 'ZENODO', checkHarvestChanges: 'invalid value' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid data type for 'checkHarvestChanges'. Expected a boolean.");
    });
  });

  describe('jobs: POST /api/harvest/single', () => {
    it('should start a single record harvest', async () => {
      mockHarvesterContextCreate.mockResolvedValue({});
      mockStartRecordSync.mockResolvedValue(undefined);
      const response = await request(app)
        .post('/api/harvest/single')
        .send({ sourceUrl: 'http://b2share.eudat.eu/a1b2c3-d4e5f6', repository: 'ZENODO' });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Harvesting job completed.');
      expect(mockHarvesterContextCreate).toHaveBeenCalledWith(expect.any(Object), 'ZENODO', true);
      expect(mockStartRecordSync).toHaveBeenCalledWith({}, 'http://b2share.eudat.eu/a1b2c3-d4e5f6');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/api/harvest/single').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required fields: 'sourceUrl' or 'repository'.");
    });

    it('should return 400 for an invalid check flag', async () => {
      const response = await request(app).post('/api/harvest/single').send({
        sourceUrl: 'http://b2share.eudat.eu/a1b2c3-d4e5f6',
        repository: 'ZENODO',
        checkHarvestChanges: 'invalid value',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid data type for 'checkHarvestChanges'. Expected a boolean.");
    });
  });

  describe('jobs: POST /api/sync/sites', () => {
    it('should start a DEIMS sync', async () => {
      mockSyncDeims.mockResolvedValue(undefined);
      const response = await request(app).post('/api/sync/sites');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('DEIMS sites synchronization started successfully.');
      expect(mockSyncDeims).toHaveBeenCalled();
    });

    it('should return 500 if sync fails', async () => {
      mockSyncDeims.mockRejectedValue(new Error('Sync Error'));
      const response = await request(app).post('/api/sync/sites');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to start DEIMS sites synchronization.');
    });
  });

  describe('jobs: POST /api/sync/records', () => {
    it('should start a DAR sync', async () => {
      mockSyncDar.mockResolvedValue(undefined);
      const response = await request(app).post('/api/sync/records').send({ repository: 'ZENODO', darCleanup: true });
      expect(response.status).toBe(200);
      expect(mockSyncDar).toHaveBeenCalledWith('ZENODO', expect.any(Object), true);
    });

    it('should map ZENODO_IT to ZENODO', async () => {
      mockSyncDar.mockResolvedValue(undefined);
      const response = await request(app).post('/api/sync/records').send({ repository: 'ZENODO_IT' });
      expect(response.status).toBe(200);
      expect(mockSyncDar).toHaveBeenCalledWith('ZENODO', expect.any(Object), false);
    });
  });
});
