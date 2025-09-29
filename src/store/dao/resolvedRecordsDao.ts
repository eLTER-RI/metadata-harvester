import { Pool, QueryResult } from 'pg';
import { DbRecord } from './recordDao';

export interface DbResolvedRecord {
  id: number;
  dar_id: string;
  resolved_at: Date;
  resolved_by?: string;
}

export class ResolvedRecordDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(darId: string, resolvedBy: string): Promise<void> {
    const query = `
      INSERT INTO resolved_records (dar_id, resolved_by, resolved_at)
      VALUES ($1, $2, NOW());
    `;
    const values = [darId, resolvedBy];
    await this.pool.query(query, values);
  }

  async delete(dar_id: string): Promise<void> {
    const query = `
      DELETE FROM resolved_records
      WHERE dar_id = $1
    `;
    await this.pool.query(query, [dar_id]);
  }

  async listResolvedUnresolvedCount(options?: {
    resolved?: boolean;
    repositories?: string[];
    title?: string;
  }): Promise<{ resolved: boolean; count: number }[]> {
    const values = [];
    const conditions = [];
    let paramCount = 1;

    const selectClause = `
      SELECT
        CASE WHEN r.dar_id IS NOT NULL THEN TRUE ELSE FALSE END AS resolved,
        COUNT(*) AS count
      FROM
        harvested_records h
      LEFT JOIN
        resolved_records r ON h.dar_id = r.dar_id
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const groupByClause = `
      GROUP BY
        resolved
      ORDER BY
        resolved DESC;
    `;

    const query = `${selectClause} ${whereClause} ${groupByClause}`;
    const result = await this.pool.query(query, values);
    return result.rows;
  }
  async getAllResolved(): Promise<DbRecord[]> {
    const query = `
      SELECT r.*
      FROM harvested_records h
      INNER JOIN resolved_records r ON h.dar_id = r.dar_id;
    `;
    const result: QueryResult<DbRecord> = await this.pool.query(query);
    return result.rows;
  }

  async getAllUnresolved(): Promise<DbRecord[]> {
    const query = `
      SELECT r.*
      FROM harvested_records h
      LEFT JOIN resolved_records r ON h.dar_id = r.dar_id
      WHERE r.dar_id IS NULL;
    `;
    const result: QueryResult<DbRecord> = await this.pool.query(query);
    return result.rows;
  }
}
