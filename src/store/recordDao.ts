import { Pool } from 'pg';

interface DbRecord {
  source_id: string;
  source_repository: string;
  source_checksum: string;
  dar_id: string;
  dar_checksum: string;
  status: string;
  last_harvested: Date;
}

export class RecordDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRecord(record: Omit<DbRecord, 'last_harvested'>): Promise<void> {
    const query = `
            INSERT INTO harvested_records (source_id, source_repository, source_checksum, dar_id, dar_checksum, status, last_harvested)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `;
    const values = [
      record.source_id,
      record.source_repository,
      record.source_checksum,
      record.dar_id,
      record.dar_checksum,
      record.status,
    ];
    await this.pool.query(query, values);
  }

  async updateRecord(source_id: string, record: Partial<DbRecord>): Promise<void> {
    const query = `
            UPDATE records
            SET source_checksum = $1, dar_checksum = $2, status = $3, last_harvested = NOW()
            WHERE source_id = $4
        `;
    const values = [record.source_checksum, record.dar_checksum, record.status, source_id];
    await this.pool.query(query, values);
  }

  async deleteRecord(sourceId: string): Promise<void> {
    const query = `
            DELETE FROM harvested_records
            WHERE source_id = $1
        `;
    await this.pool.query(query, [sourceId]);
  }
}
