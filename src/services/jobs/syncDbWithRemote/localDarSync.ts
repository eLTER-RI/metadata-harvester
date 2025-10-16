import 'dotenv/config';
import { Pool } from 'pg';
import fetch from 'node-fetch';
import { RecordDao } from '../../../store/dao/recordDao';
import { CONFIG } from '../../../../config';
import { RepositoryType } from '../../../store/commonStructure';
import { log } from '../../serviceLogging';
import { darLimiter } from '../../rateLimiterConcurrency';

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
 * This function deletes records from DAR based on the list of ids.
 * It uses a rate limiter in order to respect rate limits of DAR.
 *
 * @param {string[]} ids A list of DAR ids to be deleted.
 */
async function deleteDarRecordsByIds(ids: string[]) {
  const deletePromises = ids.map((id) => {
    return darLimiter.schedule(() => {
      const url = `${CONFIG.API_URL}/${id}`;

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
 * Fetches a list of all DAR records.
 * It uses a rate limiter in order to respect rate limits of DAR.
 * @param {string} darRepoQuery The initial URL for the DAR API query.
 * @returns {Promise<string[]>} A promise that resolves to an array of IDs of all records in DAR.
 */
async function fetchDarRecords(darRepoQuery: string): Promise<string[]> {
  const allDarIds: string[] = [];
  let url = darRepoQuery;
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

/**
 * This function compares records in the local database versus DAR records, and logs these in arrays.
 * If the `darCleanup` flag is set to true, it also deletes extra remote records.
 *
 * @param {RepositoryType} repositoryType The type of the repository to synchronize.
 * @param {Pool} pool The PostgreSQL connection pool.
 * @param {boolean} darCleanup A flag that if set to true triggers a cleanup job of DAR ids that are extra in comparison to the database.
 */
export async function syncWithDar(repositoryType: RepositoryType, pool: Pool, darCleanup: boolean): Promise<void> {
  console.log(`Starting DAR sync for repository: ${repositoryType}.`);

  let remoteDarIds: string[] = [];
  try {
    const endpoint = CONFIG.REPOSITORIES[repositoryType].darQuery;
    remoteDarIds = await fetchDarRecords(endpoint);
    log('info', `Found ${remoteDarIds.length} DAR IDs from the DAR API.`);
  } catch (error) {
    log('info', `Error fetching DAR IDs: ${error}`);
    return;
  }

  const recordDao = new RecordDao(pool);
  const localDarIds = await recordDao.listRepositoryDarIds(repositoryType);

  const remoteDarIdsSet = new Set(remoteDarIds);
  const localDarIdsSet = new Set(localDarIds);

  const extraOnRemote = remoteDarIds.filter((item) => !localDarIdsSet.has(item));
  log('warn', `Extra on remote: ` + JSON.stringify(extraOnRemote, null, 2));
  if (darCleanup) {
    log('warn', `Deleting all extra resources from Dar.`);
    deleteDarRecordsByIds(extraOnRemote);
  }
  const extraInLocal = localDarIds.filter((item) => !remoteDarIdsSet.has(item));
  log('warn', `Extra in local: ` + JSON.stringify(extraInLocal, null, 2));

  log('info', 'DAR sync process finished.');
}
