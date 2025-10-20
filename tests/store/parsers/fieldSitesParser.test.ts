import { CommonDataset } from '../../../src/store/commonStructure';
import mockFieldSitesData from './apiResponses/fieldSites.json';
import mockFieldSitesOldData from './apiResponses/fieldsSites_old.json';
import mockFieldSitesNonArray from './apiResponses/fieldSites-non-array-coverage.json';
import * as fetcher from '../../../src/utilities/fetchJsonFromRemote';
import { mapFieldSitesToCommonDatasetMetadata } from '../../../src/store/parsers/fieldSitesParser';

jest.mock('../../../src/utilities/fetchJsonFromRemote');

jest.mock('../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));

describe('SITES Parser', () => {
  let fetchJsonSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (fetchJsonSpy) {
      fetchJsonSpy.mockRestore();
    }
  });

  it('should correctly map a standard SITES record', async () => {
    const sourceUrl = 'https://meta.fieldsites.se/objects/VGRl3pJhfNW472Jd3YlgLoCg';

    const commonDataset: CommonDataset = await mapFieldSitesToCommonDatasetMetadata(
      sourceUrl,
      mockFieldSitesData as any,
      [],
    );

    expect(commonDataset.metadata.assetType).toBe('Dataset');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceName).toBe('FieldSites');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(sourceUrl);
    expect(commonDataset.metadata.geoLocations).toBeDefined();
    expect(commonDataset.metadata.geoLocations![0].point).toBeDefined();
    expect(commonDataset.metadata.geoLocations![0].point!).toEqual({
      latitude: 58.371135,
      longitude: 12.16135,
    });
    expect(commonDataset.metadata.geoLocations![1].boundingPolygon).toBeDefined();
    expect(commonDataset.metadata.geoLocations![1].boundingPolygon).toHaveLength(1);
    expect(commonDataset.metadata.geoLocations![1].boundingPolygon![0].inPolygonPoint).toEqual({
      latitude: 58.369333,
      longitude: 12.15756,
    });
    expect(commonDataset.metadata.geoLocations![1].boundingPolygon![0].points).toHaveLength(75);
    expect(commonDataset.metadata.geoLocations![1].boundingPolygon![0].points[0]).toEqual({
      latitude: 58.369333,
      longitude: 12.15756,
    });
    expect(commonDataset.metadata.geoLocations![1].boundingPolygon![0].points[74]).toEqual({
      latitude: 58.369333,
      longitude: 12.15756,
    });
    expect(commonDataset.metadata.alternateIdentifiers).toBeDefined();
    expect(commonDataset.metadata.alternateIdentifiers![0].alternateID).toBe('11676.1/VGRl3pJhfNW472Jd3YlgLoCg');
    expect(commonDataset.metadata.alternateIdentifiers![0].alternateIDType).toBe('Handle');
    expect(commonDataset.pids?.doi.identifier).toBe('11676.1/VGRl3pJhfNW472Jd3YlgLoCg');
    expect(commonDataset.pids?.doi.provider).toBe('doi.org');
    expect(commonDataset.metadata.relatedIdentifiers).toEqual([
      {
        relatedID: 'https://meta.fieldsites.se/objects/Y3ct4eNvkD7goZFtdYwIb4wK',
        relatedIDType: 'URL',
        relatedResourceType: 'Dataset',
        relationType: 'IsNewVersionOf',
      },
    ]);
    expect(commonDataset.metadata.publicationDate).toBe('2023-01-01');
    expect(commonDataset.metadata.titles![0].titleText).toBe(
      'Physical variables - lake temperature profile from Erssjön, Floating platform',
    );
    expect(commonDataset.metadata.descriptions).toBeDefined();
    expect(commonDataset.metadata.descriptions).toHaveLength(2);
    expect(commonDataset.metadata.descriptions![0].descriptionText).toBe(
      'High frequency temperature profiles are measured in lakes of SITES Water to be able to determine the thermal structure.',
    );
    expect(commonDataset.metadata.descriptions![0].descriptionType).toBe('Abstract');
    expect(commonDataset.metadata.descriptions![1].descriptionText).toBe(
      'Skogaryd Research Catchment is located 100 km north of Gothenburg in Sweden. The base measurement program at Skogaryd includes greenhouse gas (GHG) flux measurements from terrestrial and limnic ecosystem, using a range of different methods, as well as stream flow and chemical analyses. The Skogaryd Research Catchment promotes biogeochemical, ecological, eco-physiological and within-canopy chemical research. Researchers are provided with a high-tech infrastructure in the field. Advanced instruments are used for flux measurements of abiotic and biotic parameters. Cabins in Skogaryd are used for lodging, office, education, and storage. A field crew with local knowledge and expertise on monitoring instrumentation can assist during fieldwork. A workshop for wood and plastics hand craft as well as work related to electronic repairs and development are provided. A nearby farm provides an advance workshop for repair of field equipment.',
    );
    expect(commonDataset.metadata.descriptions![1].descriptionType).toBe('Other');
    expect(commonDataset.metadata.files).toBeDefined();
    expect(commonDataset.metadata.files).toEqual([
      {
        name: 'SITES_TW-PROF_SRC_ERS_20230101-20231231_L2_10min.csv',
        sourceUrl: 'https://data.fieldsites.se/objects/VGRl3pJhfNW472Jd3YlgLoCg',
        md5: 'VGRl3pJhfNW472Jd3YlgLoCg4eT36rT5Xn5SQIzP6zw',
        size: '3807683',
        sizeMeasureType: 'B',
        format: 'csv',
      },
    ]);
    expect(commonDataset.metadata.licenses![0].licenseCode).toBe('SITES CCBY4 Data Licence');
    expect(commonDataset.metadata.responsibleOrganizations).toEqual([
      {
        organizationEmail: 'data@fieldsites.se',
        organizationIDs: [
          {
            entityID: 'https://www.fieldsites.se/en-GB/research-stations/skogaryd-32652394',
          },
          {
            entityID: 'https://meta.fieldsites.se/resources/stations/Skogaryd',
          },
        ],
        organizationName: 'Skogaryd Research Catchment',
      },
      {
        organizationName: 'University of Gothenburg',
      },
    ]);
    expect(commonDataset.metadata.contactPoints).toEqual([
      {
        contactEmail: 'data@fieldsites.se',
        contactName: 'Skogaryd Research Catchment',
      },
    ]);
    expect(commonDataset.metadata.dataLevel?.dataLevelCode).toBe('2');
  });

  it('should fetch the latest version when starting with an old record', async () => {
    const oldSourceUrl = 'https://meta.fieldsites.se/objects/Y3ct4eNvkD7goZFtdYwIb4wK';

    fetchJsonSpy = jest.spyOn(fetcher, 'fetchJson').mockResolvedValue(mockFieldSitesData);

    const commonDataset: CommonDataset = await mapFieldSitesToCommonDatasetMetadata(
      oldSourceUrl,
      mockFieldSitesOldData as any,
      [],
    );

    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(
      'https://meta.fieldsites.se/objects/VGRl3pJhfNW472Jd3YlgLoCg',
    );

    expect(commonDataset.metadata.relatedIdentifiers).toContainEqual({
      relatedID: 'https://meta.fieldsites.se/objects/Y3ct4eNvkD7goZFtdYwIb4wK',
      relatedIDType: 'URL',
      relatedResourceType: 'Dataset',
      relationType: 'IsNewVersionOf',
    });

    expect(fetchJsonSpy).toHaveBeenCalledTimes(1);
    expect(fetchJsonSpy).toHaveBeenCalledWith('https://meta.fieldsites.se/objects/VGRl3pJhfNW472Jd3YlgLoCg');
  });

  it('should handle non-array coverage', async () => {
    const sourceUrl = 'https://data.fieldsites.se/objects/v4QDZJ6fTm34fX0k6dpJAnqs';
    const commonDataset: CommonDataset = await mapFieldSitesToCommonDatasetMetadata(
      sourceUrl,
      mockFieldSitesNonArray as any,
      [],
    );
    expect(commonDataset.metadata.geoLocations).toBeDefined();
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon).toBeDefined();
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon).toHaveLength(1);
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].inPolygonPoint).toEqual({
      latitude: 67.9068,
      longitude: 18.5765,
    });
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].points).toHaveLength(23);
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].points[0]).toEqual({
      latitude: 67.9068,
      longitude: 18.5765,
    });
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].points).toHaveLength(23);
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].points[1]).toEqual({
      latitude: 67.9042,
      longitude: 18.598,
    });
    expect(commonDataset.metadata.geoLocations![0].boundingPolygon![0].points[22]).toEqual({
      latitude: 67.9068,
      longitude: 18.5765,
    });
  });
});
