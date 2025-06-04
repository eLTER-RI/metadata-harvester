import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import { CONFIG } from '../../config';
import { mapB2ShareToCommonDatasetMetadata } from '../store/b2shareParser';
import { fetchSites, getB2ShareMatchedSites, getMatchedSitesForRecord } from '../utilities/matchDeimsId';

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
async function processPage(url: string, sites: any): Promise<any[]> {
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

// Run the script
async function processAll() {
  try {
    await fs.unlink(CONFIG.MAPPED_RECORDS);
    process.stdout.write('File deleted\n');
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const sites = await fetchSites();
  process.stdout.write(`Found ${sites.length} sites.\n`);

  const allRecords: any[] = [];
  const size = CONFIG.PAGE_SIZE || 100;
  let page = 1;

  while (true) {
    const pageUrl = `${CONFIG.INITIAL_API_URL}&size=${size}&page=${page}`;
    process.stdout.write(`Fetching page ${page}...\n`);

    const pageRecords = await processPage(pageUrl, sites);
    if (pageRecords.length === 0) {
      process.stdout.write(`No records found on page ${page}. Stopping.\n`);
      break;
    }

    allRecords.push(...pageRecords);
    process.stdout.write(`Page ${page} processed (${pageRecords.length} records).\n`);

    if (pageRecords.length < size) {
      process.stdout.write('Last page reached.\n');
      break;
    }

    page++;
  }

  await fs.writeFile(CONFIG.MAPPED_RECORDS, JSON.stringify(allRecords, null, 2));
  process.stdout.write(`Done. Saved ${allRecords.length} records to ${CONFIG.MAPPED_RECORDS}\n`);
}

processAll();
