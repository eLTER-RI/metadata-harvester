import { applyRulesToData, cleanEmptyStructures, findDifferences, Rule } from '../../../shared/utils';

export type { Rule };

/**
 * Generates rules for the differences between the original and edited data.
 * @param {any} originalData The original data to compare.
 * @param {any} editedData The edited data to compare.
 * @param {Rule[]} existingRules The existing rules to apply.
 * @param {string} darId The DAR ID to add to the rules.
 */
export const generateRules = (
  originalData: any,
  editedData: any,
  existingRules: Rule[] = [],
  darId: string,
): Rule[] => {
  const currentState = applyRulesToData(originalData, existingRules);

  const cleanedCurrent = cleanEmptyStructures(currentState);
  const cleanedEdited = cleanEmptyStructures(editedData);

  const rules: Rule[] = [];
  findDifferences('metadata', cleanedCurrent, cleanedEdited, rules, darId);

  return rules;
};
