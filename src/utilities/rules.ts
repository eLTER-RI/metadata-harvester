import { CommonDataset } from '../store/commonStructure';
import { RuleDbRecord } from '../store/dao/rulesDao';

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
 * @param {CommonDataset} record The object that the function is supposed to rewrite.
 * @param {RuleDbRecord} rule Specific rule to apply.
 */
export function applyRuleToRecord(record: CommonDataset, rule: RuleDbRecord): boolean {
  const targetValue = getNestedValue(record, rule.target_path);

  if (JSON.stringify(targetValue) !== JSON.stringify(rule.orig_value)) {
    return false;
  }

  switch (rule.rule_type) {
    case 'REPLACE':
      setNestedValue(record, rule.target_path, rule.new_value);
      break;
    case 'ADD':
      appendValue(record, rule.target_path, rule.new_value);
      break;
    case 'REMOVE':
      setNestedValue(record, rule.target_path, undefined);
      break;
  }

  return true;
}
