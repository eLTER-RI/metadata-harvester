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
  }): Promise<DbManualRecord | null> {
    const result = await this.pool.query(
      `
      INSERT INTO manual_records (dar_id, created_by, title, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `,
      [record.dar_id, record.created_by || null, record.title || null],
    );
    return result.rows.length > 0 ? (result.rows[0] as DbManualRecord) : null;
  }

  async getRecordByDarId(darId: string): Promise<DbManualRecord | null> {
    const result = await this.pool.query(`SELECT * FROM manual_records WHERE dar_id = $1 LIMIT 1`, [darId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async updateTitle(darId: string, title: string | null): Promise<DbManualRecord | null> {
    const result = await this.pool.query(`UPDATE manual_records SET title = $1 WHERE dar_id = $2 RETURNING *`, [
      title,
      darId,
    ]);
    return result.rows.length > 0 ? (result.rows[0] as DbManualRecord) : null;
  }

  async listRecords(options?: {
    size?: number;
    offset?: number;
    title?: string;
  }): Promise<{ records: DbManualRecord[]; totalCount: number }> {
    const values: any[] = [];
    const conditions: string[] = [];
    let paramCount = 1;

    if (options?.title) {
      conditions.push(`title ILIKE $${paramCount}`);
      values.push(`%${options.title}%`);
      paramCount++;
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    let query = `SELECT * FROM manual_records ${where} ORDER BY created_at DESC`;

    const countQuery = `SELECT COUNT(*) FROM manual_records ${where}`;

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

  async deleteRecord(id: number): Promise<void> {
    await this.pool.query(`DELETE FROM manual_records WHERE id = $1`, [id]);
  }
}
