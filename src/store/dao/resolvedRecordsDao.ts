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
