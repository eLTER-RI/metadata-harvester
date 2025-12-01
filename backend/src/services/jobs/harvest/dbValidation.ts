import { log } from './../../serviceLogging';
import { HarvesterContext } from './harvester';
import { b2shareLimiter, fieldSitesLimiter, zenodoLimiter } from './../../rateLimiterConcurrency';

/**
 * This function validates the records present in the local database against the source.
 * It checks if the source URLs are still valid and if the source data has changed by comparing checksums.
 * This function skips validation of B2SHARE records.
 * @param {HarvesterContext} ctx Context of the job.
 */
export async function dbValidationPhase(ctx: HarvesterContext) {
  const { recordDao, repositoryType } = ctx;
  const dbRecords = await recordDao.listRecordsByRepository(repositoryType);
  log('info', `Validation of database data for ${repositoryType}. Found ${dbRecords.length} records in the database.`);
  await Promise.all(
    dbRecords.map(async (dbRecord) => {
      const existingDbRecord = [dbRecord];
      if (repositoryType === 'SITES') {
        return fieldSitesLimiter.schedule(async () => {
          await ctx.processOneRecordTask(dbRecord.source_url, existingDbRecord);
        });
      }
      if (repositoryType === 'ZENODO' || repositoryType === 'ZENODO_IT') {
        if (dbRecord.source_url)
          return zenodoLimiter.schedule(() => ctx.processOneRecordTask(dbRecord.source_url, existingDbRecord));
      }
      if (repositoryType === 'B2SHARE_EUDAT' || repositoryType === 'B2SHARE_JUELICH') {
        return b2shareLimiter.schedule(() => ctx.processOneRecordTask(dbRecord.source_url, existingDbRecord));
      }
      return ctx.processOneRecordTask(dbRecord.source_url, existingDbRecord);
    }),
  );
}
