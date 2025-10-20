import request from 'supertest';
import app, { server } from '../../src/services/harvesterService';
import { HarvesterContext, startRecordSync } from '../../src/services/jobs/harvest/harvester';
import { log } from '../../src/services/serviceLogging';

// dao
const mockListRecords = jest.fn();
const mockListReposWithCount = jest.fn();
const mockGetRecordByDarId = jest.fn();
jest.mock('../../src/store/dao/recordDao', () => ({
  RecordDao: jest.fn().mockImplementation(() => ({
    listRecords: mockListRecords,
    listRepositoriesWithCount: mockListReposWithCount,
    getRecordByDarId: mockGetRecordByDarId,
  })),
}));
const mockListResolvedCount = jest.fn();
const mockCreateResolved = jest.fn();
const mockDeleteResolved = jest.fn();
jest.mock('../../src/store/dao/resolvedRecordsDao', () => ({
  ResolvedRecordDao: jest.fn().mockImplementation(() => ({
    listResolvedUnresolvedCount: mockListResolvedCount,
    create: mockCreateResolved,
    delete: mockDeleteResolved,
  })),
}));
const mockGetRules = jest.fn();
const mockCreateRules = jest.fn();
const mockDeleteRule = jest.fn();
jest.mock('../../src/store/dao/rulesDao', () => ({
  RuleDao: jest.fn().mockImplementation(() => ({
    getRulesForRecord: mockGetRules,
    createRules: mockCreateRules,
    deleteRule: mockDeleteRule,
  })),
}));

jest.mock('../../src/services/jobs/harvest/harvester');
const mockStartRecordSync = startRecordSync as jest.Mock;
const mockHarvesterContextCreate = HarvesterContext.create as jest.Mock;

// services
jest.mock('../../src/services/serviceLogging', () => ({
  log: jest.fn(),
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
    server.close(done);
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
      mockGetRules.mockResolvedValue(mockData);
      const response = await request(app).get('/api/records/123/rules');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
      expect(mockGetRules).toHaveBeenCalledWith('123');
    });
  });

  describe('POST /api/records/:darId/rules', () => {
    it('should create rules and trigger a re-harvest', async () => {
      const mockRules = [{ field: 'title', type: 'REPLACE' }];
      mockGetRecordByDarId.mockResolvedValue({ source_url: 'http://example.com', source_repository: 'ZENODO' });
      mockCreateRules.mockResolvedValue(undefined);
      mockHarvesterContextCreate.mockResolvedValue({});
      mockStartRecordSync.mockResolvedValue(undefined);
      const response = await request(app).post('/api/records/123/rules').send(mockRules);
      expect(response.status).toBe(201);
      expect(mockGetRecordByDarId).toHaveBeenCalledWith('123');
      expect(mockCreateRules).toHaveBeenCalledWith('123', mockRules);
      expect(mockStartRecordSync).toHaveBeenCalledWith({}, 'http://example.com');
    });

    it('should return 400 if rules are not an array', async () => {
      const response = await request(app).post('/api/records/123/rules').send({ not: 'an array' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rules data. Expected an array.');
    });

    it('should return 404 if record not found', async () => {
      mockGetRecordByDarId.mockResolvedValue(null);
      const response = await request(app).post('/api/records/123/rules').send([]);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record with dar id 123. not found');
    });
  });

  describe('DELETE /api/records/:darId/rules/:ruleId', () => {
    it('should delete a rule', async () => {
      mockDeleteRule.mockResolvedValue(undefined);
      const response = await request(app).delete('/api/records/123/rules/abc');
      expect(response.status).toBe(204);
      expect(mockDeleteRule).toHaveBeenCalledWith('abc');
    });
  });
});
