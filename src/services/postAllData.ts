import 'dotenv/config';
import * as fs from 'fs';
import fetch, { Response, RequestInit } from 'node-fetch';
import { CommonDataset } from '../store/commonStructure';
import { CONFIG } from '../../config';

// Configurations
const currentEnv = process.env.NODE_ENV;
if (currentEnv !== 'prod' && currentEnv !== 'dev') {
  throw new Error(`NODE_ENV must be set to 'prod' or 'dev'`);
}

const API_URL = currentEnv === 'prod' ? process.env.PROD_API_URL : process.env.DEV_API_URL;

const AUTH_TOKEN =
  currentEnv === 'prod' ? 'Bearer ' + process.env.PROD_AUTH_TOKEN : 'Bearer ' + process.env.DEV_AUTH_TOKEN;

if (!API_URL || !AUTH_TOKEN) {
  throw new Error(
    `API_URL or AUTH_TOKEN undefined, env: '${currentEnv}'.
    Check the .env file and set environments correctly.`,
  );
}

// Load JSON records
const records = JSON.parse(fs.readFileSync(CONFIG.B2SHARE_MAPPED_RECORDS, 'utf-8'));
const failedResponses: FailedResponseInfo[] = [];

interface FailedResponseInfo {
  index: number;
  payload: string;
  response: string;
  attemptedAction: 'POST' | 'PUT' | 'SEARCH';
  recordIdentifier?: string;
}

interface SearchOperationOutcome {
  existingId: string | null;
  action: 'POST' | 'PUT';
}

async function performFetch(url: string, options: RequestInit, actionName: string): Promise<Response | null> {
  try {
    process.stdout.write(`Starting ${actionName} request to: ${url}\n`);
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error during ${actionName} to ${url}: ${errorMessage}\n`);
    return null;
  }
}

async function handleSearchApiResponse(
  response: Response,
  externalSourceURI: string,
  index: number,
  failedResponsesRef: FailedResponseInfo[],
): Promise<SearchOperationOutcome> {
  if (!response.ok) {
    const responseText = await response.text().catch(() => 'Could not read error response text.');
    process.stdout.write(
      `Search request for URI "${externalSourceURI}" failed with HTTP status ${response.status}: ${responseText}\n`,
    );
    failedResponsesRef.push({
      index,
      payload: `Search for: ${externalSourceURI}`,
      response: `Search Failed (HTTP ${response.status}): ${responseText}`,
      attemptedAction: 'SEARCH',
      recordIdentifier: externalSourceURI,
    });
    return { existingId: null, action: 'POST' };
  }

  try {
    const searchResult = (await response.json()) as any;
    if (searchResult?.hits?.hits?.length > 0 && searchResult.hits.hits[0]?.id) {
      process.stdout.write(
        `Existing record found via search. ID: ${searchResult.hits.hits[0].id}. Action set to PUT (update).\n`,
      );
      return { existingId: searchResult.hits.hits[0].id, action: 'PUT' };
    } else {
      process.stdout.write('No existing record found via search. Action remains POST (create).\n');
      return { existingId: null, action: 'POST' };
    }
  } catch (jsonError) {
    const errorMsg = jsonError instanceof Error ? jsonError.message : String(jsonError);
    process.stderr.write(
      `Error parsing JSON from successful search response for URI "${externalSourceURI}": ${errorMsg}\n`,
    );
    const responseText = await response.text().catch(() => 'Could not read response text after JSON parse error.');
    failedResponsesRef.push({
      index,
      payload: `Search for: ${externalSourceURI}`,
      response: `Search JSON Parse Error: ${errorMsg}. Response Text: ${responseText}`,
      attemptedAction: 'SEARCH',
      recordIdentifier: externalSourceURI,
    });
    return { existingId: null, action: 'POST' };
  }
}

function getSearchUrl(externalSourceURI: string): string {
  const encodedURI = encodeURIComponent(externalSourceURI);
  return `${API_URL}?q=&metadata_externalSourceInformation_externalSourceURI=${encodedURI}`;
}

async function searchInDarHandler(
  record: CommonDataset,
  index: number,
  failedResponsesRef: FailedResponseInfo[],
): Promise<SearchOperationOutcome> {
  const externalSourceURI = record?.metadata?.externalSourceInformation?.externalSourceURI;
  const existingId: string | null = null;
  const action: 'POST' | 'PUT' = 'POST';

  if (!externalSourceURI) {
    process.stdout.write('No externalSourceURI found in metadata. Defaulting to POST (create).\n');
    return { existingId, action };
  }

  process.stdout.write(
    `Record has externalSourceURI: "${externalSourceURI}". Attempting to find existing record via search.\n`,
  );
  const searchUrl = getSearchUrl(externalSourceURI);

  const searchResponse = await performFetch(
    searchUrl,
    {
      method: 'GET',
      headers: { Authorization: AUTH_TOKEN, Accept: 'application/json' },
    },
    'SEARCH',
  );

  if (!searchResponse) {
    failedResponsesRef.push({
      index,
      payload: `Search for: ${externalSourceURI}`,
      response: `Search Network Error (fetch call failed)`,
      attemptedAction: 'SEARCH',
      recordIdentifier: externalSourceURI,
    });
    process.stdout.write(
      'Due to network error during search, proceeding as if record not found (will attempt POST).\n',
    );
    return { existingId, action };
  }

  return handleSearchApiResponse(searchResponse, externalSourceURI, index, failedResponsesRef);
}

async function dataSubmissionHandler(
  action: 'POST' | 'PUT',
  payload: string,
  existingId: string | null,
  index: number,
  failedResponsesRef: FailedResponseInfo[],
  externalSourceURI?: string,
): Promise<void> {
  if (action === 'PUT' && !existingId) {
    process.stderr.write(`Error: PUT for record index ${index}, record does not exist in DAR. Skipping.\n`);
    failedResponsesRef.push({
      index,
      payload,
      response: 'PUT intended, record does not exist in DAR.',
      attemptedAction: 'PUT',
      recordIdentifier: externalSourceURI,
    });
    return;
  }

  const httpMethod = action === 'POST' ? API_URL || '' : `${API_URL}/${existingId}`;
  const apiResponse = await performFetch(
    httpMethod,
    {
      method: action,
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_TOKEN,
      },
      body: payload,
    },
    action,
  );

  if (!apiResponse) {
    process.stderr.write(`Error during ${action} for record index ${index}.\n`);
    failedResponsesRef.push({
      index,
      payload,
      response: `${action} fetch call failed`,
      attemptedAction: action,
      recordIdentifier: action === 'PUT' && existingId ? existingId : externalSourceURI,
    });
    return;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    process.stderr.write(`
      ${action} request for record index ${index} failed: ${apiResponse.status}: ${responseText}\n
    `);
    failedResponsesRef.push({
      index,
      payload,
      response: `${action} Failed (HTTP ${apiResponse.status}): ${responseText}`,
      attemptedAction: action,
      recordIdentifier: action === 'PUT' && existingId ? existingId : externalSourceURI,
    });
    return;
  }

  process.stdout.write(`
    ${action} request for record index ${index} succeeded.\n`);
}

const sendRequests = async () => {
  for (const [index, record] of records.entries()) {
    process.stdout.write(`\nIteration: ${index}\n`);
    const payload = JSON.stringify(record, null, 2);
    const externalSourceURI = record?.metadata?.externalSourceInformation?.externalSourceURI;

    const searchOutcome = await searchInDarHandler(record, index, failedResponses);
    await dataSubmissionHandler(
      searchOutcome.action,
      payload,
      searchOutcome.existingId,
      index,
      failedResponses,
      externalSourceURI,
    );
  }

  // Logging failed reponses into failed_responses.json
  if (failedResponses.length > 0) {
    const logFileName = `failed_responses_${currentEnv}_${Date.now()}.json`;
    const logFilePath = `./logs/${logFileName}`;
    process.stderr.write(
      '❌ Some requests ' +
        failedResponses.length +
        '/' +
        records.length +
        ' failed:\n' +
        JSON.stringify(failedResponses, null, 2) +
        '\n',
    );
    fs.writeFileSync(logFilePath, JSON.stringify(failedResponses, null, 2));
  } else {
    process.stdout.write('✅ All requests succeeded!');
  }
};

sendRequests().catch(process.stderr.write);
