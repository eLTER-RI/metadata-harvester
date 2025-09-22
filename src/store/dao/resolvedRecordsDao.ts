import { Pool } from 'pg';

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

  async create(record: Omit<DbResolvedRecord, 'last_harvested'>): Promise<void> {
    const query = `
      INSERT INTO resolved_records (dar_id, resolved_by, resolved_at)
      VALUES ($1, $2, NOW());
    `;
    const values = [record.dar_id, record.resolved_by];
    await this.pool.query(query, values);
  }
}
