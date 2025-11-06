import { Pool } from 'pg';

export interface DbManualRecord {
  id: number;
  dar_id: string;
  created_at: Date;
  created_by: string | null;
  title: string | null;
}

export class ManualRecordDao {
  public pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRecord(record: {
    dar_id: string;
    created_by?: string | null;
    title?: string | null;
  }): Promise<DbManualRecord> {
    const result = await this.pool.query(
      `
      INSERT INTO manual_records (dar_id, created_by, title, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `,
      [record.dar_id, record.created_by || null, record.title || null],
    );
    return result.rows[0];
  }

  async listRecords(options?: {
    size?: number;
    offset?: number;
  }): Promise<{ records: DbManualRecord[]; totalCount: number }> {
    const [countResult, recordsResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) FROM manual_records`),
      this.pool.query(`SELECT * FROM manual_records ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [
        options?.size ?? null,
        options?.offset ?? 0,
      ]),
    ]);

    return {
      records: recordsResult.rows,
      totalCount: parseInt(countResult.rows[0].count, 10),
    };
  }

  async deleteRecord(id: number): Promise<void> {
    await this.pool.query(`DELETE FROM manual_records WHERE id = $1`, [id]);
  }
}
