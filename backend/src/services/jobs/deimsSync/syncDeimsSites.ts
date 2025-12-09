import 'dotenv/config';
import { calculateChecksum } from '../../../utilities/checksum';
import { fetchSites } from '../../../utilities/matchDeimsId';
import { log } from '../../serviceLogging';
import { Pool } from 'pg';
import { DeimsDao } from '../../../store/dao/deimsDao';
import { deimsLimiter } from '../../rateLimiterConcurrency';

/**
 * Fetches deims sites from the source and upserts it into the local database.
 * @param {Pool} pool The PostgreSQL connection pool.
 */
export async function syncDeimsSites(pool: Pool): Promise<void> {
  console.log('Starting DEIMS site synchronization...');

  const sites = await fetchSites();
  log('info', `Syncing deims sites. Found ${sites.length} sites.\n`);
  log('info', 'Fetching deims sites.');

  let changes = 0;
  try {
    log('info', 'Database connection successful. Starting upsert operation.');

    const deimsDao = new DeimsDao(pool);
    const upsertPromises = sites.map(async (site: any) => {
      return deimsLimiter.schedule(async () => {
        if (!site.id || !site.id.suffix) {
          console.warn('Skipping site due to missing ID:', site);
          return;
        }
        const siteId = site.id.suffix;
        const siteName = site.title;
        const siteData = JSON.stringify(site);
        const checksum = calculateChecksum(siteData);

        const result = await deimsDao.upsertSite({
          id: siteId,
          name: siteName,
          shortname: site.shortName || null,
          site_data: siteData,
          checksum: checksum,
        });

        if (result.rowCount != 0) {
          changes++;
        }
      });
    });

    await Promise.all(upsertPromises);
    log('info', `Successfully upserted ${changes} DEIMS sites into the database.`);
  } catch (error) {
    log('error', 'An error occurred during DEIMS sites synchronization: ' + error);
    throw error;
  }
}
