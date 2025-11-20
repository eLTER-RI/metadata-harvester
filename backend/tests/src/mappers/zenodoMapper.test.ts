import { CommonDataset } from '../../../src/models/commonStructure';
import mockZenodoData from './apiResponses/zenodo.json';
import mockZenodoOldData from './apiResponses/zenodo_versions_old.json';
import mockZenodoVersions from './apiResponses/zenodo_versions.json';
import * as fetcher from '../../../src/utilities/fetchJsonFromRemote';
import { mapZenodoToCommonDatasetMetadata } from '../../../src/mappers/zenodoMapper';

jest.mock('../../../src/utilities/fetchJsonFromRemote');

jest.mock('../../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));

describe('Zenodo Mapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly map a zenodo latest record', async () => {
    const sourceUrl = 'http://example.com/zenodo/1';

    const commonDataset: CommonDataset = await mapZenodoToCommonDatasetMetadata(sourceUrl, mockZenodoData as any, []);

    expect(commonDataset.metadata.publicationDate).toBe('2024-02-07');
    expect(commonDataset.pids?.doi.identifier).toBe('10.5281/zenodo.10630263');
    expect(commonDataset.pids?.doi.provider).toBe('doi.org');
    expect(commonDataset.metadata.titles).toBeDefined();
    expect(commonDataset.metadata.titles![0].titleText).toBe(
      'eLTER PLUS - eLTER Compiled Survey Overview Information - data inventory',
    );
    expect(commonDataset.metadata.descriptions).toBeDefined();
    expect(commonDataset.metadata.descriptions![0].descriptionText).toBe(
      `<p>This document was created by eLTER PLUS WP8.2 to consolidate the survey information received from site managers (on what data was collected and available at each site; document 'eLTER_Survey_20200915_1700.xlsx') as well as whether the data was delivered to the eLTER PLUS project (stored in the eLTER PLUS B2Drop). This document also includes additionial information about each site, the contact information, coordinates etc.</p>\n<p>The 'Key' sheeet provides a description of each column in the 'Information' sheet and the source of the information (e.g. the document's name, from the DEIMS json file). It is also included the level the information is at (i.e. general site information = 'site level' or information tied to a specific measured variable = 'variable level'). It should be noted that the habitat information was retreived from DEIMS json file and does not necessarily reflect the habitat where variables were measured nor does the order indicate dominant habitats at the site. It should also be noted that 'update frequency', referring to the update frency of the data, was interpreted differently by site managers responding to the survey, and thus is not necessarily consistant with the delivered data.</p>\n<p>The columns that start with 'SITE_' indicate the variable name, unit, etc. as found in the delivered dataframes, which is not always consistant with the variable name, unit, etc. indicated in the survey information. This was only done for biogeochemical data and only for certain sites and variables were targeted.</p>\n<p>&nbsp;</p>\n<p>Funding: eLTER PLUS - European long-term ecosystem, critical zone and socio-ecological systems research infrastructure PLUS</p>\n<p><em>This project has received funding from the European Union's Horizon 2020 research and innovation programme under grant agreement No 871128 (eLTER PLUS).</em></p>`,
    );
    expect(commonDataset.metadata.creators).toBeDefined();
    expect(commonDataset.metadata.creators!).toEqual([
      {
        creatorFamilyName: 'Gillespie',
        creatorGivenName: 'Lauren',
        creatorAffiliation: {
          entityName: 'Centre National de la Recherche Scientifique',
        },
        creatorIDs: [
          {
            entityID: '0000-0002-2294-4411',
            entityIDSchema: 'orcid',
          },
        ],
      },
      {
        creatorFamilyName: 'Diaz-Pines',
        creatorGivenName: 'Eugenio',
        creatorAffiliation: {
          entityName: 'BOKU University',
        },
        creatorIDs: [
          {
            entityID: '0000-0001-9935-106X',
            entityIDSchema: 'orcid',
          },
        ],
      },
    ]);
    expect(commonDataset.metadata.keywords).toBeDefined();
    expect(commonDataset.metadata.keywords).toEqual([
      {
        keywordLabel: 'eLTER PLUS',
      },
      {
        keywordLabel: 'data inventory',
      },
      {
        keywordLabel: 'site information',
      },
      {
        keywordLabel: 'delivered data invetory',
      },
      {
        keywordLabel: 'site data survey results',
      },
    ]);
    expect(commonDataset.metadata.language).toBe('eng');
    expect(commonDataset.metadata.assetType).toBe('Dataset');
    expect(commonDataset.metadata.licenses).toBeDefined();
    expect(commonDataset.metadata.licenses).toEqual([
      {
        licenseCode: 'cc-by-4.0',
        licenseURI: 'https://creativecommons.org/licenses/by/4.0/',
      },
    ]);
    expect(commonDataset.metadata.projects).toBeDefined();
    expect(commonDataset.metadata.projects).toEqual([
      {
        projectName: 'Zenodo external record - eLTER Community',
        projectID: `https://zenodo.org/communities/elter`,
      },
      {
        projectName: 'Zenodo Community: eu',
        projectID: `https://zenodo.org/communities/eu`,
      },
      {
        projectName:
          'eLTER PLUS - European long-term ecosystem, critical zone and socio-ecological systems research infrastructure PLUS',
        projectID: `https://cordis.europa.eu/project/id/871128`,
      },
    ]);
    expect(commonDataset.metadata.files).toBeDefined();
    expect(commonDataset.metadata.files).toHaveLength(1);
    expect(commonDataset.metadata.files).toEqual([
      {
        name: 'eLTER_Compiled_Survey_Overview_Information_20221214.xlsx',
        sourceUrl:
          'https://zenodo.org/api/records/10630263/files/eLTER_Compiled_Survey_Overview_Information_20221214.xlsx/content',
        format: 'xlsx',
        md5: 'bce4fed976f42e52146ac7e605bd7970',
        size: '1267890',
        sizeMeasureType: 'B',
      },
    ]);
  });

  it('should fetch the latest version when starting with an old record', async () => {
    const oldSourceUrl = 'http://example.com/zenodo/old';

    const fetchJsonSpy = jest
      .spyOn(fetcher, 'fetchJson')
      .mockResolvedValueOnce(mockZenodoVersions)
      .mockResolvedValueOnce(mockZenodoData);

    const commonDataset: CommonDataset = await mapZenodoToCommonDatasetMetadata(
      oldSourceUrl,
      mockZenodoOldData as any,
      [],
    );

    expect(commonDataset.metadata.externalSourceInformation.externalSourceName).toBe('Zenodo');
    expect(commonDataset.metadata.externalSourceInformation.externalSourceURI).toBe(
      'https://zenodo.org/api/records/10630263',
    );
    expect(commonDataset.metadata.relatedIdentifiers).toEqual([
      {
        relatedID: 'https://zenodo.org/api/records/10630134',
        relatedIDType: 'URL',
        relatedResourceType: 'Dataset',
        relationType: 'IsNewVersionOf',
      },
      {
        relatedID: 'https://zenodo.org/api/records/10627094',
        relatedIDType: 'URL',
        relatedResourceType: 'Dataset',
        relationType: 'IsNewVersionOf',
      },
    ]);

    expect(fetchJsonSpy).toHaveBeenCalledTimes(2);
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockZenodoOldData.links.versions);
    expect(fetchJsonSpy).toHaveBeenCalledWith(mockZenodoData.links.self);
  });
});
