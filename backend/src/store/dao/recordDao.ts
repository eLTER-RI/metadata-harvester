import { Pool } from 'pg';
import { RepositoryType, SiteReference, HabitatReference, DatasetType, Keywords } from '../../models/commonStructure';

export interface DbRecord {
  source_url: string;
  source_repository: string;
  source_checksum: string;
  dar_id: string;
  dar_checksum: string;
  status: string;
  last_harvested: Date;
  title: string | null;
  last_seen_at?: Date;
  site_references: SiteReference[];
  habitat_references: HabitatReference[];
  dataset_type: DatasetType | null;
  keywords: Keywords[];
}

export class RecordDao {
  public pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRecord(record: Omit<DbRecord, 'last_harvested'>): Promise<void> {
    const query = `
      INSERT INTO harvested_records (
        source_url, source_repository, source_checksum, dar_id, dar_checksum, status, last_harvested, title, last_seen_at,
        site_references, habitat_references, dataset_type, keywords
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), $8, $9, $10, $11)
    `;
    const values = [
      record.source_url,
      record.source_repository,
      record.source_checksum,
      record.dar_id,
      record.dar_checksum,
      record.status,
      record.title,
      record.site_references ? JSON.stringify(record.site_references) : null,
      record.habitat_references ? JSON.stringify(record.habitat_references) : null,
      record.dataset_type ? JSON.stringify(record.dataset_type) : null,
      record.keywords ? JSON.stringify(record.keywords) : null,
    ];
    await this.pool.query(query, values);
  }

  async updateRecord(source_url: string, record: Partial<DbRecord>): Promise<void> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (record.source_repository !== undefined) {
      setParts.push(`source_repository = $${paramCount++}`);
      values.push(record.source_repository);
    }
    if (record.source_checksum !== undefined) {
      setParts.push(`source_checksum = $${paramCount++}`);
      values.push(record.source_checksum);
    }
    if (record.dar_id !== undefined) {
      setParts.push(`dar_id = $${paramCount++}`);
      values.push(record.dar_id);
    }
    if (record.dar_checksum !== undefined) {
      setParts.push(`dar_checksum = $${paramCount++}`);
      values.push(record.dar_checksum);
    }
    if (record.status !== undefined) {
      setParts.push(`status = $${paramCount++}`);
      values.push(record.status);
    }
    if (record.title !== undefined) {
      setParts.push(`title = $${paramCount++}`);
      values.push(record.title);
    }
    if (record.site_references !== undefined) {
      setParts.push(`site_references = $${paramCount++}`);
      values.push(record.site_references ? JSON.stringify(record.site_references) : null);
    }
    if (record.habitat_references !== undefined) {
      setParts.push(`habitat_references = $${paramCount++}`);
      values.push(record.habitat_references ? JSON.stringify(record.habitat_references) : null);
    }
    if (record.dataset_type !== undefined) {
      setParts.push(`dataset_type = $${paramCount++}`);
      values.push(record.dataset_type ? JSON.stringify(record.dataset_type) : null);
    }
    if (record.keywords !== undefined) {
      setParts.push(`keywords = $${paramCount++}`);
      values.push(record.keywords ? JSON.stringify(record.keywords) : null);
    }

    setParts.push(`last_harvested = NOW()`);
    setParts.push(`last_seen_at = NOW()`);

    values.push(source_url);
    const query = `
      UPDATE harvested_records
      SET ${setParts.join(', ')}
      WHERE source_url = $${paramCount}
    `;
    await this.pool.query(query, values);
  }

  async updateDarIdStatus(source_url: string, record: Partial<DbRecord>): Promise<void> {
    const query = `
      UPDATE harvested_records
      SET dar_id = $2, status = $3
      WHERE source_url = $1
    `;
    const values = [source_url, record.dar_id, record.status];
    await this.pool.query(query, values);
  }

  async updateStatus(source_url: string, record: Partial<DbRecord>): Promise<void> {
    if (record.status === 'success') {
      const query = `
        UPDATE harvested_records
        SET status = $2, last_seen_at = NOW()
        WHERE source_url = $1
      `;
      const values = [source_url, record.status];
      await this.pool.query(query, values);
    } else {
      const query = `
        UPDATE harvested_records
        SET status = $2
        WHERE source_url = $1
      `;
      const values = [source_url, record.status];
      await this.pool.query(query, values);
    }
  }

  async listRepositoryDarIds(repositoryType: RepositoryType): Promise<string[]> {
    const query = `SELECT dar_id FROM harvested_records WHERE source_repository = $1`;
    const result = await this.pool.query(query, [repositoryType]);
    return result.rows.map((row) => row.dar_id).filter((row) => row != '');
  }

  async listRecordsByRepository(repositoryType: RepositoryType): Promise<DbRecord[]> {
    const query = `SELECT * FROM harvested_records WHERE source_repository = $1`;
    const result = await this.pool.query(query, [repositoryType]);
    return result.rows;
  }

  async listRecords(options?: {
    resolved?: boolean;
    repositories?: string[];
    title?: string;
    size?: number;
    offset?: number;
  }): Promise<{ records: DbRecord[]; totalCount: number }> {
    const values = [];
    const conditions = [];
    let paramCount = 1;

    if (options?.resolved !== undefined) {
      conditions.push(`CASE WHEN r.dar_id IS NOT NULL THEN true ELSE false END = $${paramCount}`);
      values.push(options.resolved);
      paramCount++;
    }

    if (options?.repositories && options.repositories.length > 0) {
      conditions.push(`h.source_repository = ANY($${paramCount})`);
      values.push(options.repositories);
      paramCount++;
    }

    if (options?.title) {
      conditions.push(`h.title ILIKE $${paramCount}`);
      values.push(`%${options.title}%`);
      paramCount++;
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    let query = `
      SELECT
        h.source_url, h.source_repository, h.dar_id, h.last_harvested, h.title, h.status,
        h.site_references, h.habitat_references, h.dataset_type, h.keywords,
        CASE WHEN r.dar_id IS NOT NULL THEN true ELSE false END AS is_resolved
      FROM harvested_records h
      LEFT JOIN resolved_records r ON h.dar_id = r.dar_id
      ${where}
      ORDER BY h.last_harvested DESC
  `;

    const countQuery = `
      SELECT COUNT(*)
      FROM harvested_records h
      LEFT JOIN resolved_records r ON h.dar_id = r.dar_id
      ${where}
    `;

    if (options?.size !== undefined) {
      query += ` LIMIT $${paramCount}`;
      values.push(options.size);
      paramCount++;
    }

    if (options?.offset !== undefined) {
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
      paramCount++;
    }

    const countResult = await this.pool.query(countQuery, values.slice(0, conditions.length));
    const recordsResult = await this.pool.query(query, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    return {
      records: recordsResult.rows,
      totalCount: totalCount,
    };
  }

  async listRepositoriesWithCount(options?: {
    resolved?: boolean;
    title?: string;
  }): Promise<{ source_repository: string; count: number }[]> {
    const values = [];
    const conditions = [];
    let paramCount = 1;

    let baseQuery = `
    FROM
      harvested_records h
  `;

    if (options?.resolved !== undefined) {
      baseQuery += `LEFT JOIN resolved_records r ON h.dar_id = r.dar_id`;
    }

    if (options?.resolved !== undefined) {
      conditions.push(`CASE WHEN r.dar_id IS NOT NULL THEN true ELSE false END = $${paramCount}`);
      values.push(options.resolved);
      paramCount++;
    }

    if (options?.title) {
      conditions.push(`h.title ILIKE $${paramCount}`);
      values.push(`%${options.title}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const finalQuery = `
    SELECT
      h.source_repository as source_repository,
      count(h.source_repository) as count
    ${baseQuery}
    ${whereClause}
    GROUP BY
      h.source_repository
    ORDER BY
      count(h.source_repository) DESC
  `;

    const result = await this.pool.query(finalQuery, values);
    return result.rows;
  }

  async updateDarId(source_url: string, record: Partial<DbRecord>): Promise<void> {
    const query = `
      UPDATE harvested_records
      SET dar_id = $2
      WHERE source_url = $1
    `;
    const values = [source_url, record.dar_id];
    await this.pool.query(query, values);
  }

  // This is an edge case, but sometimes repository owners have versioning, and therefore the souce url changes.
  // First source_url is the one that we are looking for, and we are replacing the value with source_url from the record structure.
  async updateRecordWithPrimaryKey(source_url: string, record: Partial<DbRecord>): Promise<void> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (record.source_url !== undefined) {
      setParts.push(`source_url = $${paramCount++}`);
      values.push(record.source_url);
    }
    if (record.source_checksum !== undefined) {
      setParts.push(`source_checksum = $${paramCount++}`);
      values.push(record.source_checksum);
    }
    if (record.dar_checksum !== undefined) {
      setParts.push(`dar_checksum = $${paramCount++}`);
      values.push(record.dar_checksum);
    }
    if (record.status !== undefined) {
      setParts.push(`status = $${paramCount++}`);
      values.push(record.status);
    }
    if (record.title !== undefined) {
      setParts.push(`title = $${paramCount++}`);
      values.push(record.title);
    }
    if (record.site_references !== undefined) {
      setParts.push(`site_references = $${paramCount++}`);
      values.push(record.site_references ? JSON.stringify(record.site_references) : null);
    }
    if (record.habitat_references !== undefined) {
      setParts.push(`habitat_references = $${paramCount++}`);
      values.push(record.habitat_references ? JSON.stringify(record.habitat_references) : null);
    }
    if (record.dataset_type !== undefined) {
      setParts.push(`dataset_type = $${paramCount++}`);
      values.push(record.dataset_type ? JSON.stringify(record.dataset_type) : null);
    }
    if (record.keywords !== undefined) {
      setParts.push(`keywords = $${paramCount++}`);
      values.push(record.keywords ? JSON.stringify(record.keywords) : null);
    }

    setParts.push(`last_harvested = NOW()`);
    setParts.push(`last_seen_at = NOW()`);

    values.push(source_url);
    const query = `
      UPDATE harvested_records
      SET ${setParts.join(', ')}
      WHERE source_url = $${paramCount}
    `;
    await this.pool.query(query, values);
  }

  /**
   * Updates the source_url (primary key) of a record.
   * This is used for migrations when externalSourceURI changes.
   * @param oldSourceUrl The current source_url
   * @param newSourceUrl The new source_url to set
   */
  async updateRecordSourceUrl(oldSourceUrl: string, newSourceUrl: string): Promise<void> {
    const query = `
      UPDATE harvested_records
      SET source_url = $1, last_seen_at = NOW()
      WHERE source_url = $2
    `;
    const values = [newSourceUrl, oldSourceUrl];
    await this.pool.query(query, values);
  }

  async updateRepositoryToInProgress(repositoryType: RepositoryType): Promise<void> {
    const query = `
      UPDATE harvested_records
      SET status = 'in_progress'
      WHERE source_repository = $1
    `;
    const values = [repositoryType];
    await this.pool.query(query, values);
  }

  async getRecordByDarId(darId: string): Promise<DbRecord | null> {
    const query = `SELECT * FROM harvested_records WHERE dar_id = $1 LIMIT 1`;
    const result = await this.pool.query(query, [darId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getRecordBySourceUrl(sourceId: string): Promise<DbRecord[]> {
    const query = `SELECT * FROM harvested_records WHERE source_url = $1`;
    const result = await this.pool.query(query, [sourceId]);
    return result.rows;
  }

  async deleteRecord(sourceId: string): Promise<void> {
    const query = `
      DELETE FROM harvested_records
      WHERE source_url = $1
    `;
    await this.pool.query(query, [sourceId]);
  }

  async updateLastSeen(sourceUrl: string): Promise<void> {
    const query = `
      UPDATE harvested_records
      SET last_seen_at = NOW()
      WHERE source_url = $1
    `;
    await this.pool.query(query, [sourceUrl]);
  }

  async deleteUnseenRecords(repositoryType?: RepositoryType, daysSinceLastSeen: number = 90): Promise<string[]> {
    let query = `
      DELETE FROM harvested_records
      WHERE (last_seen_at IS NULL OR last_seen_at < NOW() - INTERVAL '${daysSinceLastSeen} days')
        AND dar_id NOT IN (
          SELECT DISTINCT dar_id FROM record_rules WHERE dar_id IS NOT NULL
        )
        AND dar_id NOT IN (
          SELECT DISTINCT dar_id FROM resolved_records WHERE dar_id IS NOT NULL
        )
        AND dar_id IS NOT NULL
    `;
    const values: any[] = [];

    if (repositoryType) {
      query += ` AND source_repository = $1`;
      values.push(repositoryType);
    }

    query += ` RETURNING dar_id`;

    const result = await this.pool.query(query, values);
    return result.rows.map((row) => row.dar_id).filter((id): id is string => id !== null);
  }
}
