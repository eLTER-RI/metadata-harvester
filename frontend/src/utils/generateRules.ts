import { isEqual, isObject, isArray, keys } from 'lodash';

type Rule = {
  target_path: string;
} & (
  | { rule_type: 'REPLACE'; orig_value: any; new_value: any }
  | { rule_type: 'ADD'; new_value: any }
  | { rule_type: 'REMOVE'; orig_value: any }
);

const diffPrimitives = (path: string, originalNode: any, editedNode: any, rules: Rule[]) => {
  if (path) {
    rules.push({
      rule_type: 'REPLACE',
      target_path: path,
      orig_value: originalNode,
      new_value: editedNode,
    });
  }
};

const diffArrays = (path: string, originalArray: any[], editedArray: any[], rules: Rule[]) => {
  const origLength = originalArray.length;
  const newLength = editedArray.length;
  const longerLength = Math.max(origLength, newLength);
  // iterating in order to detect add/remove
  for (let i = 0; i < longerLength; i++) {
    const itemPath = `${path}[${i}]`;
    if (i < origLength && i < newLength) {
      // Item exists in both, find differences
      findDifferences(itemPath, originalArray[i], editedArray[i], rules);
    } else if (i < newLength) {
      // Item was ADDED
      rules.push({
        rule_type: 'ADD',
        target_path: itemPath,
        new_value: editedArray[i],
      });
    } else {
      // Item was REMOVED
      rules.push({
        rule_type: 'REMOVE',
        target_path: itemPath,
        orig_value: originalArray[i],
      });
    }
  }
};

const diffObjects = (path: string, originalObj: Record<string, any>, editedObj: Record<string, any>, rules: Rule[]) => {
  const allKeys = new Set([...keys(originalObj), ...keys(editedObj)]);

  for (const key of allKeys) {
    const itemPath = path ? `${path}.${key}` : key;
    const originalValue = originalObj[key];
    const editedValue = editedObj[key];

    if (key in originalObj && key in editedObj) {
      // Key exists in both, find differences
      findDifferences(itemPath, originalValue, editedValue, rules);
    } else if (key in editedObj) {
      // Key was ADDED
      rules.push({
        rule_type: 'ADD',
        target_path: itemPath,
        new_value: editedValue,
      });
    } else {
      // Key was REMOVED
      rules.push({
        rule_type: 'REMOVE',
        target_path: itemPath,
        orig_value: originalValue,
      });
    }
  }
};

const findDifferences = (path: string, originalNode: any, editedNode: any, rules: Rule[]) => {
  console.log('path: ', path);
  console.log('original node: ', originalNode);
  console.log('edited node: ', editedNode);
  if (isEqual(originalNode, editedNode)) {
    return;
  }

  if (isArray(originalNode) && isArray(editedNode)) {
    diffArrays(path, originalNode, editedNode, rules);
    return;
  }

  if (isObject(originalNode) && isObject(editedNode)) {
    diffObjects(path, originalNode, editedNode, rules);
    return;
  }

  // either a type mismatch (object vs array) or a primitive type
  diffPrimitives(path, originalNode, editedNode, rules);
};

export const generateRules = (originalData: any, editedData: any): Rule[] => {
  console.log(editedData);
  const rules: Rule[] = [];
  findDifferences('', originalData, editedData, rules);
  return rules;
};
