import 'dotenv/config';
import { Pool } from 'pg';
import fetch from 'node-fetch';
import { RecordDao } from '../src/store/recordDao';
import { RateLimiter } from '../src/services/rateLimiter';
import { CONFIG } from '../config';
import { RepositoryType } from '../src/store/commonStructure';
import { log } from '../src/services/serviceLogging';

const AUTH_TOKEN = process.env.PROD_AUTH_TOKEN || process.env.DEV_AUTH_TOKEN;

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

async function fetchDarRecords(darRepoQuery: string): Promise<string[]> {
  const allDarIds: string[] = [];
  const rateLimiter = new RateLimiter(100);
  let url = darRepoQuery;
  while (true) {
    await rateLimiter.waitForRequest();
    log('info', `Fetching DAR records from: ${url}`);

    try {
      const response = await fetch(`${url}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        log('info', `Error fetching DAR records: ${response.status} ${response.statusText}`);
        break;
      }

      const data: DarApiResponse = (await response.json()) as DarApiResponse;
      const darIds = data?.hits?.hits?.map((record) => record?.id);
      const next = data?.links?.next;
      if (darIds) allDarIds.push(...darIds);
      log('info', 'pushed new stuff');
      if (!next) break;
      url = next;
    } catch (error) {
      log('error', `Network error fetching from DAR: ${error}`);
      break;
    }
  }

  return allDarIds;
}

export async function syncWithDar(repositoryType: RepositoryType, pool: Pool): Promise<void> {
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
  const extraInLocal = localDarIds.filter((item) => !remoteDarIdsSet.has(item));

  log('warn', `Extra on remote: ` + JSON.stringify(extraOnRemote, null, 2));
  log('warn', `Extra in local: ` + JSON.stringify(extraInLocal, null, 2));

  log('info', 'DAR sync process finished.');
}
