import { Pool, QueryResult } from 'pg';

export interface DeimsSiteDbRecord {
  id: string;
  site_data: any;
  name: string;
  shortname?: string;
  checksum: string;
}

export interface DeimsSiteLookup {
  siteID: string;
  siteName: string;
  siteData: any;
}

export class DeimsDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async upsertSite(site: DeimsSiteDbRecord): Promise<QueryResult<any>> {
    const query = `
      INSERT INTO deims_sites (id, name, shortname, site_data, checksum)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        shortname = EXCLUDED.shortname,
        site_data = EXCLUDED.site_data,
        checksum = EXCLUDED.checksum
      WHERE deims_sites.checksum != EXCLUDED.checksum;
  `;
    const values = [site.id, site.name, site.shortname || null, JSON.stringify(site.site_data), site.checksum];
    return await this.pool.query(query, values);
  }

  async getSitesForLookup(): Promise<DeimsSiteLookup[]> {
    const query = `
      SELECT id, name, site_data
      FROM deims_sites;
    `;
    const result: QueryResult<{ id: string; name: string; site_data: any }> = await this.pool.query(query);

    return result.rows.map((row) => ({
      siteID: row.id,
      siteName: row.name,
      siteData: row.site_data,
    }));
  }
}
