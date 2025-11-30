import { log } from '../serviceLogging';
import { CommonDataset, RepositoryType } from '../../models/commonStructure';
import { RecordDao } from '../../store/dao/recordDao';
import { CONFIG } from '../../config/config';
import { darLimiter } from '../rateLimiterConcurrency';

interface DarApiResponse {
  hits: {
    hits: {
      id: string;
    }[];
    total: number;
  };
  links: {
    self: string;
    next?: string;
    prev?: string;
  };
}

/**
 * Sends a PUT request to the DAR API.
 * @param {string} darId The ID of the record in DAR.
 * @param {Record} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {CommonDataset} dataset Source data after mapping.
 */
export async function putToDar(darId: string, recordDao: RecordDao, sourceUrl: string, dataset: CommonDataset) {
  log('info', `PUT ${sourceUrl} to Dar record with id ${darId}.`);
  const apiResponse = await darLimiter.schedule(() =>
    fetch(`${CONFIG.API_URL}/external-datasets/${darId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: CONFIG.AUTH_TOKEN,
      },
      body: JSON.stringify(dataset, null, 2),
    }),
  );

  if (!apiResponse) {
    log('error', `PUT request ${sourceUrl} into dar failed`);
    await recordDao.updateStatus(sourceUrl, {
      status: 'failed',
    });
    return false;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `PUT request ${sourceUrl} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateStatus(sourceUrl, {
      status: 'failed',
    });
    return false;
  }

  await recordDao.updateStatus(sourceUrl, {
    status: 'success',
  });
  return true;
}

/**
 * Sends a POST request to the DAR API.
 * @param {Record} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {CommonDataset} dataset Source data after mapping.
 * @returns The ID of the newly created record in DAR, or null if the request fails.
 */
export async function postToDar(
  recordDao: RecordDao,
  sourceUrl: string,
  dataset: CommonDataset,
): Promise<string | null> {
  log('info', `Posting ${sourceUrl} to Dar.`);
  const apiResponse = await darLimiter.schedule(() =>
    fetch(`${CONFIG.API_URL}/external-datasets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: CONFIG.AUTH_TOKEN,
      },
      body: JSON.stringify(dataset, null, 2),
    }),
  );

  if (!apiResponse) {
    log('error', `Posting ${sourceUrl} into dar failed`);
    await recordDao.updateStatus(sourceUrl, {
      status: 'failed',
    });
    return null;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `Posting ${sourceUrl} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateStatus(sourceUrl, {
      status: 'failed',
    });
    return null;
  }
  const resp = await apiResponse.json();
  return resp.id;
}

/**
 * Sends a request to the DAR API (shared logic for POST/PUT).
 * @param {string} url The full URL to request
 * @param {string} method HTTP method (POST, PUT, etc.)
 * @param {any} data The data to send (will be JSON stringified)
 * @param {string} logContext Context for logging (e.g., "manual record", "record abc123")
 * @returns The response object, or null if the request failed
 */
async function sendDarRequest(
  url: string,
  method: 'POST' | 'PUT',
  data: any,
  logContext: string,
): Promise<Response | null> {
  log('info', `${method} ${logContext} to Dar.`);
  const apiResponse = await darLimiter.schedule(() =>
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: CONFIG.AUTH_TOKEN,
      },
      body: JSON.stringify(data, null, 2),
    }),
  );

  if (!apiResponse) {
    log('error', `${method} request ${logContext} into dar failed`);
    return null;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `${method} request ${logContext} into dar failed with : ${apiResponse.status}: ${responseText}`);
    return null;
  }

  return apiResponse;
}

/**
 * Sends a POST request to the DAR API for manually created records.
 * @param {any} data The data to send (will be JSON stringified)
 * @returns The ID of the newly created record in DAR, or null if the request fails.
 */
export async function postToDarManual(data: any): Promise<string | null> {
  const response = await sendDarRequest(`${CONFIG.API_URL}/external-datasets`, 'POST', data, 'manual record');
  if (!response) {
    return null;
  }
  const resp = await response.json();
  return resp.id;
}

/**
 * Sends a PUT request to the DAR API for manually created records.
 * @param {string} darId The ID of the record in DAR.
 * @param {any} data The data to send (will be JSON stringified)
 * @returns true if successful, false otherwise.
 */
export async function putToDarManual(darId: string, data: any): Promise<boolean> {
  const response = await sendDarRequest(
    `${CONFIG.API_URL}/external-datasets/${darId}`,
    'PUT',
    data,
    `manual record ${darId}`,
  );
  if (!response) {
    return false;
  }
  log('info', `Successfully updated manual record ${darId} in DAR`);
  return true;
}

/**
 * This function deletes records from DAR based on the list of ids.
 * It uses a rate limiter in order to respect rate limits of DAR.
 *
 * @param {string[]} ids A list of DAR ids to be deleted.
 */
export async function deleteDarRecordsByIds(ids: string[]) {
  const deletePromises = ids.map((id) => {
    return darLimiter.schedule(() => {
      const url = `${CONFIG.API_URL}/external-datasets/${id}`;

      log('info', `Starting with deletion of a record with ID: ${id}`);

      return fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: CONFIG.AUTH_TOKEN,
        },
      }).then((response) => {
        if (!response.ok) {
          const errorMessage = `
          Error deleting record with id ${id}.
          Request failed with status: ${response.status} ${response.statusText}
          URL: ${response.url}
        `;
          throw new Error(errorMessage);
        }
        log('info', `Successfully deleted a record with ID: ${id}`);
      });
    });
  });

  try {
    const results = await Promise.allSettled(deletePromises);

    const rejectedPromises = results.filter((result) => result.status === 'rejected');
    if (rejectedPromises.length > 0) {
      log('error', 'The following delete operations failed:');
      rejectedPromises.forEach((rejection) => {
        console.error(rejection.reason);
      });
    }
  } catch (error) {
    log('error', 'An unexpected error occurred during the batch delete operation: ' + error);
  }
}

/**
 * Constructs a search URL for the Data Registry (DAR) API to find a record by its external source URI.
 *
 * @param {string} externalSourceURI externalSourceURI used in the record's externalSourceInformation field in DAR.
 *
 * @returns {string} URL for querying for filtering based on externalSourceURI
 */
function getUrlWithExternalSourceURIQuery(externalSourceURI: string): string {
  const encodedURI = encodeURIComponent(externalSourceURI);
  return `${CONFIG.API_URL}/external-datasets?q=&metadata_externalSourceInformation_externalSourceURI=${encodedURI}`;
}

/**
 * Searches DAR for a record by its source URL.
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @returns {string | null} The ID of the matching record in DAR, null if no record found.
 */
export async function findDarRecordBySourceURL(sourceUrl: string): Promise<string | null> {
  const response = await darLimiter.schedule(() =>
    fetch(getUrlWithExternalSourceURIQuery(sourceUrl), {
      method: 'GET',
      headers: { Authorization: CONFIG.AUTH_TOKEN, Accept: 'application/json' },
    }),
  );

  const searchResult: DarApiResponse = (await response.json()) as DarApiResponse;
  if (searchResult?.hits?.hits?.length > 0 && searchResult.hits.hits[0]?.id) {
    return searchResult.hits.hits[0].id;
  }
  return null;
}

/**
 * Fetches a list of DAR records by repository.
 * It uses a rate limiter in order to respect rate limits of DAR.
 * @param {RepositoryType} repository Source repository of records to fetch.
 * @returns {Promise<string[]>} A promise that resolves to an array of IDs of all records in DAR.
 */
export async function fetchDarRecordsByRepository(repository: RepositoryType): Promise<string[]> {
  const allDarIds: string[] = [];
  let url = CONFIG.REPOSITORIES[repository].darQuery;
  while (true) {
    await darLimiter.schedule(async () => {
      log('info', `Fetching DAR records from: ${url}`);

      try {
        const response = await fetch(`${url}`, {
          method: 'GET',
          headers: {
            Authorization: CONFIG.AUTH_TOKEN,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          log('info', `Error fetching DAR records: ${response.status} ${response.statusText}`);
          url = '';
        }

        const data: DarApiResponse = (await response.json()) as DarApiResponse;
        const darIds = data?.hits?.hits?.map((record) => record?.id);
        const next = data?.links?.next;
        if (darIds) allDarIds.push(...darIds);
        if (!next) {
          url = '';
        } else {
          url = next;
        }
      } catch (error) {
        log('error', `Network error fetching from DAR: ${error}`);
        url = '';
      }
    });
    if (!url) break;
  }
  return allDarIds;
}
