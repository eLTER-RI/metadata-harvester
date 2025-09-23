import { API_URL, AUTH_TOKEN } from '../src/services/jobs/harvest/harvester';
import { log } from '../src/services/serviceLogging';
import { CommonDataset } from '../src/store/commonStructure';
import { RecordDao } from '../src/store/dao/recordDao';

/**
 * Sends a PUT request to the DAR API.
 * @param {string} darId The ID of the record in DAR.
 * @param {Record} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {CommonDataset} dataset Source data after mapping.
 */
export async function putToDar(darId: string, recordDao: RecordDao, sourceUrl: string, dataset: CommonDataset) {
  log('info', `PUT ${sourceUrl} to Dar record with id ${darId}.`);
  const apiResponse = await fetch(`${API_URL}/${darId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

  if (!apiResponse) {
    log('error', `PUT request ${sourceUrl} into dar failed`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `PUT request ${sourceUrl} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateDarIdStatus(sourceUrl, {
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
  const apiResponse = await fetch(API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    body: JSON.stringify(dataset, null, 2),
  });

  if (!apiResponse) {
    log('error', `Posting ${sourceUrl} into dar failed`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      dar_id: '',
      status: 'failed',
    });
    return null;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `Posting ${sourceUrl} into dar failed with : ${apiResponse.status}: ${responseText}`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      dar_id: '',
      status: 'failed',
    });
    return null;
  }
  const resp = await apiResponse.json();
  return resp.id;
}
