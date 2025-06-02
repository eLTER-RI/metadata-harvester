import { CONFIG } from '../../config';
import { SiteReference } from '../store/commonStructure';

export async function fetchSites(): Promise<any> {
  const response = await fetch(CONFIG.DEIMS_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sites: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

export function findMatchingUuid(text: string, sites: { id?: { suffix?: string } }[]): string[] | null {
  if (typeof text !== 'string') {
    console.warn('Expected a string for text, got:', typeof text);
    return null;
  }

  const uuids = sites.map((site) => site.id?.suffix).filter((uuid): uuid is string => typeof uuid === 'string');

  const pattern = uuids.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'ig');

  const matches = Array.from(text.matchAll(regex), (m) => m[0]);
  return matches.length > 0 ? matches : null;
}

export async function getMatchedSitesForRecord(recordData: any, sites: any): Promise<SiteReference[]> {
  const matchingDeimsIds = findMatchingUuid(JSON.stringify(recordData), sites);

  const matchedSites: SiteReference[] = matchingDeimsIds
    ? sites
        .filter((site: any) => matchingDeimsIds.includes(site.id.suffix))
        .map((site: any) => ({
          siteID: site.id.suffix,
          siteName: site.title,
        }))
    : [];

  return matchedSites;
}
