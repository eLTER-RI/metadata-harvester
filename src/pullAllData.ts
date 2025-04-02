import fs from "fs";
import fetch from "node-fetch";
import { mapB2ShareToCommonDatasetMetadata } from "./store/b2shareParser";

const INITIAL_API_URL = "https://b2share.eudat.eu/api/records/?community=e9b9792e-79fb-4b07-b6b4-b9c2bd06d095&size=100";
const OUTPUT_FILE = "mapped_records.json";

// Function to fetch JSON from a URL
async function fetchJson(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch data from: ${url}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

// Main function
async function processRecords() {
  console.log(`Fetching the dataset from: ${INITIAL_API_URL}...`);
  
  const initialData = await fetchJson(INITIAL_API_URL);
  if (!initialData) {
    console.error(`Data could not be retrieved from the dataset.`);
    return;
  }

  // In case there is more data in records/{recordId} than in records/?{communityId},
  // we fetch data from the records/{recordId} endpoint
  const recordsUrls: string[] = initialData.hits?.hits
    ?.map((hit: any) => hit.links?.self)
    .filter((url: string) => !!url) || [];

  console.log(`Found ${recordsUrls.length} self links. Fetching individual records...`);

  // Process individual records using the parser
  const mappedResults = await Promise.all(
    recordsUrls.map(async (url) => {
      const recordData = await fetchJson(url);
      return recordData ? mapB2ShareToCommonDatasetMetadata(url, recordData) : null;
    })
  );

  const validRecords = mappedResults.filter((record) => record !== null);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validRecords, null, 2));

  console.log(`Processing complete. Saved ${validRecords.length} mapped records to ${OUTPUT_FILE}`);
}

// Run the script
processRecords().catch(console.error);
