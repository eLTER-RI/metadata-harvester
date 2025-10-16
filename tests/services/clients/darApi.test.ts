import {
  deleteDarRecordsByIds,
  findDarRecordBySourceURL,
  postToDar,
  putToDar,
} from '../../../src/services/clients/darApi';
import { RecordDao } from '../../../src/store/dao/recordDao';
import { CommonDataset } from '../../../src/store/commonStructure';
import { log } from '../../../src/services/serviceLogging';
import { darLimiter } from '../../../src/services/rateLimiterConcurrency';
import { CONFIG } from '../../../config';

jest.mock('../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));
jest.mock('../../../src/services/rateLimiterConcurrency', () => ({
  darLimiter: {
    schedule: jest.fn((task) => task()),
  },
}));

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;
const mockLog = log as jest.Mock;

describe('DAR API Tests', () => {
  let mockRecordDao: jest.Mocked<RecordDao>;
  const sourceUrl = 'http://example.com/record/123';
  const mockDataset: CommonDataset = {
    metadata: {
      assetType: 'Dataset',
      titles: [{ titleText: 'Test Dataset' }],
      externalSourceInformation: {},
    },
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockLog.mockClear();

    mockRecordDao = {
      updateStatus: jest.fn().mockResolvedValue(undefined),
    } as any;

    (darLimiter.schedule as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('postToDar', () => {
    it('should POST a new record and on success return dar id', async () => {
      const newDarId = 'new-dar-id-456';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: newDarId }),
      });
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      const result = await postToDar(mockRecordDao, sourceUrl, mockDataset);

      expect(result).toBe(newDarId);
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(mockDataset, null, 2),
      });
      // called only to set to failure
      expect(mockRecordDao.updateStatus).not.toHaveBeenCalled();
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('should return null and set record status to failed on empty apiResponse', async () => {
      mockFetch.mockResolvedValueOnce(null);
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      const result = await postToDar(mockRecordDao, sourceUrl, mockDataset);

      expect(result).toBeNull();
      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith('error', expect.stringContaining(`Posting ${sourceUrl} into dar failed`));
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('should return null and set record status to failed if response not ok', async () => {
      const errorResponse = 'Bad Request';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(errorResponse),
      });
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      const result = await postToDar(mockRecordDao, sourceUrl, mockDataset);

      expect(result).toBeNull();
      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith('error', expect.stringContaining(`failed with : 400: ${errorResponse}`));
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('putToDar', () => {
    const darId = 'dar-record-id';
    it('should PUT a new record and on success set record status to success and return null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      await putToDar(darId, mockRecordDao, sourceUrl, mockDataset);

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify(mockDataset, null, 2),
      });
      // called only to set to failure
      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'success' });
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('should set record status to failed on empty apiResponse', async () => {
      mockFetch.mockResolvedValueOnce(null);
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      await putToDar(darId, mockRecordDao, sourceUrl, mockDataset);

      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith(
        'error',
        expect.stringContaining(`PUT request ${sourceUrl} into dar failed`),
      );
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('should set record status to failed if response not ok', async () => {
      const errorResponse = 'Bad Request';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(errorResponse),
      });
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      await putToDar(darId, mockRecordDao, sourceUrl, mockDataset);

      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith('error', expect.stringContaining(`failed with : 400: ${errorResponse}`));
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('findDarRecordBySourceURL', () => {
    it('should return null for incorrect API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            // no 'hits'
            data: [],
          }),
      });
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      const result = await findDarRecordBySourceURL(sourceUrl);

      expect(result).toBeNull();
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('should return null when no records are found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            hits: {
              hits: [],
            },
          }),
      });
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      const result = await findDarRecordBySourceURL(sourceUrl);

      expect(result).toBeNull();
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('should return the DAR ID when a record is found', async () => {
      const foundDarId = 'dar-id-2000';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            hits: {
              hits: [{ id: foundDarId }],
            },
          }),
      });
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');

      const result = await findDarRecordBySourceURL(sourceUrl);

      expect(result).toBe(foundDarId);
      const expectedEncodedUrl = encodeURIComponent(sourceUrl);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(expectedEncodedUrl), expect.any(Object));
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteDarRecordsByIds', () => {
    it('should fetch with delete each id', async () => {
      const scheduleSpy = jest.spyOn(darLimiter, 'schedule');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const idsToDelete = ['id1', 'id2'];

      await deleteDarRecordsByIds(idsToDelete);

      expect(scheduleSpy).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(global.fetch).toHaveBeenCalledWith(`${CONFIG.API_URL}/id1`, {
        method: 'DELETE',
        headers: expect.any(Object),
      });
      expect(global.fetch).toHaveBeenCalledWith(`${CONFIG.API_URL}/id2`, {
        method: 'DELETE',
        headers: expect.any(Object),
      });
      scheduleSpy.mockRestore();
    });
  });
});
