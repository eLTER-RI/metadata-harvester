import { log } from '../services/serviceLogging';
import { CommonDataset } from '../store/commonStructure';

export function flipCreatorName(data: CommonDataset, index: number) {
  if (!data?.metadata?.creators || data?.metadata?.creators.length < index + 1) {
    log('error', `No creators to flip given name with family name.`);
    return;
  }

  const previousGivenName = data?.metadata?.creators[index].creatorGivenName;
  const previousFamilyName = data?.metadata?.creators[index].creatorFamilyName;
  data.metadata.creators[index].creatorGivenName = previousFamilyName;
  data.metadata.creators[index].creatorFamilyName = previousGivenName;
}

export function flipContributorName(data: CommonDataset, index: number) {
  if (!data?.metadata?.contributors || data?.metadata?.contributors.length < index + 1) {
    log('error', `No contributors to flip given name with family name.`);
    return;
  }

  const previousGivenName = data.metadata.contributors[index].contributorGivenName;
  const previousFamilyName = data?.metadata?.contributors[index].contributorFamilyName;
  data.metadata.contributors[index].contributorGivenName = previousFamilyName;
  data.metadata.contributors[index].contributorFamilyName = previousGivenName;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const TRANSFORMER_FUNCTIONS = new Map<string, Function>([
  ['flipCreatorName', flipCreatorName],
  ['flipContributorName', flipContributorName],
]);

export function executeTransformer(name: string, value: any, args: any[] = []): any {
  const func = TRANSFORMER_FUNCTIONS.get(name);
  if (func) {
    return func(value, ...args);
  }
  return value;
}
