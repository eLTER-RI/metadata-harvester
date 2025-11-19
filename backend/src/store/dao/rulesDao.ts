import { Pool } from 'pg';

export interface RuleDbRecord {
  id: string;
  dar_id: string;
  target_path: string;
  before_value: any;
  after_value: any;
}

export class RuleDao {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRules(darId: string, rules: Partial<RuleDbRecord>[]): Promise<number> {
    const client = await this.pool.connect();
    let createdCount = 0;

    try {
      await client.query('BEGIN');

      // replace existing rules for the same path to prevent conflicts
      // for updates only update after_value
      const upsertQuery = `
        INSERT INTO record_rules (dar_id, target_path, before_value, after_value)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (dar_id, target_path) 
        DO UPDATE SET 
          after_value = EXCLUDED.after_value;
      `;

      for (const rule of rules) {
        const values = [
          darId,
          rule.target_path,
          rule.before_value !== undefined ? JSON.stringify(rule.before_value) : null,
          rule.after_value !== undefined ? JSON.stringify(rule.after_value) : null,
        ];
        const result = await client.query(upsertQuery, values);

        createdCount += result.rowCount || 0;
      }

      await client.query('COMMIT');

      return createdCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createOrUpdateRule(darId: string, targetPath: string, beforeValue: any, afterValue: any): Promise<boolean> {
    const existingRule = await this.getRuleByPath(darId, targetPath);

    if (!existingRule) {
      await this.createRules(darId, [
        {
          target_path: targetPath,
          before_value: beforeValue,
          after_value: afterValue,
        },
      ]);
      return true;
    }

    const originalValue = existingRule.before_value;
    const currentValue = existingRule.after_value;
    const newValue = afterValue;
    // the rule updates to the original value
    if (JSON.stringify(originalValue) === JSON.stringify(newValue)) {
      await this.deleteRule(existingRule.id);
      return true;
    }

    if (JSON.stringify(newValue) !== JSON.stringify(currentValue)) {
      // update only the after_value
      await this.createRules(darId, [
        {
          target_path: targetPath,
          before_value: existingRule.before_value,
          after_value: afterValue,
        },
      ]);
      return true;
    }
    return false;
  }

  async getRulesForRecord(darId: string): Promise<RuleDbRecord[]> {
    const query = `
      SELECT id, dar_id, target_path, before_value, after_value
      FROM record_rules
      WHERE dar_id = $1;
    `;
    const result = await this.pool.query(query, [darId]);
    return result.rows;
  }

  async getRuleByPath(darId: string, targetPath: string): Promise<RuleDbRecord | null> {
    const query = `
      SELECT id, dar_id, target_path, before_value, after_value
      FROM record_rules
      WHERE dar_id = $1 AND target_path = $2;
    `;
    const result = await this.pool.query(query, [darId, targetPath]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deleteRuleForRecord(darId: string): Promise<RuleDbRecord[]> {
    const query = `
      DELETE FROM record_rules
      WHERE dar_id = $1;
    `;
    const result = await this.pool.query(query, [darId]);
    return result.rows;
  }

  async deleteRulesByPath(darId: string, targetPath: string): Promise<number> {
    const query = `
      DELETE FROM record_rules
      WHERE dar_id = $1 AND target_path = $2;
    `;
    const result = await this.pool.query(query, [darId, targetPath]);
    return result.rowCount || 0;
  }

  async deleteRule(id: string): Promise<RuleDbRecord[]> {
    const query = `
      DELETE FROM record_rules
      WHERE id = $1;
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows;
  }
}
