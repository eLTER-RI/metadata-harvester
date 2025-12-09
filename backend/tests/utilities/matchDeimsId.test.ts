import {
  fetchSites,
  findMatchingUuid,
  mapUuidsToSiteReferences,
  getB2ShareMatchedSites,
  getFieldSitesMatchedSites,
  getZenodoMatchedSites,
  getDataRegistryMatchedSites,
} from '../../src/utilities/matchDeimsId';
import { CONFIG } from '../../src/config/config';

jest.mock('../../src/utilities/fetchJsonFromRemote');

global.fetch = jest.fn();

const mockSites = [
  { id: { suffix: '7fdabe1f-208a-449a-bc29-1e6ab2a1795b' }, title: 'Fray Jorge Experimental Site - Chile' },
  { id: { suffix: '9516fa76-79cc-4620-bc27-e721cdaf0db3' }, title: 'Beijing Forest Ecological Station - China' },
  { id: { suffix: '4ef66fb9-7430-47c0-a078-4d297f77971d' }, title: 'Lake Hovsgol MLTER Site - Mongolia' },
];

describe('Test matchDeimsId file', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSites', () => {
    it('should successfully fetch Deims sites from the correct url', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sites: 'data' }),
      });

      const data = await fetchSites();
      expect(global.fetch).toHaveBeenCalledWith(CONFIG.DEIMS_API_URL);
      expect(data).toEqual({ sites: 'data' });
    });

    it('should throw an error if fetch response not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchSites()).rejects.toThrow('Failed to fetch sites: 404');
    });
  });

  describe('findMatchingUuid', () => {
    it('should find a single matching Deims id in a string', () => {
      const text = 'This record is associated with 7fdabe1f-208a-449a-bc29-1e6ab2a1795b.';
      const matches = findMatchingUuid(text, mockSites);
      expect(matches).toEqual(['7fdabe1f-208a-449a-bc29-1e6ab2a1795b']);
    });

    it('should find and return one unique Deims id', () => {
      const text =
        'Some description from the record that is located in the 9516fa76-79cc-4620-bc27-e721cdaf0db3 site or mentions it.';
      const matches = findMatchingUuid(text, mockSites);
      expect(matches).toEqual(['9516fa76-79cc-4620-bc27-e721cdaf0db3']);
    });

    it('should find and return multiple unique Deims ids', () => {
      const text = `When a string metches two Deims ids 7fdabe1f-208a-449a-bc29-1e6ab2a1795b and
         maybe even on two lines 9516fa76-79cc-4620-bc27-e721cdaf0db3 
         we should be able to detect it too.`;
      const matches = findMatchingUuid(text, mockSites);
      expect(matches).toEqual(['7fdabe1f-208a-449a-bc29-1e6ab2a1795b', '9516fa76-79cc-4620-bc27-e721cdaf0db3']);
    });

    it('should not fail but return null if no Deims ids', () => {
      const text = 'No relevant site identifiers here.';
      const matches = findMatchingUuid(text, mockSites);
      expect(matches).toBeNull();
    });
  });

  describe('mapUuidsToSiteReferences', () => {
    it('should map UUIDs related to a site to SiteReference objects', () => {
      const uuids = ['7fdabe1f-208a-449a-bc29-1e6ab2a1795b', '4ef66fb9-7430-47c0-a078-4d297f77971d'];
      const references = mapUuidsToSiteReferences(uuids, mockSites);
      expect(references).toHaveLength(2);
      expect(references).toEqual([
        {
          siteID: '7fdabe1f-208a-449a-bc29-1e6ab2a1795b',
          siteName: 'Fray Jorge Experimental Site - Chile',
        },
        {
          siteID: '4ef66fb9-7430-47c0-a078-4d297f77971d',
          siteName: 'Lake Hovsgol MLTER Site - Mongolia',
        },
      ]);
    });

    it('should not map UUIDs not related to any site to SiteReference objects', () => {
      const uuids = ['xxxxxxxx-208a-449a-bc29-1e6ab2a1795b', '4ef66fb9-xxxx-47c0-a078-4d297f77971d'];
      const references = mapUuidsToSiteReferences(uuids, mockSites);
      expect(references).toHaveLength(0);
    });

    it('should return an empty array for null or empty input', () => {
      expect(mapUuidsToSiteReferences(null, mockSites)).toEqual([]);
      expect(mapUuidsToSiteReferences([], mockSites)).toEqual([]);
    });
  });

  describe('getB2ShareMatchedSites', () => {
    it('should find Deims ids in metadata', async () => {
      const recordData = {
        metadata: {
          description: 'Site ID is 7fdabe1f-208a-449a-bc29-1e6ab2a1795b',
        },
      };
      const matches = await getB2ShareMatchedSites(recordData, mockSites);
      expect(matches).toHaveLength(1);
      expect(matches).toEqual([
        {
          siteID: '7fdabe1f-208a-449a-bc29-1e6ab2a1795b',
          siteName: 'Fray Jorge Experimental Site - Chile',
        },
      ]);
    });

    it('should find Deims ids in different metadata fields', async () => {
      const recordData = {
        metadata: {
          description: 'Site ID is 7fdabe1f-208a-449a-bc29-1e6ab2a1795b',
          temporalCoverage: 'The site is 4ef66fb9-7430-47c0-a078-4d297f77971d',
        },
      };
      const matches = await getB2ShareMatchedSites(recordData, mockSites);
      expect(matches).toHaveLength(2);
      expect(matches).toEqual([
        {
          siteID: '7fdabe1f-208a-449a-bc29-1e6ab2a1795b',
          siteName: 'Fray Jorge Experimental Site - Chile',
        },
        {
          siteID: '4ef66fb9-7430-47c0-a078-4d297f77971d',
          siteName: 'Lake Hovsgol MLTER Site - Mongolia',
        },
      ]);
    });

    it('should ignore Deims ids in different fields if already found in metadata', async () => {
      const recordData = {
        metadata: {
          description: 'Site ID is 7fdabe1f-208a-449a-bc29-1e6ab2a1795b',
        },
        temporalCoverage: 'The site is 4ef66fb9-7430-47c0-a078-4d297f77971d',
      };
      const matches = await getB2ShareMatchedSites(recordData, mockSites);
      expect(matches).toHaveLength(1);
      expect(matches).toEqual([
        {
          siteID: '7fdabe1f-208a-449a-bc29-1e6ab2a1795b',
          siteName: 'Fray Jorge Experimental Site - Chile',
        },
      ]);
    });

    it('should search the full record if no matches are found in metadata', async () => {
      const recordData = {
        metadata: {
          description: 'This dataset is storing data about how trees grow.',
          temporalCoverage: 'Data was stored at 4ef66fb9-7430-47c0-a078-4d297f77971d',
        },
      };
      const matches = await getB2ShareMatchedSites(recordData, mockSites);
      expect(matches).toHaveLength(1);
      expect(matches).toEqual([
        {
          siteID: '4ef66fb9-7430-47c0-a078-4d297f77971d',
          siteName: 'Lake Hovsgol MLTER Site - Mongolia',
        },
      ]);
    });
  });

  describe('getFieldSitesMatchedSites', () => {
    it('should match a site using the hardcoded ANS station ID', () => {
      const recordData = { specificInfo: { acquisition: { station: { id: 'ANS' } } } };
      const matches = getFieldSitesMatchedSites(recordData);
      expect(matches).toHaveLength(1);
      expect(matches).toEqual([
        {
          siteID: '64679f32-fb3e-4937-b1f7-dc25e327c7af',
          siteName: 'Abisko Scientific Research Station - Sweden',
        },
      ]);
    });

    it('should return an empty array for unknown station id', () => {
      const recordData = { specificInfo: { acquisition: { station: { id: 'not a station id' } } } };
      const matches = getFieldSitesMatchedSites(recordData);
      expect(matches).toEqual([]);
    });
  });

  describe('getZenodoMatchedSites', () => {
    it('should find a matched site from the description field', async () => {
      const recordData = { metadata: { description: 'This dataset is from 9516fa76-79cc-4620-bc27-e721cdaf0db3.' } };
      const matches = await getZenodoMatchedSites(recordData, mockSites);
      expect(matches).toHaveLength(1);
      expect(matches).toEqual([
        {
          siteID: '9516fa76-79cc-4620-bc27-e721cdaf0db3',
          siteName: 'Beijing Forest Ecological Station - China',
        },
      ]);
    });

    it('should find a matched site from related_identifiers', async () => {
      const recordData = {
        metadata: {
          description: 'No sites here.',
          related_identifiers: [{ identifier: 'deims.site.org/someurl/4ef66fb9-7430-47c0-a078-4d297f77971d/' }],
        },
      };
      const matches = await getZenodoMatchedSites(recordData, mockSites);
      expect(matches).toHaveLength(1);
      expect(matches).toEqual([
        {
          siteID: '4ef66fb9-7430-47c0-a078-4d297f77971d',
          siteName: 'Lake Hovsgol MLTER Site - Mongolia',
        },
      ]);
    });
  });

  describe('getDataRegistryMatchedSites', () => {
    it('should match a site using the hardcoded title map', async () => {
      const recordData = {
        resource: { title: 'IT_22_Mar Piccolo of Taranto_ENV_EXO2_Scaletta_2024-2025_V20250716.xlsx' },
      };
      const matches = await getDataRegistryMatchedSites(recordData);
      expect(matches).toHaveLength(1);
      expect(matches).toEqual([
        {
          siteID: 'ac3f674d-2922-47f6-b1d8-2c91daa81ce1',
          siteName: 'IT22 - Mar Piccolo of Taranto - Italy',
        },
      ]);
    });

    it('should return an empty array if title does not match', async () => {
      const recordData = { resource: { title: 'Data from an unknown place' } };
      const matches = await getDataRegistryMatchedSites(recordData);
      expect(matches).toEqual([]);
    });
  });
});
