import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import { CONFIG } from '../../config';
import { mapB2ShareToCommonDatasetMetadata } from '../store/b2shareParser';
import { fetchSites, getB2ShareMatchedSites } from '../utilities/matchDeimsId';

// Function to fetch JSON from a URL
export async function fetchJson(url: string): Promise<any> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    process.stdout.write(`Error fetching ${url}:` + error + '\n');
    return null;
  }
}

// Main function
async function processB2SharePage(url: string, sites: any): Promise<any[]> {
  process.stdout.write(`Fetching the dataset from: ${url}...\n`);

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

      const matchedSites = await getB2ShareMatchedSites(recordData, sites);

      return mapB2ShareToCommonDatasetMetadata(
        recordData.metadata.ePIC_PID || recordData.links?.self,
        recordData,
        matchedSites,
      );
    }),
  );

  return mappedResults.filter((r) => r !== null);
}

type RepositoryType = 'B2SHARE';

// Run the script
async function processAll(repositoryType: RepositoryType) {
  let apiUrl: string;
  let mappedRecordsPath: string;
  let processPageFunction: (url: string, sites: any) => Promise<any[]>;
  let pageSize: number;

  switch (repositoryType) {
    case 'B2SHARE':
      apiUrl = CONFIG.B2SHARE_API_URL;
      mappedRecordsPath = CONFIG.B2SHARE_MAPPED_RECORDS;
      processPageFunction = processB2SharePage;
      pageSize = CONFIG.PAGE_SIZE || 100;
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

  while (true) {
    const pageUrl = `${apiUrl}&size=${pageSize}&page=${page}`;
    process.stdout.write(`Fetching page ${page} from ${repositoryType}...\n`);

    const pageRecords = await processPageFunction(pageUrl, sites);
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

  await fs.writeFile(mappedRecordsPath, JSON.stringify(allRecords, null, 2));
  process.stdout.write(`Done. Saved ${allRecords.length} records to ${mappedRecordsPath}\n`);
}

const repositoryToProcess = process.argv[2] as RepositoryType;

if (repositoryToProcess) {
  processAll(repositoryToProcess).catch(console.error);
} else {
  console.error("Please specify a repository to process: 'B2SHARE'");
}
