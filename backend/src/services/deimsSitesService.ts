import { Pool } from 'pg';
import { DeimsDao, DeimsSiteLookup } from '../store/dao/deimsDao';
import { log } from './serviceLogging';

export interface GetDeimsSitesResult {
  success: boolean;
  sites?: DeimsSiteLookup[];
  error?: string;
  statusCode?: number;
}

/**
 * Fetch all DEIMS sites.
 * @param {Pool} pool Database connection pool.
 * @returns {Promise<GetDeimsSitesResult>} Result object.
 */
export async function getDeimsSites(pool: Pool): Promise<GetDeimsSitesResult> {
  try {
    const deimsDao = new DeimsDao(pool);
    const sites = await deimsDao.getSitesForLookup();

    if (!sites || sites.length === 0) {
      log('info', 'No DEIMS sites found in database. Sync sites.');
      return {
        success: true,
        sites: [],
      };
    }

    log('info', `Found ${sites.length} DEIMS sites for lookup.`);
    return {
      success: true,
      sites,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    log('error', `Failed to find DEIMS sites in database: ${errorMessage}`);
    return {
      success: false,
      error: 'Failed to find DEIMS sites in database.',
      statusCode: 500,
    };
  }
}
