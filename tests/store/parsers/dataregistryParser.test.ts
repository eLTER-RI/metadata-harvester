import { CommonDataset } from '../../../src/store/commonStructure';
import mockDataregistryData from './apiResponses/dataregistry.json';
import { mapDataRegistryToCommonDatasetMetadata } from '../../../src/store/parsers/dataregistryParser';

jest.mock('../../../src/utilities/fetchJsonFromRemote');

jest.mock('../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));

describe('DataRegistry Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly map a dataregistry latest record', async () => {
    const sourceUrl = 'http://example.com/dataregistry/1';

    const commonDataset: CommonDataset = await mapDataRegistryToCommonDatasetMetadata(
      sourceUrl,
      mockDataregistryData as any,
      [],
    );

    expect(commonDataset.metadata.assetType).toBe('Other');
    expect(commonDataset.metadata.creators).toBeDefined();
    expect(commonDataset.metadata.creators![0]).toEqual({
      creatorFamilyName: 'Sigovini',
      creatorGivenName: 'Marco',
      creatorEmail: 'marco.sigovini@cnr.it',
    });
    expect(commonDataset.metadata.contactPoints).toBeDefined();
    expect(commonDataset.metadata.contactPoints).toHaveLength(1);
    expect(commonDataset.metadata.contactPoints![0]).toEqual({
      contactName: 'Marco Sigovini',
      contactEmail: 'marco.sigovini@cnr.it',
    });
    expect(commonDataset.metadata.keywords).toBeDefined();
    expect(commonDataset.metadata.keywords![0]).toEqual({ keywordLabel: 'bbb' });
    expect(commonDataset.metadata.titles).toBeDefined();
    expect(commonDataset.metadata.titles![0].titleText).toBe(
      'Water temperature and Dissolved Oxygen at Valgrande Coffa (VC) station in the Lagoon of Venice (IT) from June to December 2024',
    );
    expect(commonDataset.metadata.descriptions).toBeDefined();
    expect(commonDataset.metadata.descriptions).toHaveLength(2);
    expect(commonDataset.metadata.descriptions![0].descriptionText).toBe(
      'Time series of water temperature (°C) and Dissolved Oxygen (mg/L) at Valgrande Coffa (VC) study area (45.325564°N, 12.285743°E) in the Lagoon of Venice (IT), from 20/06/2024 to 04/12/2024. Data were collected at a depth of about –1 m relative to mean sea level. Measurements were carried out using a HOBO U26 data logger, which continuously recorded (5-minute interval) temperature and Dissolved Oxygen. Dissolved Oxygen sensor was calibrated at intervals of approximately 1–2 months. The measurements were performed during bio-ecological studies.',
    );
    expect(commonDataset.metadata.descriptions![0].descriptionType).toBe('Abstract');
    expect(commonDataset.metadata.descriptions![1].descriptionText).toBe('No information provided');
    expect(commonDataset.metadata.descriptions![1].descriptionType).toBe('Other');
    expect(commonDataset.metadata.geoLocations).toBeDefined();
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon).toBeDefined();
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].points).toHaveLength(5);
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].points).toEqual([
      {
        longitude: 12.284743,
        latitude: 45.324564,
      },
      {
        longitude: 12.284743,
        latitude: 45.326564,
      },
      {
        longitude: 12.286743,
        latitude: 45.326564,
      },
      {
        longitude: 12.286743,
        latitude: 45.324564,
      },
      {
        longitude: 12.284743,
        latitude: 45.324564,
      },
    ]);
    expect(commonDataset.metadata.publicationDate).toBe('2025-08-28');
    expect(commonDataset.metadata.licenses).toBeDefined();
    expect(commonDataset.metadata.licenses).toBeDefined();
    expect(commonDataset.metadata.licenses).toEqual([
      {
        licenseCode: 'cc by-nc',
        licenseURI: 'https://creativecommons.org/licenses/by-nc/4.0/',
      },
    ]);
    expect(commonDataset.metadata.files).toBeDefined();
    expect(commonDataset.metadata.files![0].sourceUrl).toBe(
      'https://dataregistry.lteritalia.it/documents/169/download',
    );
    expect(commonDataset.metadata.externalSourceInformation.externalSourceName).toBe('DataRegistry');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(sourceUrl);
  });
});
