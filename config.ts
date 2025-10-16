import { RepositoryType } from './src/store/commonStructure';

export interface RepositoryConfig {
  apiUrl: string;
  pageSize?: number;
  selfLinkKey?: string;
  dataKey?: string;
  singleRecordKey?: string;
  processFunction: 'processApiPage' | 'processFieldSitesPage';
  darQuery: string;
}

const repositories: Record<RepositoryType, RepositoryConfig> = {
  B2SHARE_EUDAT: {
    apiUrl: 'https://b2share.eudat.eu/api/records/?q=community:d952913c-451e-4b5c-817e-d578dc8a4469&sort=oldest',
    pageSize: 100,
    selfLinkKey: 'links.self',
    dataKey: 'hits.hits',
    processFunction: 'processApiPage',
    darQuery:
      'https://dar.elter-ri.eu/api/external-datasets/?q=&metadata_projects_projectName=B2SHARE%20Eudat%20external%20record%20-%20eLTER%20Community&sort=newest&size=300',
  } as RepositoryConfig,
  B2SHARE_JUELICH: {
    apiUrl: 'https://b2share.fz-juelich.de/api/records/?q=community:d952913c-451e-4b5c-817e-d578dc8a4469&sort=oldest',
    pageSize: 100,
    selfLinkKey: 'links.self',
    dataKey: 'hits.hits',
    processFunction: 'processApiPage',
    darQuery:
      'https://dar.elter-ri.eu/api/external-datasets/?q=&metadata_projects_projectName=B2SHARE%20Juelich%20external%20record%20-%20eLTER%20Community&sort=newest&size=100',
  } as RepositoryConfig,
  DATAREGISTRY: {
    apiUrl: 'https://dataregistry.lteritalia.it/api/v2/resources?format=json',
    pageSize: 10,
    selfLinkKey: 'link',
    dataKey: 'resources',
    singleRecordKey: 'resource',
    processFunction: 'processApiPage',
    darQuery:
      'https://dar.elter-ri.eu/api/external-datasets/?q=&metadata_projects_projectName=Dataregistry%20LTER-Italy%20DAR&sort=newest&size=100',
  },
  SITES: {
    apiUrl: 'https://meta.fieldsites.se/data-sitemap.xml',
    processFunction: 'processFieldSitesPage',
    darQuery:
      'https://dar.elter-ri.eu/api/external-datasets/?q=&metadata_externalSourceInformation_externalSourceName=FieldSites&size=1500',
  } as RepositoryConfig,
  ZENODO: {
    apiUrl: 'https://zenodo.org/api/communities/c4f49aa1-a5ef-46b1-a7ec-7756cd391aa4/records?q=&sort=oldest',
    pageSize: 100,
    dataKey: 'hits.hits',
    selfLinkKey: 'links.self',
    processFunction: 'processApiPage',
    darQuery:
      'https://dar.elter-ri.eu/api/external-datasets/?q=&metadata_externalSourceInformation_externalSourceName=Zenodo&sort=newest&size=500',
  } as RepositoryConfig,
  ZENODO_IT: {
    apiUrl: 'https://zenodo.org/api/communities/43025cdd-7116-4ed8-8bba-d484ee58896f/records?q=&sort=oldest',
    mappedRecordsPath: './data/mapped_zenodo_lter_it_records.json',
    pageSize: 100,
    dataKey: 'hits.hits',
    selfLinkKey: 'links.self',
    processFunction: 'processApiPage',
    darQuery:
      'https://dar.elter-ri.eu/api/external-datasets/?q=&metadata_externalSourceInformation_externalSourceName=Zenodo&sort=newest&size=500',
  } as RepositoryConfig,
};

export const CONFIG = {
  REPOSITORIES: repositories,
  DEIMS_API_URL: 'https://deims.org/api/sites',
};
