import { isEqual, isObject, isArray, keys } from 'lodash';

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
