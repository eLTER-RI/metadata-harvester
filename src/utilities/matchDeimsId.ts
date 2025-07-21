import { CONFIG } from '../../config';
import { fetchJson } from '../services/pullAllData';
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

export function mapUuidsToSiteReferences(matchedUuids: string[] | null, sites: any[]): SiteReference[] {
  if (!matchedUuids || matchedUuids.length === 0) {
    return [];
  }

  const uniqueMatchedSites: SiteReference[] = [];
  const seenUuids = new Set<string>();

  for (const matchedUuid of matchedUuids) {
    const site = sites.find((s: any) => s.id?.suffix === matchedUuid);
    if (site && !seenUuids.has(matchedUuid)) {
      uniqueMatchedSites.push({
        siteID: site.id.suffix,
        siteName: site.title,
      });
      seenUuids.add(matchedUuid);
    }
  }
  return uniqueMatchedSites;
}

async function getDeimsSiteFromDeimsDataset(deimsDatasetUrl: string, sites: any): Promise<SiteReference[]> {
  const deimsDatasetUrlRegex = /(https:\/\/deims\.org\/dataset\/([0-9a-fA-F-]{36}))/;
  let deimsDatasetUrlFromMetadata: string | null = null;
  const match = deimsDatasetUrl.match(deimsDatasetUrlRegex);

  if (match && match[1]) {
    deimsDatasetUrlFromMetadata = match[1];
  }

  if (deimsDatasetUrlFromMetadata) {
    const deimsApiUrl = deimsDatasetUrlFromMetadata.replace('/dataset/', '/api/datasets/');
    try {
      const deimsApiResponse = await fetchJson(deimsApiUrl);
      if (
        deimsApiResponse &&
        deimsApiResponse.attributes?.general?.relatedSite &&
        Array.isArray(deimsApiResponse.attributes.general.relatedSite) &&
        deimsApiResponse.attributes.general.relatedSite.length > 0
      ) {
        const firstRelatedSite = deimsApiResponse.attributes.general.relatedSite[0];
        if (firstRelatedSite.id?.suffix) {
          const externalRelatedSiteUuid = firstRelatedSite.id.suffix;
          const siteFromExternalUuid = mapUuidsToSiteReferences([externalRelatedSiteUuid], sites);

          if (siteFromExternalUuid.length > 0) {
            return siteFromExternalUuid;
          }
        }
      }
    } catch (error) {
      process.stdout.write(`Error fetching DEIMS API ${deimsApiUrl}: ${error}\n`);
    }
  }
  return [];
}

export async function getB2ShareMatchedSites(recordData: any, sites: any): Promise<SiteReference[]> {
  let matchedSites: SiteReference[] = [];

  // We prioritize sites in metadata
  const matchedUuidsFromMetadata = findMatchingUuid(JSON.stringify(recordData.metadata), sites);
  if (matchedUuidsFromMetadata) {
    matchedSites = mapUuidsToSiteReferences(matchedUuidsFromMetadata, sites);
    if (matchedSites.length > 0) {
      return matchedSites;
    }
  }

  const matchedFromMetadata = await getDeimsSiteFromDeimsDataset(JSON.stringify(recordData.metadata), sites);
  if (matchedFromMetadata.length > 0) {
    return matchedFromMetadata;
  }

  const matchedUuidsFromFullRecord = findMatchingUuid(JSON.stringify(recordData), sites);
  if (matchedUuidsFromFullRecord) {
    matchedSites = mapUuidsToSiteReferences(matchedUuidsFromFullRecord, sites);
    if (matchedSites.length > 0) {
      console.log('Site ', matchedSites, 'found outside metadata');
      return matchedSites;
    }
  }

  return [];
}

export async function getSitesMatchedSites(): Promise<SiteReference[]> {
  // TODO
  return [];
}
