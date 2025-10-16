import { postToDar, putToDar } from '../../../src/services/clients/darApi';
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
});
