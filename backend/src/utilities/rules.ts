import { cleanEmptyStructures, getNestedValue, setNestedValue } from '../../../shared/utils';
import { log } from '../services/serviceLogging';
import { CommonDataset } from '../models/commonStructure';
import { commonDatasetSchema } from '../models/commonStructure.zod.gen';
import { RuleDbRecord } from '../store/dao/rulesDao';
import _ from 'lodash';
const { isEqual } = _;

/**
 * Applies given rule set by users.
 * @param {CommonDataset} record The object that the function is supposed to rewrite.
 * @param {RuleDbRecord} rule Specific rule to apply.
 */
export function applyRuleToRecord(record: CommonDataset, rule: RuleDbRecord): boolean {
  if (rule.target_path.startsWith('metadata.externalSourceInformation')) {
    log(
      'info',
      `Rule for path '${rule.target_path}' not created: externalSourceInformation cannot be manually changed`,
    );
    return false;
  }

  const targetValue = getNestedValue(record, rule.target_path);

  // null, and empty arrays/objects considered equivalent

  const normalizedTargetValue = cleanEmptyStructures(targetValue);
  const normalizedBeforeValue = cleanEmptyStructures(rule.before_value);
  if (!isEqual(normalizedTargetValue, normalizedBeforeValue)) {
    log('info', `Rule for path '${rule.target_path}' not applied: current value doesn't match expected before value`);
    return false;
  }

  const recordCopy = JSON.parse(JSON.stringify(record));

  let afterValue = rule.after_value;
  if (afterValue === null) {
    afterValue = undefined;
  }

  setNestedValue(recordCopy, rule.target_path, afterValue);

  const finalValidation = commonDatasetSchema.safeParse(recordCopy);
  if (!finalValidation.success) {
    log(`error`, `Rule application failed validation for path '${rule.target_path}': ` + finalValidation.error);
    return false;
  }

  setNestedValue(record, rule.target_path, afterValue);
  log('info', `Rule applied successfully for path '${rule.target_path}'`);
  return true;
}
