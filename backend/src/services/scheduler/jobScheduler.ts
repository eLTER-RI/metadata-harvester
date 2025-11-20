import cron from 'node-cron';
import { Pool } from 'pg';
import { log } from '../serviceLogging';
import { HarvesterContext, startRepositorySync } from '../jobs/harvest/harvester';
import { syncDeimsSites } from '../jobs/deimsSync/syncDeimsSites';
import { RepositoryType } from '../../models/commonStructure';
import { CONFIG } from '../../config/config';

/**
 * Schedules all recurring jobs.
 * @param {Pool} pool Database connection pool.
 */
export function initializeScheduler(pool: Pool): void {
  log('info', 'Initializing job scheduler');

  const cronOptions = {
    scheduled: true,
    timezone: 'UTC',
  };

  // DEIMS sites: daily at 1 AM UTC
  cron.schedule(
    '0 2 * * *',
    () => {
      log('info', 'Scheduled DEIMS sites sync started');
      syncDeimsSites(pool).catch((error) => {
        log('error', `DEIMS sync failed: ${error}`);
      });
    },
    cronOptions,
  );

  // Harvesting: daily 2 AM UTC, repos by 30 minutes
  const repositories = Object.keys(CONFIG.REPOSITORIES) as RepositoryType[];
  repositories.forEach((repo, i) => {
    const totalMinutes = i * 30;
    const hour = 3 + Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    cron.schedule(
      `${minute} ${hour} * * *`,
      () => {
        log('info', `Scheduled harvest of ${repo} started`);
        HarvesterContext.create(pool, repo, true)
          .then(startRepositorySync)
          .catch((e) => log('error', `Harvesting ${repo} failed: ${e}`));
      },
      cronOptions,
    );
  });

  log('info', 'Job scheduler initialized');
}
