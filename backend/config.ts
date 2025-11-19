import { RepositoryType } from './src/store/commonStructure';

const currentEnv = process.env.NODE_ENV;
if (currentEnv !== 'prod' && currentEnv !== 'dev' && currentEnv !== 'test') {
  throw new Error(`NODE_ENV must be set to 'prod', 'dev', or 'test'`);
}

export const getApiUrl = () => {
  if (currentEnv === 'prod') return process.env.PROD_API_URL;
  if (currentEnv === 'dev') return process.env.DEV_API_URL;
  return 'http://mock-api-for-tests.com';
};

export const API_URL = getApiUrl();

export const AUTH_TOKEN =
  currentEnv === 'prod' ? 'Bearer ' + process.env.PROD_AUTH_TOKEN : 'Bearer ' + process.env.DEV_AUTH_TOKEN;

if (!API_URL || !AUTH_TOKEN) {
  throw new Error(
    `API_URL or AUTH_TOKEN undefined, env: '${currentEnv}'.
    Check the .env file and set environments correctly.`,
  );
}

const envConfigs = {
  prod: {
    API_URL: process.env.PROD_API_URL,
    AUTH_TOKEN: `Bearer ${process.env.PROD_AUTH_TOKEN}`,
  },
  dev: {
    API_URL: process.env.DEV_API_URL,
    AUTH_TOKEN: `Bearer ${process.env.DEV_AUTH_TOKEN}`,
  },
  test: {
    API_URL: 'http://mock-api-for-tests.com',
    AUTH_TOKEN: 'Bearer mock-token',
  },
};

const envConfig = envConfigs[currentEnv as keyof typeof envConfigs];

if (!envConfig) {
  throw new Error(`Invalid NODE_ENV: '${currentEnv}'. No configuration found.`);
}

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
    apiUrl: 'https://b2share.eudat.eu/api/communities/d952913c-451e-4b5c-817e-d578dc8a4469/records?q=&sort=oldest',
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
  CLEANUP_DAYS_THRESHOLD: parseInt(process.env.CLEANUP_DAYS_THRESHOLD || '30', 10),
  ...envConfig,
};
