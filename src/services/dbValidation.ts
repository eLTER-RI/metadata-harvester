import { Pool } from 'pg';
import { RepositoryType } from '../store/commonStructure';
import { log } from './serviceLogging';
import { RecordDao } from '../store/recordDao';
import { processOneRecordTask, processOneSitesRecord } from './harvester';
import { fetchSites } from '../utilities/matchDeimsId';
import { fieldSitesLimiter, zenodoLimiter } from './rateLimiterConcurrency';

// for example, for zenodo, we can find out if it "is_last" - if it is, just upsert and put
// if it's not, fetch versions, get latest, and run it for it

// we can even just set all checksums to null, change the source_url, keep dar_id, and that's it

// obalit tohle cely do transakce

/**
 * This function validates the records present in the local database against the source.
 * It checks if the source URLs are still valid and if the source data has changed by comparing checksums.
 * @param {Pool} pool The PostgreSQL connection pool.
 * @param {RepositoryType} repositoryType The type of the repository to validate.
 */
export async function dbValidationPhase(pool: Pool, repositoryType: RepositoryType) {
  const recordDao = new RecordDao(pool);
  const dbRecords = await recordDao.listRecordsByRepository(repositoryType);
  log('info', `Validation of database data for ${repositoryType}. Found ${dbRecords.length} records in the database.`);
  const sites = await fetchSites();
  await Promise.all(
    dbRecords.map(async (dbRecord) => {
      if (dbRecord.source_repository === 'SITES') {
        return fieldSitesLimiter.schedule(async () => {
          await processOneSitesRecord(dbRecord.source_url, recordDao);
        });
      }
      if (repositoryType === 'ZENODO' || repositoryType === 'ZENODO_IT') {
        if (dbRecord.source_url)
          return zenodoLimiter.schedule(() =>
            processOneRecordTask(dbRecord.source_url, recordDao, sites, repositoryType),
          );
      }
      return processOneRecordTask(dbRecord.source_url, recordDao, sites, repositoryType);
    }),
  );
}
