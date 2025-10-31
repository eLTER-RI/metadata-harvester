import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import keys from 'lodash/keys';

// Rule generation types and functions
export type Rule = {
  dar_id: string;
  target_path: string;
  before_value: any;
  after_value: any;
};

/**
 * Manages setting the object's value at path's destination to a given value.
 * @param {any} obj The object that the function is supposed to rewrite.
 * @param {string} path A path in the object, like 'metadata.descriptions[0].descriptionText'
 * @param {any} value Value to use as a value on 'path'.
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  if (value === null) {
    return;
  }
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    const arrayMatch = part.match(/(\w+)\[(\d+)\]/);

    if (!arrayMatch && isLastPart) {
      current[part] = value;
      return;
    }
    if (!arrayMatch && !current[part]) {
      current[part] = {};
      return;
    }
    if (!arrayMatch) {
      current = current[part];
      continue;
    }

    const arrayName = arrayMatch[1];
    const index = parseInt(arrayMatch[2], 10);
    if (!current[arrayName]) {
      current[arrayName] = [];
      return;
    }
    if (isLastPart) {
      current[arrayName][index] = value;
      return;
    }
    if (!current[arrayName][index]) {
      current[arrayName][index] = {};
    }
    current = current[arrayName][index];
  }
}

/**
 * This function gets the value from nested parts of the structure.
 * @param {any} obj The object that the function is supposed to search in.
 * @param {string} path A path in the object, like 'metadata.descriptions[0].descriptionText'
 */
export function getNestedValue(obj: any, path: string): any {
  if (obj === null || obj === undefined || !path) {
    return undefined;
  }

  // normalizes [0] into .0
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');

  // remove leading dots
  const cleanPath = normalizedPath.startsWith('.') ? normalizedPath.substring(1) : normalizedPath;

  const parts = cleanPath.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Appends a value at path's destination.
 * @param {any} obj The object that the function is supposed to rewrite.
 * @param {string} path A path in the object, like 'metadata.descriptions[0].descriptionText'
 * @param {any} value Value to use as a value on 'path'.
 */
export function appendValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    if (isLastPart) {
      if (!Array.isArray((current as any)[part])) {
        (current as any)[part] = [];
      }
      (current as any)[part].push(value);
      return;
    }

    if (!(current as any)[part]) {
      (current as any)[part] = {};
    }
    current = (current as any)[part];
  }
}

/**
 * @param {any} value The object that the function is supposed to check if it is empty.
 * Works recursively for objects and arrays.
 */

export const isEmptyValue = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return false;
  if (typeof value === 'boolean') return false;
  if (isArray(value)) return value.length === 0 || value.every(isEmptyValue);
  if (isObject(value)) {
    const values = Object.values(value);
    const result = values.length === 0 || values.every(isEmptyValue);
    return result;
  }
  return false;
};

/**
 * @param {any} obj The object that the function is supposed to clean empty structures from.
 * Works recursively for objects and arrays.
 */
export const cleanEmptyStructures = (obj: any): any => {
  if (isEmptyValue(obj)) return undefined;

  if (isArray(obj)) {
    const cleaned = obj.map(cleanEmptyStructures).filter((item) => !isEmptyValue(item));
    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (isObject(obj)) {
    const cleaned: any = {};
    let hasAnyValue = false;

    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanEmptyStructures(value);
      if (!isEmptyValue(cleanedValue)) {
        cleaned[key] = cleanedValue;
        hasAnyValue = true;
      }
    }

    return hasAnyValue ? cleaned : undefined;
  }

  return obj;
};

/**
 * Applies given rule set by users.
 * @param {any} data The object that the function is supposed to rewrite.
 * @param {Rule[]} rule Specific rules to apply.
 */
export const applyRulesToData = (data: any, rules: Rule[]): any => {
  if (!rules || rules.length === 0) {
    return data;
  }

  const result = JSON.parse(JSON.stringify(data));

  for (const rule of rules) {
    setNestedValue(result, rule.target_path, rule.after_value);
  }

  return result;
};

/**
 * Returns rules for the differences between the original and edited data.
 * If the original and edited data are the same, returns an empty array
 * For arrays, creates a rule for the entire array.
 * For objects, tries to find specific field differences.
 * @param {string} path The path to the object that the function is supposed to rewrite.
 * @param {any} originalData The original data to compare.
 * @param {any} editedData The edited data to compare.
 * @param {Rule[]} rules The array of rules to add to.
 * @param {string} darId The DAR ID to add to the rules.
 */
export const findDifferences = (path: string, originalData: any, editedData: any, rules: Rule[], darId: string) => {
  if (isEqual(originalData, editedData)) {
    return;
  }

  if (isArray(originalData) && isArray(editedData)) {
    rules.push({
      dar_id: darId,
      target_path: path,
      before_value: originalData,
      after_value: editedData,
    });
    return;
  }

  if (isObject(originalData) && isObject(editedData)) {
    // For objects, try to find specific field differences
    const allKeys = new Set([...keys(originalData), ...keys(editedData)]);
    let hasSpecificChanges = false;

    for (const key of allKeys) {
      const itemPath = path ? `${path}.${key}` : key;
      const originalValue = (originalData as any)[key];
      const editedValue = (editedData as any)[key];

      if (key in originalData && key in editedData) {
        // Key exists in both, find differences
        if (!isEqual(originalValue, editedValue)) {
          findDifferences(itemPath, originalValue, editedValue, rules, darId);
          hasSpecificChanges = true;
        }
      } else if (key in editedData) {
        // Key was ADDED
        rules.push({
          dar_id: darId,
          target_path: itemPath,
          before_value: originalValue ?? null,
          after_value: editedValue,
        });
        hasSpecificChanges = true;
      } else {
        // Key was REMOVED
        rules.push({
          dar_id: darId,
          target_path: itemPath,
          before_value: originalValue,
          after_value: null,
        });
        hasSpecificChanges = true;
      }
    }

    if (!hasSpecificChanges && !isEqual(originalData, editedData)) {
      rules.push({
        dar_id: darId,
        target_path: path,
        before_value: originalData,
        after_value: editedData,
      });
    }
    return;
  }

  rules.push({
    dar_id: darId,
    target_path: path,
    before_value: originalData,
    after_value: editedData,
  });
};
