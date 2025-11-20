import { Pool } from 'pg';
import { log } from './serviceLogging';
import { RepositoryType } from '../models/commonStructure';
import { RecordDao } from '../store/dao/recordDao';
import { RuleDao, RuleDbRecord } from '../store/dao/rulesDao';
import { HarvesterContext, startRecordSync } from './jobs/harvest/harvester';

export interface CreateRuleRequest {
  target_path: string;
  before_value: any;
  after_value: any;
}

export interface CreateRulesResult {
  success: boolean;
  processedCount?: number;
  processedPaths?: string[];
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Validates rule data structure.
 * @param {CreateRuleRequest[]} rulesData Array of rules to validate.
 * @returns {string | null} Error message for failed validation.
 */
function validateRulesData(rulesData: CreateRuleRequest[]): string | null {
  if (!Array.isArray(rulesData) || rulesData.length === 0) {
    return 'Invalid rules data. Expected non-empty array.';
  }

  for (const rule of rulesData) {
    if (
      !rule.target_path ||
      !Object.prototype.hasOwnProperty.call(rule, 'before_value') ||
      !Object.prototype.hasOwnProperty.call(rule, 'after_value')
    ) {
      return 'Invalid rule data. All rules must have target_path, before_value, and after_value.';
    }

    // Allow null before_value (for new fields) or null after_value (for removed fields)
    if (rule.before_value === null && rule.after_value === null) {
      return 'Invalid rule data. Either before_value or after_value must not be null.';
    }
  }

  return null;
}

/**
 * Creates or updates rules for a record and triggers a re-harvest.
 * @param {Pool} pool Database connection pool.
 * @param {string} darId The DAR ID of the record.
 * @param {CreateRuleRequest[]} rulesData Array of rules to create or update.
 * @returns {Promise<CreateRulesResult>} Result object.
 */
export async function createRulesForRecord(
  pool: Pool,
  darId: string,
  rulesData: CreateRuleRequest[],
): Promise<CreateRulesResult> {
  const validationError = validateRulesData(rulesData);
  if (validationError) {
    return {
      success: false,
      error: validationError,
      statusCode: 400,
    };
  }

  // Check if record exists
  const recordDao = new RecordDao(pool);
  const record = await recordDao.getRecordByDarId(darId);
  if (!record || !record?.source_url || !record?.source_repository) {
    return {
      success: false,
      error: `Record with dar id ${darId} not found`,
      statusCode: 404,
    };
  }

  // Process rules
  const ruleDao = new RuleDao(pool);
  const processedRules: string[] = [];

  for (const rule of rulesData) {
    const wasProcessed = await ruleDao.createOrUpdateRule(darId, rule.target_path, rule.before_value, rule.after_value);

    if (wasProcessed) {
      processedRules.push(rule.target_path);
    }
  }

  if (processedRules.length === 0) {
    return {
      success: true,
      processedCount: 0,
      processedPaths: [],
      message: 'No rules needed - all values are unchanged.',
    };
  }

  log('info', `Processed ${processedRules.length} rules for ${darId}: ${processedRules.join(', ')}`);

  // Trigger re-harvest
  const repositoryType = record.source_repository.toUpperCase() as RepositoryType;
  const context = await HarvesterContext.create(pool, repositoryType, false);
  try {
    await startRecordSync(context, record.source_url);
    log('info', `Re-harvest job for ${record.source_url} completed successfully.`);
  } catch (e) {
    log('error', `Re-harvest job for ${record.source_url} failed with error: ${e}`);
  }

  return {
    success: true,
    processedCount: processedRules.length,
    processedPaths: processedRules,
    message: `${processedRules.length} rules processed successfully.`,
  };
}

export interface DeleteRuleResult {
  success: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Deletes a rule by its ID and triggers a re-harvest if the record exists.
 * @param {Pool} pool Database connection pool.
 * @param {string} darId The DAR ID of the record.
 * @param {string} ruleId The ID of the rule to delete.
 * @returns {Promise<DeleteRuleResult>} Result object.
 */
export async function deleteRuleForRecord(pool: Pool, darId: string, ruleId: string): Promise<DeleteRuleResult> {
  const ruleDao = new RuleDao(pool);
  await ruleDao.deleteRule(ruleId);

  const recordDao = new RecordDao(pool);
  const record = await recordDao.getRecordByDarId(darId);
  if (record) {
    log('info', `Rule ${ruleId} deleted for ${darId}. Triggering single record re-harvest.`);
    const repositoryType = record.source_repository.toUpperCase() as RepositoryType;
    const context = await HarvesterContext.create(pool, repositoryType, false);
    try {
      await startRecordSync(context, record.source_url);
      log('info', `Re-harvest job for ${record.source_url} completed successfully.`);
    } catch (e) {
      log('error', `Re-harvest job for ${record.source_url} failed with error: ${e}`);
    }
  }

  return {
    success: true,
  };
}

export interface GetRulesResult {
  success: boolean;
  rules?: RuleDbRecord[];
  error?: string;
  statusCode?: number;
}

/**
 * Retrieves all rules for a record.
 * @param {Pool} pool Database connection pool.
 * @param {string} darId The DAR ID of the record.
 * @returns {Promise<GetRulesResult>} Result object.
 */
export async function getRulesForRecord(pool: Pool, darId: string): Promise<GetRulesResult> {
  const ruleDao = new RuleDao(pool);
  const rules = await ruleDao.getRulesForRecord(darId);

  return {
    success: true,
    rules,
  };
}
