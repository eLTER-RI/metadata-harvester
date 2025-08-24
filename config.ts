export interface RepositoryConfig {
  apiUrl: string;
  mappedRecordsPath: string;
  pageSize?: number;
  selfLinkKey?: string;
  dataKey?: string;
  processFunction: 'processApiPage' | 'processFieldSitesPage';
}

export const CONFIG = {
  REPOSITORIES: {
    B2SHARE_EUDAT: {
      apiUrl: 'https://b2share.eudat.eu/api/records/?q=community:d952913c-451e-4b5c-817e-d578dc8a4469&sort=oldest',
      mappedRecordsPath: './data/mapped_b2share_eudat_records.json',
      pageSize: 100,
      selfLinkKey: 'links.self',
      dataKey: 'hits.hits',
      processFunction: 'processApiPage',
      rateLimit: 0,
    } as RepositoryConfig,
    B2SHARE_JUELICH: {
      apiUrl: 'https://b2share.fz-juelich.de/api/records/?q=community:d952913c-451e-4b5c-817e-d578dc8a4469&sort=oldest',
      mappedRecordsPath: './data/mapped_b2share_juelich_records.json',
      pageSize: 100,
      selfLinkKey: 'links.self',
      dataKey: 'hits.hits',
      processFunction: 'processApiPage',
      rateLimit: 0,
    } as RepositoryConfig,
    DATAREGISTRY: {
      apiUrl: 'https://dataregistry.lteritalia.it/api/v2/resources?format=json',
      mappedRecordsPath: './data/mapped_dataregistry_records.json',
      pageSize: 10,
      selfLinkKey: 'link',
      dataKey: 'resources',
      processFunction: 'processApiPage',
      rateLimit: 0,
    },
    SITES: {
      apiUrl: 'https://meta.fieldsites.se/data-sitemap.xml',
      mappedRecordsPath: './data/mapped_sites_records.json',
      processFunction: 'processFieldSitesPage',
      rateLimit: 0,
    } as RepositoryConfig,
    ZENODO: {
      apiUrl: 'https://zenodo.org/api/communities/c4f49aa1-a5ef-46b1-a7ec-7756cd391aa4/records?q=&sort=oldest',
      mappedRecordsPath: './data/mapped_zenodo_records.json',
      pageSize: 100,
      dataKey: 'hits.hits',
      selfLinkKey: 'links.self',
      processFunction: 'processApiPage',
      rateLimit: 100,
    } as RepositoryConfig,
    ZENODO_IT: {
      apiUrl: 'https://zenodo.org/api/communities/43025cdd-7116-4ed8-8bba-d484ee58896f/records?q=&sort=oldest',
      mappedRecordsPath: './data/mapped_zenodo_lter_it_records.json',
      pageSize: 100,
      dataKey: 'hits.hits',
      selfLinkKey: 'links.self',
      processFunction: 'processApiPage',
      rateLimit: 100,
    } as RepositoryConfig,
  },
  DEIMS_API_URL: 'https://deims.org/api/sites',
};
