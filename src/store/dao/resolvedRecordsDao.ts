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
}
