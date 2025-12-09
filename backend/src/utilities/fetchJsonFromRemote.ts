import fetch from 'node-fetch';
import { CONFIG } from '../config/config';
import { JSDOM } from 'jsdom';
import { log } from '../services/serviceLogging';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 20000;

// Function to fetch JSON from a URL with retries and a linear back-off
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
        log('info', `Received 429 Too Many Requests for ${url}. Retrying...\n`);
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
        errorBody = `Could not parse response body: ${e}`;
      }

      const errorMessage = `
        Error fetching ${url}: Request failed with status: ${response.status} ${response.statusText}
        URL: ${response.url}
        Response Body: ${errorBody}
      `;

      log('error', errorMessage);
      return null;
    }
    return await response.json();
  } catch (error) {
    log('error', `A network error occurred while fetching ${url}: ${error}`);
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
    log('error', `Error fetching XML from ${url}: ${error}`);
    return null;
  }
}
