import 'dotenv/config';
import * as fs from 'fs';
import fetch from 'node-fetch';

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
const failedResponses: { index: number; payload: string; response: string }[] =
  [];

const sendRequests = async () => {
  for (const [index, record] of records.entries()) {
    process.stdout.write(`Iteration: ${index}`);
    const payload = JSON.stringify(record, null, 2);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_TOKEN,
        },
        body: payload,
      });

      if (!response.ok) {
        const responseText = await response.text();
        process.stderr.write('Failed: ' + responseText);
        failedResponses.push({ index, payload, response: responseText });
      }
    } catch (error) {
      if (error instanceof Error) {
        process.stderr.write('Failed: ' + error.message);
      }
      failedResponses.push({ index, payload, response: `Error: ${error}` });
    }
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
