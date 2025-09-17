import { CommonDataset } from '../store/commonStructure';
import { RecordRewriteRule } from '../store/dao/recordRewriteRulesDao';
import { RepositoryMappingRule } from '../store/dao/repositoryMappingRulesDao';
import { executeTransformer } from './transformFunctions';

export function getNestedValue(obj: any, path: string): any {
  const objectParts = path.split('.');
  let currentPart = obj;
  for (const part of objectParts) {
    if (currentPart === null || currentPart === undefined) {
      return undefined;
    }
    currentPart = currentPart[part];
  }
  return currentPart;
}

export function checkCondition(recordData: CommonDataset, condition: any): boolean {
  if (!condition) return true;

  const valueToCheck = getNestedValue(recordData, condition.path);

  switch (condition.operator) {
    case 'equals':
      return valueToCheck === condition.value;
    case 'contains':
      return Array.isArray(valueToCheck)
        ? valueToCheck.includes(condition.value)
        : String(valueToCheck).includes(String(condition.value));
    case 'starts_with':
      return String(valueToCheck).startsWith(String(condition.value));
    default:
      return false;
  }
}

/**
 * Manages setting the object's value at path's destination to a given value.
 * @param {any} obj The object that the function is supposed to rewrite.
 * @param {string} path A path in the object, like 'metadata.descriptions[0].descriptionText
 * @param {any} value Value to use as a value on 'path'.
 */
export function setNestedValue(obj: any, path: string, value: any): void {
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
 * Appends a value at path's destination.
 * @param {any} obj The object that the function is supposed to rewrite.
 * @param {string} path A path in the object, like 'metadata.descriptions[0].descriptionText
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
 * Applies given rule set by users.
 * @param {CommonDataset} dataset The object that the function is supposed to rewrite.
 * @param {any} sourceValue New value to set into the dataset's destination.
 * @param {MappingRule} rule Specific rule to apply.
 */
export function applyRuleToDataset(dataset: CommonDataset, sourceValue: any, rule: RepositoryMappingRule): void {
  switch (rule.rule_type) {
    case 'COPY':
      setNestedValue(dataset, rule.target_path, sourceValue);
      break;
    case 'TRANSFORM':
      if (rule.options?.transform_function) {
        const transformedValue = executeTransformer(rule.options.transform_function, sourceValue, rule.options.args);
        setNestedValue(dataset, rule.target_path, transformedValue);
      }
      break;
    case 'DEFAULT_VALUE':
      if (getNestedValue(dataset, rule.target_path) === undefined) {
        setNestedValue(dataset, rule.target_path, rule?.options?.defaultValue);
      }
      break;
  }
}

export function applyRuleToRecord(dataset: CommonDataset, sourceValue: any, rule: RecordRewriteRule): void {
  switch (rule.rule_type) {
    case 'REPLACE':
      setNestedValue(dataset, rule.target_path, sourceValue);
      break;
    case 'ADD':
      appendValue(dataset, rule.target_path, sourceValue);
      break;
    case 'REMOVE':
      setNestedValue(dataset, rule.target_path, undefined);
      break;
  }
}
