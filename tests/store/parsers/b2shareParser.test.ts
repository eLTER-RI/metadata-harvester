import { mapB2ShareToCommonDatasetMetadata } from '../../../src/store/parsers/b2shareParser';
import { CommonDataset } from '../../../src/store/commonStructure';
import mockB2ShareData from './apiResponses/b2share.json';
import mockB2ShareOldData from './apiResponses/b2share_versions_old.json';
import mockB2ShareVersions from './apiResponses/b2share_versions.json';
import * as fetcher from '../../../src/utilities/fetchJsonFromRemote';

jest.mock('../../../src/utilities/fetchJsonFromRemote');

describe('B2Share Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly map a b2share latest record', async () => {
    const sourceUrl = 'http://example.com/b2share/1';

    // During parsing, we also fetch all records versions
    const fetchJsonSpy = jest.spyOn(fetcher, 'fetchJson').mockResolvedValue(mockB2ShareVersions);
    const commonDataset: CommonDataset = await mapB2ShareToCommonDatasetMetadata(
      sourceUrl,
      mockB2ShareData as any,
      [],
      'B2SHARE_EUDAT',
    );

    expect(commonDataset.metadata.publicationDate).toBe('2025-09-17');
    expect(commonDataset.metadata.files).toBeDefined();
    expect(commonDataset.metadata.files).toHaveLength(3);
    expect(commonDataset.metadata.files).toEqual([
      {
        name: 'DATA.txt',
        sourceUrl: 'https://hdl.handle.net/11304/47703020-e87f-41ab-ac06-5079cf52f1dd',
        format: 'txt',
        md5: 'eb588fd4c7d3b2469b3806750d450c64',
        size: '15873888',
        sizeMeasureType: 'B',
      },
      {
        name: 'METHOD.txt',
        sourceUrl: 'https://hdl.handle.net/11304/cbc653be-b827-42dd-b4b1-4f549991f6fb',
        format: 'txt',
        md5: '93d1ef9c4a5aad3aff7039566d55bae1',
        size: '1111',
        sizeMeasureType: 'B',
      },
      {
        name: 'STATION.txt',
        sourceUrl: 'https://hdl.handle.net/11304/cf7c8be0-be65-4986-9eba-7e1b985740e2',
        format: 'txt',
        md5: 'e467354d58b00d4cdaf4b0e7e2c476be',
        size: '233',
        sizeMeasureType: 'B',
      },
    ]);
    expect(commonDataset.metadata.alternateIdentifiers).toHaveLength(3);
    expect(commonDataset.metadata.alternateIdentifiers).toEqual([
      {
        alternateID: '353',
        alternateIDType: 'Other',
      },
      {
        alternateID: 'http://hdl.handle.net/11304/f3589a0b-aa74-4355-948b-5b735f39788e',
        alternateIDType: 'Other',
      },
      {
        alternateID: 'http://hdl.handle.net/11304/067cb4a5-5143-406d-84e8-018ecc39601a',
        alternateIDType: 'Handle',
      },
    ]);

    expect(commonDataset.pids?.doi.identifier).toBe('10.23728/b2share.8f0fdd0163f044a082f8c2571205aaaa');
    expect(commonDataset.metadata.creators).toBeDefined();
    expect(commonDataset.metadata.creators![0].creatorFamilyName).toBe('Nied');
    expect(commonDataset.metadata.creators![0].creatorGivenName).toBe('Sebastian');
    expect(commonDataset.metadata.descriptions).toBeDefined();
    expect(commonDataset.metadata.descriptions![0].descriptionText).toBe(
      'Zöbelboden (Austria) - meteorological data 1996',
    );
    expect(commonDataset.metadata.alternateIdentifiers).toContainEqual({
      alternateID: 'http://hdl.handle.net/11304/067cb4a5-5143-406d-84e8-018ecc39601a',
      alternateIDType: 'Handle',
    });
    expect(commonDataset.metadata.keywords).toBeDefined();
    expect(commonDataset.metadata.keywords).toEqual([
      {
        keywordLabel: 'Zöbelboden',
      },
      {
        keywordLabel: 'Zoebelboden',
      },
      {
        keywordLabel: 'LTER CWN',
      },
      {
        keywordLabel: 'eLTER reporting',
      },
      {
        keywordLabel: 'meteorology',
      },
    ]);
    expect(commonDataset.metadata.licenses).toBeDefined();
    expect(commonDataset.metadata.licenses).toEqual([
      {
        licenseCode: 'cc-by',
        licenseURI: 'https://creativecommons.org/licenses/by/4.0/',
      },
    ]);
    expect(commonDataset.metadata.assetType).toBe('Dataset');
    expect(commonDataset.metadata.titles).toBeDefined();
    expect(commonDataset.metadata.titles![0].titleText).toBe('LTER Zöbelboden (Austria) - meteorological data 1996');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceName).toBe('B2Share Eudat');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(
      'http://hdl.handle.net/11304/067cb4a5-5143-406d-84e8-018ecc39601a',
    );
    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(
      'http://hdl.handle.net/11304/067cb4a5-5143-406d-84e8-018ecc39601a',
    );
    expect(commonDataset.metadata.temporalCoverages).toBeDefined();
    expect(commonDataset.metadata.temporalCoverages).toHaveLength(1);
    expect(commonDataset.metadata.temporalCoverages).toEqual([
      {
        startDate: '2023-05-31',
        endDate: '2024-05-31',
      },
    ]);
    expect(commonDataset.metadata.geoLocations).toBeDefined();
    expect(commonDataset.metadata.geoLocations).toHaveLength(2);
    expect(commonDataset.metadata.geoLocations).toEqual([
      {
        geographicDescription: 'Sion (Switzerland)',
        point: {
          latitude: 46.22748,
          longitude: 7.36459,
        },
      },
      {
        geographicDescription: 'Sion (Switzerland)',
        boundingBox: {
          eastBoundLongitude: 7.94,
          northBoundLatitude: 46.43,
          southBoundLatitude: 46.04,
          westBoundLongitude: 6.87,
        },
      },
    ]);
    expect(commonDataset.metadata.temporalCoverages).toEqual([
      {
        startDate: '2023-05-31',
        endDate: '2024-05-31',
      },
    ]);

    // We check that the correct string was called to get versions
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockB2ShareData.links.versions);
  });

  it('should fetch the latest version when starting with an old record', async () => {
    const oldSourceUrl = 'http://example.com/b2share/old';

    const fetchJsonSpy = jest
      .spyOn(fetcher, 'fetchJson')
      .mockResolvedValueOnce(mockB2ShareVersions)
      .mockResolvedValueOnce(mockB2ShareData);

    const commonDataset: CommonDataset = await mapB2ShareToCommonDatasetMetadata(
      oldSourceUrl,
      mockB2ShareOldData as any,
      [],
      'B2SHARE_EUDAT',
    );

    expect(commonDataset.metadata.externalSourceInformation.externalSourceName).toBe('B2Share Eudat');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(
      'http://hdl.handle.net/11304/067cb4a5-5143-406d-84e8-018ecc39601a',
    );
    expect(commonDataset.metadata.relatedIdentifiers).toContainEqual({
      relatedID: mockB2ShareOldData.links.self,
      relatedIDType: 'URL',
      relatedResourceType: 'Dataset',
      relationType: 'IsNewVersionOf',
    });

    expect(fetchJsonSpy).toHaveBeenCalledTimes(2);
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockB2ShareOldData.links.versions);
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockB2ShareData.links.self);
  });
});
