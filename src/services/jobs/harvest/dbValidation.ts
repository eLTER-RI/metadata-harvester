import { log } from './../../serviceLogging';
import { HarvesterContext } from './harvester';
import { fieldSitesLimiter, zenodoLimiter } from './../../rateLimiterConcurrency';

// for example, for zenodo, we can find out if it "is_last" - if it is, just upsert and put
// if it's not, fetch versions, get latest, and run it for it

// we can even just set all checksums to null, change the source_url, keep dar_id, and that's it

// obalit tohle cely do transakce

/**
 * This function validates the records present in the local database against the source.
 * It checks if the source URLs are still valid and if the source data has changed by comparing checksums.
 * @param {HarvesterContext} ctx Context of the job.
 */
export async function dbValidationPhase(ctx: HarvesterContext) {
  const { recordDao, repositoryType } = ctx;
  const dbRecords = await recordDao.listRecordsByRepository(repositoryType);
  log('info', `Validation of database data for ${repositoryType}. Found ${dbRecords.length} records in the database.`);
  await Promise.all(
    dbRecords.map(async (dbRecord) => {
      if (dbRecord.source_repository === 'SITES') {
        return fieldSitesLimiter.schedule(async () => {
          await ctx.processOneSitesRecord(dbRecord.source_url);
        });
      }
      if (repositoryType === 'ZENODO' || repositoryType === 'ZENODO_IT') {
        if (dbRecord.source_url) return zenodoLimiter.schedule(() => ctx.processOneRecordTask(dbRecord.source_url));
      }
      return ctx.processOneRecordTask(dbRecord.source_url);
    }),
  );
}
