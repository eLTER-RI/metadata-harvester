import { Pool } from 'pg';
import { RepositoryType } from '../commonStructure';

export interface MappingRule {
  id: number;
  repository_type: RepositoryType;
  source_path: string;
  target_path: string;
  rule_type: 'COPY' | 'TRANSFORM' | 'DEFAULT_VALUE';
  options?: {
    transform_function?: string;
    defaultValue?: any;
  };
  condition?: {
    path: string;
    operator: 'equals' | 'contains' | 'starts_with';
    value: any;
  };
}

export class MappingRulesDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }
}
