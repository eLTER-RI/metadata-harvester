import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import { CONFIG } from '../../config';
import { mapB2ShareToCommonDatasetMetadata } from '../store/b2shareParser';
import { fetchSites, getB2ShareMatchedSites, getFieldSitesMatchedSites } from '../utilities/matchDeimsId';
import { mapFieldSitesToCommonDatasetMetadata } from '../store/sitesParser';
import { JSDOM } from 'jsdom';
import { RepositoryType } from '../store/commonStructure';
import { mapZenodoToCommonDatasetMetadata } from '../store/zenodoParser';

// Function to fetch JSON from a URL
export async function fetchJson(url: string): Promise<any> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    process.stderr.write(`Error fetching ${url}:` + error + '\n');
    return null;
  }
}

// Function to fetch XML from a given URL.
async function fetchXml(url: string): Promise<Document | null> {
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

async function processB2SharePage(
  url: string,
  sites: any,
  repositoryType?: 'B2SHARE' | 'B2SHARE_JUELICH' | 'ZENODO' | 'ZENODO_IT',
): Promise<any[]> {
  process.stdout.write(`Fetching the dataset from: ${url}...\n`);

  if (!repositoryType) {
    process.stderr.write(`Invalid repository type.\n`);
    return [];
  }

  const data = await fetchJson(url);
  const hits: string[] = data?.hits?.hits || [];

  process.stdout.write(`Found ${hits.length} self links. Fetching individual records...\n`);

  // Process individual records using the parser
  const mappedResults = await Promise.all(
    hits.map(async (hit: any) => {
      if (!hit || !hit.links?.self) return null;

      const selfLink = hit.links.self;
      const recordData = await fetchJson(selfLink);

      if (!recordData) return null;

      switch (repositoryType) {
        case 'B2SHARE':
        case 'B2SHARE_JUELICH': {
          const matchedSites = await getB2ShareMatchedSites(recordData, sites);

          return mapB2ShareToCommonDatasetMetadata(
            recordData.metadata.ePIC_PID || recordData.links?.self,
            recordData,
            matchedSites,
            repositoryType,
          );
        }
        case 'ZENODO':
        case 'ZENODO_IT':
          return mapZenodoToCommonDatasetMetadata(
            recordData.metadata.ePIC_PID || recordData.links?.self,
            recordData,
            [],
            repositoryType,
          );
      }
    }),
  );

  return mappedResults.filter((r) => r !== null);
}

async function processFieldSitesPage(url: string, sites: any): Promise<any[]> {
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
  let apiUrl: string;
  let mappedRecordsPath: string;
  let processPageFunction: (url: string, sites: any, repositoryType?: 'B2SHARE' | 'B2SHARE_JUELICH') => Promise<any[]>;
  let pageSize: number | undefined = undefined;

  switch (repositoryType) {
    case 'B2SHARE':
    case 'B2SHARE_JUELICH':
      apiUrl = repositoryType === 'B2SHARE' ? CONFIG.B2SHARE_API_URL : CONFIG.B2SHARE_JUELICH_API_URL;
      mappedRecordsPath =
        repositoryType === 'B2SHARE' ? CONFIG.B2SHARE_MAPPED_RECORDS : CONFIG.B2SHARE_JUELICH_MAPPED_RECORDS;
      processPageFunction = processB2SharePage;
      pageSize = CONFIG.PAGE_SIZE || 100;
      break;
    case 'SITES':
      apiUrl = CONFIG.SITES_API_URL;
      mappedRecordsPath = CONFIG.SITES_MAPPED_RECORDS;
      processPageFunction = processFieldSitesPage;
      break;
    default:
      throw new Error(`Unknown repository type: ${repositoryType}`);
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

    const pageRecords = await processPageFunction(
      pageUrl,
      sites,
      repositoryType === 'B2SHARE' || repositoryType === 'B2SHARE_JUELICH' ? repositoryType : undefined,
    );
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
