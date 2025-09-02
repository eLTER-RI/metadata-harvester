import { Pool } from 'pg';
import { RepositoryType } from './commonStructure';

export interface DbRecord {
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
            SET source_url = $ 1, source_checksum = $2, dar_checksum = $3, status = $4, last_harvested = NOW()
            WHERE source_url = $5
        `;
    const values = [record.source_url, record.source_checksum, record.dar_checksum, record.status, source_url];
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
