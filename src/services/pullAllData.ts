import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import { CONFIG } from '../../config';
import { mapB2ShareToCommonDatasetMetadata } from '../store/b2shareParser';
import {
  fetchSites,
  getB2ShareMatchedSites,
  getDataRegistryMatchedSites,
  getFieldSitesMatchedSites,
  getZenodoMatchedSites,
} from '../utilities/matchDeimsId';
import { mapFieldSitesToCommonDatasetMetadata } from '../store/sitesParser';
import { JSDOM } from 'jsdom';
import { RepositoryType, SiteReference } from '../store/commonStructure';
import { mapZenodoToCommonDatasetMetadata } from '../store/zenodoParser';
import { RateLimiter } from './rateLimiter';
import { mapDataRegistryToCommonDatasetMetadata } from '../store/dataregistryParser';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 20000;

export function getNestedValue(obj: any, path: string): any {
  const objectParts = path.split('.');
  let currentPart = obj;
  for (const part of objectParts) {
    if (currentPart === null || currentPart === undefined) {
      return undefined;
    }
    currentPart = currentPart[part];
  }
  return currentPart;
}

// Function to fetch JSON from a URL
export async function fetchJson(url: string, retriesLeft = MAX_RETRIES, delay = INITIAL_RETRY_DELAY_MS): Promise<any> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const headers: { [key: string]: string } = {
      Accept: 'application/json',
    };
    if (process.env.FIELDSITES_TOKEN && url == CONFIG.REPOSITORIES['SITES'].apiUrl) {
      headers['Authorization'] = `Bearer ${process.env.FIELDSITES_TOKEN}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 429 && retriesLeft > 0) {
        process.stderr.write(`Received 429 Too Many Requests for ${url}. Retrying...\n`);
        const retryAfter = 10000;
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return fetchJson(url, retriesLeft - 1, delay * 2);
      }

      let errorBody = 'No response body';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorBody = JSON.stringify(await response.json(), null, 2);
        } else {
          errorBody = await response.text();
        }
      } catch (e) {
        errorBody = `Could not parse response body: ${e.message}`;
      }

      const errorMessage = `
        Error fetching ${url}: Request failed with status: ${response.status} ${response.statusText}
        URL: ${response.url}
        Response Body: ${errorBody}
      `;

      process.stderr.write(errorMessage);
      return null;
    }
    return await response.json();
  } catch (error) {
    process.stderr.write(`Error fetching ${url}:` + error + '\n');
    return null;
  }
}

// Function to fetch XML from a given URL.
export async function fetchXml(url: string): Promise<Document | null> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    const dom = new JSDOM(text, { contentType: 'application/xml' });
    return dom.window.document;
  } catch (error) {
    process.stdout.write(`Error fetching XML from ${url}:` + error + '\n');
    return null;
  }
}

export async function processApiPage(
  url: string,
  sites: any,
  selfLinkKey?: string,
  dataKey?: string,
  repositoryType?: RepositoryType,
): Promise<any[]> {
  process.stdout.write(`Fetching the dataset from: ${url}...\n`);
  let rateLimiter: RateLimiter;
  if (!repositoryType || !selfLinkKey) {
    process.stderr.write(`Invalid repository type.\n`);
    return [];
  } else if (repositoryType === 'ZENODO' || repositoryType === 'ZENODO_IT') {
    rateLimiter = new RateLimiter(100);
  }

  const data = await fetchJson(url);
  const hits: string[] = dataKey ? getNestedValue(data, dataKey) || [] : [];

  process.stdout.write(`Found ${hits.length} self links. Fetching individual records...\n`);

  // Process individual records using the parser
  const mappedResults = await Promise.all(
    hits.map(async (hit: any) => {
      const recordUrl = getNestedValue(hit, selfLinkKey);
      if (!hit) return null;

      const recordData = recordUrl ? await fetchJson(recordUrl) : hit;

      if (!recordData) {
        process.stdout.write(`Failed dataset: ${recordUrl}...\n`);
        return null;
      }

      switch (repositoryType) {
        case 'B2SHARE_EUDAT':
        case 'B2SHARE_JUELICH': {
          const matchedSites = await getB2ShareMatchedSites(recordData, sites);

          return mapB2ShareToCommonDatasetMetadata(recordUrl, recordData, matchedSites, repositoryType);
        }
        case 'DATAREGISTRY': {
          const matchedSites = await getDataRegistryMatchedSites(recordData);

          return mapDataRegistryToCommonDatasetMetadata(recordUrl, recordData, matchedSites);
        }
        case 'ZENODO':
        case 'ZENODO_IT': {
          await rateLimiter.waitForRequest();
          const matchedSites = await getZenodoMatchedSites(recordData, sites);

          return mapZenodoToCommonDatasetMetadata(recordUrl, recordData, matchedSites);
        }
      }
    }),
  );

  return mappedResults.filter((r) => r !== null);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processFieldSitesPage(url: string, sites: any): Promise<any[]> {
  process.stdout.write(`Fetching the dataset from: ${url}...\n`);

  const data = await fetchXml(url);
  if (!data) {
    process.stderr.write('Failed to fetch or parse sitemap XML.');
    return [];
  }
  const locElements = data.getElementsByTagName('loc');
  const urls: string[] = [];
  for (let i = 0; i < locElements.length; i++) {
    urls.push(locElements[i].textContent || '');
  }

  process.stdout.write(`Found ${urls.length} URLs. Fetching individual records...\n`);

  // // Process individual records using the parser
  const mappedResults = await Promise.all(
    urls.map(async (datasetUrl: any) => {
      if (!datasetUrl) return null;
      const recordData = await fetchJson(datasetUrl);
      if (!recordData) return null;
      const matchedSites = getFieldSitesMatchedSites(recordData);
      return mapFieldSitesToCommonDatasetMetadata(datasetUrl, recordData, matchedSites);
    }),
  );
  return mappedResults.filter((r) => r !== null);
}

// Main function
async function processAll(repositoryType: RepositoryType) {
  const repoConfig = CONFIG.REPOSITORIES[repositoryType];
  if (!repoConfig) {
    process.stderr.write(`Configuration for repository '${repositoryType}' not available.\n`);
    return;
  }

  const apiUrl = repoConfig.apiUrl;
  const mappedRecordsPath = repoConfig.mappedRecordsPath;
  const pageSize = repoConfig.pageSize;
  const selfLinkKey = repoConfig.selfLinkKey;
  const dataKey = repoConfig.dataKey;

  let processPageFunction: (
    url: string,
    sites: SiteReference[],
    selfLinkKey?: string,
    dataKey?: string,
    repositoryType?: RepositoryType,
  ) => Promise<any[]>;

  switch (repositoryType) {
    case 'B2SHARE_EUDAT':
    case 'B2SHARE_JUELICH':
    case 'ZENODO':
    case 'ZENODO_IT':
    case 'DATAREGISTRY':
      processPageFunction = processApiPage;
      break;
    case 'SITES':
      processPageFunction = (url: string, sites: any) => processFieldSitesPage(url, sites);
      break;
    default:
      throw new Error(`Processor function not defined for repository type: ${repositoryType}`);
  }

  try {
    await fs.unlink(mappedRecordsPath);
    process.stdout.write(`File ${mappedRecordsPath} deleted\n`);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const sites = await fetchSites();
  process.stdout.write(`Found ${sites.length} sites.\n`);

  const allRecords: any[] = [];
  let page = 1;

  while (pageSize) {
    const pageUrl = `${apiUrl}&size=${pageSize}&page=${page}`;
    process.stdout.write(`Fetching page ${page} from ${repositoryType}...\n`);

    // Here we know that Sites does not do paging, and the parsing is different
    if (repositoryType === 'SITES') {
      process.stderr.write(`Pagination parsing not implemented for SITES repository.\n`);
      return;
    }
    const pageRecords = await processPageFunction(pageUrl, sites, selfLinkKey, dataKey, repositoryType);
    if (pageRecords.length === 0) {
      process.stdout.write(`No records found on page ${page}. Stopping.\n`);
      break;
    }

    allRecords.push(...pageRecords);
    process.stdout.write(`Page ${page} processed (${pageRecords.length} records).\n`);

    if (pageRecords.length < pageSize) {
      process.stdout.write('Last page reached.\n');
      break;
    }

    page++;
  }

  if (!pageSize) {
    const records = await processPageFunction(apiUrl, sites);
    allRecords.push(...records);
  }

  await fs.writeFile(mappedRecordsPath, JSON.stringify(allRecords, null, 2));
  process.stdout.write(`Done. Saved ${allRecords.length} records to ${mappedRecordsPath}\n`);
}

const repositoryToProcess = process.argv[2] as RepositoryType;

if (repositoryToProcess) {
  processAll(repositoryToProcess).catch(console.error);
} else {
  console.error("Please specify a repository to process: 'B2SHARE', 'SITES'");
}
