import { log } from '../serviceLogging';
import { CommonDataset } from '../../store/commonStructure';
import { RecordDao } from '../../store/dao/recordDao';
import { CONFIG } from '../../../config';

/**
 * Sends a PUT request to the DAR API.
 * @param {string} darId The ID of the record in DAR.
 * @param {Record} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {CommonDataset} dataset Source data after mapping.
 */
export async function putToDar(darId: string, recordDao: RecordDao, sourceUrl: string, dataset: CommonDataset) {
  log('info', `PUT ${sourceUrl} to Dar record with id ${darId}.`);
  const apiResponse = await fetch(`${CONFIG.API_URL}/${darId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: CONFIG.AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

  if (!apiResponse) {
    log('error', `PUT request ${sourceUrl} into dar failed`);
    await recordDao.updateStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `PUT request ${sourceUrl} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  await recordDao.updateStatus(sourceUrl, {
    status: 'success',
  });
  return;
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
  const apiResponse = await fetch(CONFIG.API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: CONFIG.AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

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
 * Constructs a search URL for the Data Registry (DAR) API to find a record by its external source URI.
 *
 * @param {string} externalSourceURI externalSourceURI used in the record's externalSourceInformation field in DAR.
 *
 * @returns {string} URL for querying for filtering based on externalSourceURI
 */
function getUrlWithExternalSourceURIQuery(externalSourceURI: string): string {
  const encodedURI = encodeURIComponent(externalSourceURI);
  return `${CONFIG.API_URL}?q=&metadata_externalSourceInformation_externalSourceURI=${encodedURI}`;
}

/**
 * Searches DAR for a record by its source URL.
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @returns {string | null} The ID of the matching record in DAR, null if no record found.
 */
export async function findDarRecordBySourceURL(sourceUrl: string): Promise<string | null> {
  const response = await fetch(getUrlWithExternalSourceURIQuery(sourceUrl), {
    method: 'GET',
    headers: { Authorization: CONFIG.AUTH_TOKEN, Accept: 'application/json' },
  });

  const searchResult = (await response.json()) as any;
  if (searchResult?.hits?.hits?.length > 0 && searchResult.hits.hits[0]?.id) {
    return searchResult.hits.hits[0].id;
  }
  return null;
}
