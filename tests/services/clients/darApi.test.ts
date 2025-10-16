import { findDarRecordBySourceURL, postToDar, putToDar } from '../../../src/services/clients/darApi';
import { RecordDao } from '../../../src/store/dao/recordDao';
import { CommonDataset } from '../../../src/store/commonStructure';
import { log } from '../../../src/services/serviceLogging';

jest.mock('../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
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
  });

  describe('postToDar', () => {
    it('should POST a new record and on success return dar id', async () => {
      const newDarId = 'new-dar-id-456';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: newDarId }),
      });

      const result = await postToDar(mockRecordDao, sourceUrl, mockDataset);

      expect(result).toBe(newDarId);
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(mockDataset, null, 2),
      });
      // called only to set to failure
      expect(mockRecordDao.updateStatus).not.toHaveBeenCalled();
    });

    it('should return null and set record status to failed on empty apiResponse', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await postToDar(mockRecordDao, sourceUrl, mockDataset);

      expect(result).toBeNull();
      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith('error', expect.stringContaining(`Posting ${sourceUrl} into dar failed`));
    });

    it('should return null and set record status to failed if response not ok', async () => {
      const errorResponse = 'Bad Request';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(errorResponse),
      });

      const result = await postToDar(mockRecordDao, sourceUrl, mockDataset);

      expect(result).toBeNull();
      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith('error', expect.stringContaining(`failed with : 400: ${errorResponse}`));
    });
  });

  describe('putToDar', () => {
    const darId = 'dar-record-id';
    it('should PUT a new record and on success set record status to success and return null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await putToDar(darId, mockRecordDao, sourceUrl, mockDataset);

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify(mockDataset, null, 2),
      });
      // called only to set to failure
      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'success' });
    });

    it('should set record status to failed on empty apiResponse', async () => {
      mockFetch.mockResolvedValueOnce(null);

      await putToDar(darId, mockRecordDao, sourceUrl, mockDataset);

      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith(
        'error',
        expect.stringContaining(`PUT request ${sourceUrl} into dar failed`),
      );
    });

    it('should set record status to failed if response not ok', async () => {
      const errorResponse = 'Bad Request';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(errorResponse),
      });

      await putToDar(darId, mockRecordDao, sourceUrl, mockDataset);

      expect(mockRecordDao.updateStatus).toHaveBeenCalledWith(sourceUrl, { status: 'failed' });
      expect(mockLog).toHaveBeenCalledWith('error', expect.stringContaining(`failed with : 400: ${errorResponse}`));
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

      const result = await findDarRecordBySourceURL(sourceUrl);

      expect(result).toBeNull();
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

      const result = await findDarRecordBySourceURL(sourceUrl);

      expect(result).toBeNull();
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

      const result = await findDarRecordBySourceURL(sourceUrl);

      expect(result).toBe(foundDarId);
      const expectedEncodedUrl = encodeURIComponent(sourceUrl);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(expectedEncodedUrl), expect.any(Object));
    });
  });
});
