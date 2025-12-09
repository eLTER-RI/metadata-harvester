import 'dotenv/config';
import { Pool } from 'pg';
import { RecordDao } from '../../../store/dao/recordDao';
import { RepositoryType } from '../../../models/commonStructure';
import { log } from '../../serviceLogging';
import { deleteDarRecordsByIds, fetchDarRecordsByRepository } from '../../clients/darApi';

/**
 * This function compares records in the local database versus DAR records, and logs these in arrays.
 * If the `darCleanup` flag is set to true, it also deletes extra remote records.
 * This functionality can be used for a manual checks. Due to the nature of `at-least-once` mechanism for
 * DAR updates, it might happen that DAR includes more records than the local database.
 * @param {RepositoryType} repositoryType The type of the repository to synchronize.
 * @param {Pool} pool The PostgreSQL connection pool.
 * @param {boolean} darCleanup A flag that if set to true triggers a cleanup job of DAR ids that are extra in comparison to the database.
 */
export async function syncWithDar(repositoryType: RepositoryType, pool: Pool, darCleanup: boolean): Promise<void> {
  log('info', `Starting DAR sync for repository: ${repositoryType}.`);

  let remoteDarIds: string[] = [];
  try {
    remoteDarIds = await fetchDarRecordsByRepository(repositoryType);
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
  if (darCleanup && extraOnRemote.length > 0) {
    log('warn', `Deleting all extra resources from Dar.`);
    deleteDarRecordsByIds(extraOnRemote);
  }
  const extraInLocal = localDarIds.filter((item) => !remoteDarIdsSet.has(item));
  log('warn', `Extra in local: ` + JSON.stringify(extraInLocal, null, 2));

  log('info', 'DAR sync process finished.');
}
