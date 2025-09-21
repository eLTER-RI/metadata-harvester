import { Pool } from 'pg';

export interface RuleDbRecord {
  dar_id: string;
  rule_type: 'REPLACE' | 'ADD' | 'REMOVE';
  target_path: string;
  orig_value: any;
  new_value?: any; // null if rule_type is remove
}

export class RuleDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRules(darId: string, rules: Omit<RuleDbRecord, 'dar_id'>[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const insertQuery = `
        INSERT INTO record_rules (dar_id, rule_type, target_path, orig_value, new_value)
        VALUES ($1, $2, $3, $4, $5);
      `;

      for (const rule of rules) {
        const values = [
          darId,
          rule.rule_type,
          rule.target_path,
          rule.new_value ? JSON.stringify(rule.new_value) : null,
        ];
        await client.query(insertQuery, values);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRulesForRecord(darId: string): Promise<RuleDbRecord[]> {
    const query = `
      SELECT dar_id, rule_type, target_path, orig_value, new_value
      FROM record_rules
      WHERE dar_id = $1;
    `;
    const result = await this.pool.query(query, [darId]);
    return result.rows;
  }

  async deleteRuleForRecord(darId: string): Promise<RuleDbRecord[]> {
    const query = `
      DELETE FROM record_rules
      WHERE dar_id = $1;
    `;
    const result = await this.pool.query(query, [darId]);
    return result.rows;
  }
}
