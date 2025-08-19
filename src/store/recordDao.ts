import { Pool } from 'pg';
import { RepositoryType } from './commonStructure';

interface DbRecord {
  source_url: string;
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
    console.log(record);
    const query = `
            INSERT INTO harvested_records (source_url, source_repository, source_checksum, dar_id, dar_checksum, status, last_harvested)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `;
    const values = [
      record.source_url,
      record.source_repository,
      record.source_checksum,
      record.dar_id,
      record.dar_checksum,
      record.status,
    ];
    await this.pool.query(query, values);
  }

  async updateRecord(source_url: string, record: Partial<DbRecord>): Promise<void> {
    const query = `
            UPDATE harvested_records
            SET source_checksum = $1, dar_checksum = $2, status = $3, last_harvested = NOW()
            WHERE source_url = $4
        `;
    const values = [record.source_checksum, record.dar_checksum, record.status, source_url];
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
