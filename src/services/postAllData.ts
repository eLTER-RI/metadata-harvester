import 'dotenv/config';
import * as fs from 'fs';
import fetch, { Response, RequestInit } from 'node-fetch';

// Configurations
const INPUT_FILE = 'mapped_records.json';
const currentEnv = process.env.NODE_ENV;
if (currentEnv !== 'prod' && currentEnv !== 'dev') {
  throw new Error(`NODE_ENV must be set to 'prod' or 'dev'`);
}

const API_URL =
  currentEnv === 'prod' ? process.env.PROD_API_URL : process.env.DEV_API_URL;

const AUTH_TOKEN =
  currentEnv === 'prod'
    ? 'Bearer ' + process.env.PROD_AUTH_TOKEN
    : 'Bearer ' + process.env.DEV_AUTH_TOKEN;

if (!API_URL || !AUTH_TOKEN) {
  throw new Error(
    `API_URL or AUTH_TOKEN undefined, env: '${currentEnv}'.
    Check the .env file and set environments correctly.`,
  );
}

// Load JSON records
const records = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
const failedResponses: FailedResponseInfo[] = [];

interface FailedResponseInfo {
  index: number;
  payload: string;
  response: string;
  attemptedAction: 'POST' | 'PUT' | 'SEARCH';
  recordIdentifier?: string;
}

async function performFetch(
  url: string,
  options: RequestInit,
  actionName: string
): Promise<Response | null> {
  try {
    process.stdout.write(`Starting ${actionName} request to: ${url}`);
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error during ${actionName} to ${url}: ${errorMessage}`);
    return null;
  }
}


const sendRequests = async () => {
  for (const [index, record] of records.entries()) {
    process.stdout.write(`Iteration: ${index}`);
    const payload = JSON.stringify(record, null, 2);

    const apiResponse = await performFetch(
      API_URL,
      {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: AUTH_TOKEN },
          body: payload,
      },
      'POST'
  );
    
  }

  // Logging failed reponses into failed_responses.json
  if (failedResponses.length > 0) {
    process.stderr.write(
      '❌ Some requests ' +
        failedResponses.length +
        '/' +
        records.length +
        ' failed:\n' +
        JSON.stringify(failedResponses, null, 2) +
        '\n',
    );
    fs.writeFileSync(
      'failed_responses.json',
      JSON.stringify(failedResponses, null, 2),
    );
  } else {
    process.stdout.write('✅ All requests succeeded!');
  }
};

sendRequests().catch(process.stderr.write);
