import { mapB2ShareToCommonDatasetMetadata } from '../../../src/store/mappers/b2shareMapper';
import { CommonDataset } from '../../../src/store/commonStructure';
import mockB2ShareData from './apiResponses/b2share.json';
import mockB2ShareOldData from './apiResponses/b2share_versions_old.json';
import mockB2ShareVersions from './apiResponses/b2share_versions.json';
import * as fetcher from '../../../src/utilities/fetchJsonFromRemote';

jest.mock('../../../src/utilities/fetchJsonFromRemote');

jest.mock('../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));

describe('B2Share Mapper', () => {
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
    expect(commonDataset.metadata.alternateIdentifiers).toBeDefined();
    expect(commonDataset.metadata.alternateIdentifiers).toHaveLength(2);
    expect(commonDataset.metadata.alternateIdentifiers).toEqual(
      expect.arrayContaining([
        {
          alternateID: '10.23728/b2share.8f0fdd0163f044a082f8c2571205aaaa',
          alternateIDType: 'DOI',
        },
        {
          alternateID: 'http://hdl.handle.net/11304/067cb4a5-5143-406d-84e8-018ecc39601a',
          alternateIDType: 'Handle',
        },
      ]),
    );
    const identifierTypes = commonDataset.metadata.alternateIdentifiers!.map((id) => id.alternateIDType);
    expect(identifierTypes).toContain('DOI');
    expect(identifierTypes).toContain('Handle');
    expect(commonDataset.metadata.relatedIdentifiers).toHaveLength(1);
    expect(commonDataset.metadata.relatedIdentifiers).toEqual([
      {
        relatedID: mockB2ShareOldData.links.self,
        relatedIDType: 'URL',
        relatedResourceType: 'Dataset',
        relationType: 'IsNewVersionOf',
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
    expect(commonDataset.metadata.keywords).toBeDefined();
    expect(commonDataset.metadata.keywords).toEqual([
      {
        keywordLabel: '3.3.14 → Earth sciences → Meteorology',
      },
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
        licenseCode: 'Creative Commons Attribution 4.0 International',
        licenseURI: 'https://creativecommons.org/licenses/by/4.0/',
      },
    ]);
    expect(commonDataset.metadata.assetType).toBe('Dataset');
    expect(commonDataset.metadata.titles).toBeDefined();
    expect(commonDataset.metadata.titles![0].titleText).toBe('LTER Zöbelboden (Austria) - meteorological data 1996');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceName).toBe('B2Share Eudat');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(
      'https://b2share.eudat.eu/api/records/6b6sm-d1k39',
    );
    // We check that the correct string was called to get versions
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockB2ShareData.links.versions);

    expect(commonDataset.metadata.geoLocations).toBeDefined();
    expect(commonDataset.metadata.geoLocations).toHaveLength(6);
    const pointLocations = commonDataset.metadata.geoLocations!.filter((loc) => loc.point);
    expect(pointLocations).toHaveLength(3);
    expect(pointLocations[0].point?.longitude).toBe(16.2824);
    expect(pointLocations[0].point?.latitude).toBe(47.7037);
    expect(pointLocations[0].observationLocation?.deimsLocationID).toBe('77c127c4-2ebe-453b-b5af-61858ff02e31');
    const envelopeLocations = commonDataset.metadata.geoLocations!.filter((loc) => loc.boundingBox);
    expect(envelopeLocations).toHaveLength(3);
    expect(envelopeLocations[0].boundingBox?.westBoundLongitude).toBe(16.25129129);
    expect(envelopeLocations[0].boundingBox?.eastBoundLongitude).toBe(16.30908535);
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
      'https://b2share.eudat.eu/api/records/6b6sm-d1k39',
    );

    expect(commonDataset.metadata.alternateIdentifiers).toBeDefined();
    expect(commonDataset.metadata.alternateIdentifiers).toHaveLength(2);
    expect(commonDataset.metadata.alternateIdentifiers).toEqual(
      expect.arrayContaining([
        {
          alternateID: '10.23728/b2share.8f0fdd0163f044a082f8c2571205aaaa',
          alternateIDType: 'DOI',
        },
        {
          alternateID: 'http://hdl.handle.net/11304/067cb4a5-5143-406d-84e8-018ecc39601a',
          alternateIDType: 'Handle',
        },
      ]),
    );
    const identifierTypes = commonDataset.metadata.alternateIdentifiers!.map((id) => id.alternateIDType);
    expect(identifierTypes).toContain('DOI');
    expect(identifierTypes).toContain('Handle');
    expect(commonDataset.metadata.relatedIdentifiers).toEqual([
      {
        relatedID: 'https://b2share.eudat.eu/api/records/c8ygw-dja55',
        relatedIDType: 'URL',
        relatedResourceType: 'Dataset',
        relationType: 'IsNewVersionOf',
      },
    ]);

    expect(fetchJsonSpy).toHaveBeenCalledTimes(2);
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockB2ShareOldData.links.versions);
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockB2ShareData.links.self);
  });
});
