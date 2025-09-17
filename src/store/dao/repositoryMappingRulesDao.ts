import { Pool, QueryResult } from 'pg';
import { RepositoryType } from '../commonStructure';

export interface RepositoryMappingRule {
  id: number;
  repository_type: RepositoryType;
  source_path: string;
  target_path: string;
  rule_type: 'COPY' | 'TRANSFORM' | 'DEFAULT_VALUE';
  options?: {
    transform_function?: string;
    defaultValue?: any;
    args?: any;
  };
  condition?: {
    path: string;
    operator: 'equals' | 'contains' | 'starts_with';
    value: any;
  };
}

export class RepositoryMappingRulesDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getRulesByRepository(repositoryType: RepositoryType): Promise<RepositoryMappingRule[]> {
    const query = 'SELECT * FROM repository_mapping_rules WHERE repository_type = $1 ORDER BY id';
    const result: QueryResult<RepositoryMappingRule> = await this.pool.query(query, [repositoryType]);
    return result.rows;
  }

  async createRule(rule: Omit<RepositoryMappingRule, 'id'>): Promise<RepositoryMappingRule> {
    const query = `
      INSERT INTO repository_mapping_rules (repository_type, source_path, target_path, rule_type, options, condition)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      rule.repository_type,
      rule.source_path,
      rule.target_path,
      rule.rule_type,
      rule.options,
      rule.condition,
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}
