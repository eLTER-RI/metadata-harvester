import { Pool } from 'pg';
import { RepositoryType } from '../commonStructure';

export interface DbRecord {
  source_url: string;
  source_repository: string;
  source_checksum: string;
  dar_id: string;
  dar_checksum: string;
  status: string;
  last_harvested: Date;
  title: string | null;
}

export class RecordDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRecord(record: Omit<DbRecord, 'last_harvested'>): Promise<void> {
    const query = `
      INSERT INTO harvested_records (source_url, source_repository, source_checksum, dar_id, dar_checksum, status, last_harvested, title)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
    `;
    const values = [
      record.source_url,
      record.source_repository,
      record.source_checksum,
      record.dar_id,
      record.dar_checksum,
      record.status,
      record.title,
    ];
    await this.pool.query(query, values);
  }

  async updateRecord(source_url: string, record: Partial<DbRecord>): Promise<void> {
    const query = `
      UPDATE harvested_records
      SET source_repository = $1, source_checksum = $2, dar_id = $3, dar_checksum = $4, status = $5, last_harvested = NOW(), title = $6
      WHERE source_url = $7
    `;
    const values = [
      record.source_repository,
      record.source_checksum,
      record.dar_id,
      record.dar_checksum,
      record.status,
      record.title,
      source_url,
    ];
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
    const query = `
            UPDATE harvested_records
            SET status = $2
            WHERE source_url = $1
        `;
    const values = [source_url, record.status];
    await this.pool.query(query, values);
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
    repositories?: string[];
    title?: string;
  }): Promise<{ repository: string; count: number }[]> {
    const values = [];
    const conditions = [];
    let paramCount = 1;

    const query = `
      SELECT
        source_repository,
        count(*)
      FROM
        harvested_records
      GROUP BY
        source_repository
      ORDER BY
        count(*)
        DESC
    `;

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

    const result = await this.pool.query(query);
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
    const query = `
      UPDATE harvested_records
      SET source_url = $1, source_checksum = $2, dar_checksum = $3, status = $4, last_harvested = NOW(), title = $5
      WHERE source_url = $6
    `;
    const values = [
      record.source_url,
      record.source_checksum,
      record.dar_checksum,
      record.status,
      record.title,
      source_url,
    ];
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

  async getRecordBySourceId(sourceId: string): Promise<DbRecord[]> {
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
}
